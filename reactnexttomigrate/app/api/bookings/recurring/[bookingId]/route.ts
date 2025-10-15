import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Extract user ID from request headers (assuming middleware injects x-user-id)
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("x-user-id")
  return userId ?? null
}

export async function GET(request: NextRequest, { params }: { params: { bookingId: string } }) {
  try {
    console.log("🔍 Fetching recurring sessions for booking:", params.bookingId)

    // Authenticate user
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      console.error("❌ No authenticated user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify user owns the booking
    const bookingCheck = await sql`
      SELECT id FROM bookings 
      WHERE id = ${params.bookingId} AND user_id = ${userId}
    `
    if (bookingCheck.length === 0) {
      return NextResponse.json({ error: "Booking not found or access denied" }, { status: 404 })
    }

    // Fetch recurring sessions + start and end OTPs
    const sessions = await sql`
      SELECT 
        rb.id,
        rb.sequence_number,
        rb.session_date,
        rb.session_time,
        rb.duration,
        rb.session_price,
        rb.status,
        rb.payment_status,
        rb.notes,
        rb.service_started_at,
        rb.service_ended_at,
        rb.actual_duration,
        rb.created_at,
        rb.updated_at,
        s.id AS sitter_id,
        u.name AS sitter_name,
        u.phone AS sitter_phone,
        MAX(CASE WHEN so.type = 'START' THEN so.otp END) AS start_otp,
        MAX(CASE WHEN so.type = 'END' THEN so.otp END) AS end_otp
      FROM recurring_booking rb
      LEFT JOIN service_otps so ON rb.id = so.recurring_booking_id
      left join sitters s on rb.sitter_id = s.id
      left join users u on s.user_id = u.id
      WHERE rb.booking_id = ${params.bookingId}
      GROUP BY rb.id, s.id, u.name, u.phone
      ORDER BY rb.sequence_number ASC
    `

    console.log(`✅ Found ${sessions.length} recurring sessions`)

    // Format the sessions for response
    const formatted = sessions.map((s) => ({
      id: s.id,
      sequenceNumber: s.sequence_number,
      sessionDate: s.session_date,
      sessionTime: s.session_time,
      duration: s.duration,
      sessionPrice: Number.parseFloat(s.session_price || "0"),
      status: s.status,
      paymentStatus: s.payment_status,
      notes: s.notes,
      serviceStartedAt: s.service_started_at,
      serviceEndedAt: s.service_ended_at,
      actualDuration: s.actual_duration,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      startOtp: s.start_otp,
      endOtp: s.end_otp,
      sitterId: s.sitter_id,
      sitterName: s.sitter_name,
      sitterPhone: s.sitter_phone
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch recurring sessions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
