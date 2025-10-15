import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    console.log("Fetching user ID for phone:", phone)

    // First get the user ID
    const users = await sql`SELECT id FROM users WHERE phone = ${phone}`

    if (users.length === 0) {
      return NextResponse.json({ bookings: [] })
    }

    const userId = users[0].id
    console.log("Found user ID:", userId)

    // Get just the bookings without any joins
    const bookings = await sql`
      SELECT * FROM bookings 
      WHERE user_id = ${userId}
      ORDER BY date DESC, time DESC
    `

    console.log("Found bookings:", bookings.length)

    // Map to expected format with safe defaults
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      service_date: booking.date,
      service_time: booking.time,
      status: booking.status || "Unknown",
      total_amount: booking.total_price || 0,
      created_at: booking.created_at,
      booking_period:
        booking.date < new Date()
          ? "past"
          : booking.date.toDateString() === new Date().toDateString()
            ? "present"
            : "future",
      service_name: "Service",
      service_type: "Pet Care",
      pet_name: "Pet",
      pet_type: "Pet",
      pet_breed: "Unknown",
      caretaker_name: "Caretaker",
      caretaker_phone: "",
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error("Error fetching all bookings:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
