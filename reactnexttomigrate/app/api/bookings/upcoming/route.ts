import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("🔍 Fetching next upcoming booking for user:", userId)

    // 1️⃣ Get next upcoming one-time booking
    const bookingResult = await sql`
      SELECT 
        b.id,
        b.date,
        b.time,
        b.status,
        b.total_price,
        b.notes,
        s.name AS service_name,
        p.name AS pet_name,
        p.image AS pet_image,
        p.type AS pet_type,
        COALESCE(u.name, 'Not assigned') AS sitter_name,
        sit.rating AS sitter_rating,
        false AS recurring,
        (b.date::timestamp + b.time::interval) AS start_at
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN sitters sit ON b.sitter_id = sit.id
      LEFT JOIN users u ON sit.user_id = u.id AND u.user_type = 'SITTER'
      WHERE b.user_id = ${userId}
        AND b.status IN ('PENDING', 'CONFIRMED', 'ASSIGNED', 'UPCOMING')
        AND (b.date::timestamp + b.time::interval) > NOW()
      ORDER BY start_at ASC
      LIMIT 1
    `

    // 2️⃣ Get next upcoming recurring session
    const recurringResult = await sql`
      SELECT 
        rb.id,
        rb.session_date AS date,
        rb.session_time AS time,
        rb.status,
        rb.session_price AS total_price,
        rb.notes,
        s.name AS service_name,
        p.name AS pet_name,
        p.image AS pet_image,
        p.type AS pet_type,
        COALESCE(u.name, 'Not assigned') AS sitter_name,
        sit.rating AS sitter_rating,
        true AS recurring,
        (rb.session_date::timestamp + rb.session_time::interval) AS start_at
      FROM recurring_booking rb
      LEFT JOIN services s ON rb.service_id = s.id
      LEFT JOIN pets p ON rb.pet_id = p.id
      LEFT JOIN sitters sit ON rb.sitter_id = sit.id
      LEFT JOIN users u ON sit.user_id = u.id AND u.user_type = 'SITTER'
      WHERE rb.user_id = ${userId}
        AND rb.status IN ('PENDING', 'CONFIRMED', 'ASSIGNED', 'UPCOMING')
        AND (rb.session_date::timestamp + rb.session_time::interval) > NOW()
      ORDER BY start_at ASC
      LIMIT 1
    `

    // 3️⃣ Compare both and return the nearest one
    const nextBooking =
      bookingResult.length === 0 && recurringResult.length === 0
        ? null
        : bookingResult.length === 0
          ? recurringResult[0]
          : recurringResult.length === 0
            ? bookingResult[0]
            : new Date(bookingResult[0].start_at).getTime() <
              new Date(recurringResult[0].start_at).getTime()
              ? bookingResult[0]
              : recurringResult[0]

    if (!nextBooking) {
      return NextResponse.json({ error: "No upcoming booking found" }, { status: 404 })
    }

    console.log("⏰ Next upcoming booking:", nextBooking)
    return NextResponse.json(nextBooking)
  } catch (error) {
    console.error("❌ Error fetching upcoming booking:", error)
    return NextResponse.json({ error: "Failed to fetch upcoming booking" }, { status: 500 })
  }
}
