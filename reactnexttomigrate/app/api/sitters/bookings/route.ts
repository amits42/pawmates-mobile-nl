import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // ✅ Get userId from header
    const userId = request.headers.get("x-user-id")

    console.log("Sitter bookings API - userId:", userId)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get sitter ID from user ID
    const sitterResult = await sql`
      SELECT id FROM sitters WHERE user_id = ${userId}
    `

    console.log("Sitter query result:", sitterResult)

    if (sitterResult.length === 0) {
      console.log("No sitter found for user ID:", userId)
      return NextResponse.json([]) // Return empty array instead of error
    }

    const sitterId = sitterResult[0].id
    console.log("Found sitter ID:", sitterId)

    // Get regular bookings
    const regularBookingsResult = await sql`
  SELECT 
    b.id,
    b.date,
    b.time,
    b.duration,
    b.status,
    b.total_price,
    b.notes,
    b.is_recurring,
    b.recurring_pattern,
    s.name AS service_name,
    p.name AS pet_name,
    p.type AS pet_type,
    u.name AS owner_name,
    p.breed,
    u.phone AS owner_phone,
    a.line1,
    a.city,
    a.state,
    'regular' AS booking_type
  FROM bookings b
  LEFT JOIN services s ON b.service_id = s.id
  LEFT JOIN pets p ON b.pet_id = p.id
  LEFT JOIN users u ON b.user_id = u.id
  LEFT JOIN addresses a ON b.address_id = a.id   
  WHERE b.sitter_id = ${sitterId}
    AND (b.is_recurring = false OR b.is_recurring IS NULL)
`


    // Get recurring booking sessions (✅ DISTINCT ON prevents duplicates)
    const recurringBookingsResult = await sql`
  SELECT DISTINCT ON (rb.id)
    rb.id,
    rb.session_date AS date,
    rb.session_time AS time,
    rb.duration,
    rb.status,
    rb.session_price AS total_price,
    rb.notes,
    false AS is_recurring,
    NULL AS recurring_pattern,
    s.name AS service_name,
    p.name AS pet_name,
    p.type AS pet_type,
    u.name AS owner_name,
    p.breed,
    u.phone AS owner_phone,
    a.line1,
    a.city,
    a.state,
    'recurring_session' AS booking_type,
    rb.sequence_number,
    rb.payment_status
  FROM recurring_booking rb
  LEFT JOIN services s ON rb.service_id = s.id
  LEFT JOIN pets p ON rb.pet_id = p.id
  LEFT JOIN users u ON rb.user_id = u.id
  LEFT JOIN bookings b ON rb.booking_id::text = b.id     
  LEFT JOIN addresses a ON b.address_id = a.id     
  WHERE rb.sitter_id = ${sitterId}
`


    console.log("Regular bookings query result:", regularBookingsResult)
    console.log("Recurring bookings query result:", recurringBookingsResult)

    // Combine results
    const allBookings = [
      ...(Array.isArray(regularBookingsResult) ? regularBookingsResult : []),
      ...(Array.isArray(recurringBookingsResult) ? recurringBookingsResult : []),
    ]

    const formattedBookings = allBookings.map((booking: any) => ({
      id: booking.id,
      date: booking.date,
      time: booking.time,
      service: booking.service_name || "Service",
      breed: booking.breed,
      petName: booking.pet_name || "Pet",
      petType: booking.pet_type || "Unknown",
      ownerName: booking.owner_name || "Owner",
      ownerPhone: booking.owner_phone || "",
      location:
        `${booking.line1 || ""}, ${booking.city || ""}, ${booking.state || ""}`
          .trim()
          .replace(/^,|,$/, "") || "Location not specified",
      status: booking.status ? booking.status.toLowerCase() : "pending",
      duration: booking.duration || 60,
      amount: Number.parseFloat(booking.total_price) || 0,
      notes: booking.notes,
      recurring: booking.is_recurring || false,
      recurringPattern: booking.recurring_pattern,
      bookingType: booking.booking_type,
      sequenceNumber: booking.sequence_number,
      paymentStatus: booking.payment_status,
    }))

    // Sort by date and time
    formattedBookings.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)
      return dateB.getTime() - dateA.getTime()
    })

    console.log("Formatted bookings:", formattedBookings)

    return NextResponse.json(formattedBookings)
  } catch (error) {
    console.error("Error fetching sitter bookings:", error)
    return NextResponse.json([]) // fail-safe
  }
}
