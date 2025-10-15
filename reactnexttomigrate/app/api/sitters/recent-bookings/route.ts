import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get sitter ID first
    const sitterResult = await sql`
      SELECT id FROM sitters WHERE user_id = ${userId}
    `

    if (sitterResult.length === 0) {
      return NextResponse.json({ error: "Zubo Walkers not found" }, { status: 404 })
    }

    const sitterId = sitterResult[0].id

    // Get recent bookings with service and pet details
    const bookingsResult = await sql`
      SELECT 
        b.id,
        b.date,
        b.time,
        b.status,
        b.total_price,
        b.notes,
        s.name as service_name,
        p.name as pet_name,
        p.type as pet_type,
        u.name as owner_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.sitter_id = ${sitterId}
      ORDER BY b.created_at DESC
      LIMIT 10
    `

    const recentBookings = bookingsResult.map((booking) => ({
      id: booking.id,
      petName: booking.pet_name || "Unknown Pet",
      service: booking.service_name || "Unknown Service",
      date: booking.date,
      time: booking.time,
      amount: Number.parseFloat(booking.total_price) || 0,
      status: booking.status,
      ownerName: booking.owner_name || "Unknown Owner",
      petType: booking.pet_type || "unknown",
      notes: booking.notes,
    }))

    return NextResponse.json(recentBookings)
  } catch (error) {
    console.error("Error fetching recent bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
