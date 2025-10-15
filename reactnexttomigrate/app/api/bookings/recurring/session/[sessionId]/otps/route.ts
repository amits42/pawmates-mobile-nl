import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    console.log("🔐 Fetching OTPs for recurring session:", params.sessionId)

    // Get user ID from authentication
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify the session belongs to the user (through booking ownership)
    const sessionCheck = await sql`
      SELECT rb.id, rb.booking_id, b.user_id 
      FROM recurring_booking rb
      JOIN bookings b ON rb.booking_id::text = b.id
      WHERE rb.id = ${params.sessionId} AND b.user_id = ${userId}
    `

    if (sessionCheck.length === 0) {
      return NextResponse.json({ error: "Session not found or access denied" }, { status: 404 })
    }

    // Fetch OTPs for this recurring session
    const otps = await sql`
      SELECT type, otp, is_used, used_at, expires_at
      FROM service_otps
      WHERE recurring_booking_id = ${params.sessionId}
      ORDER BY type
    `

    console.log(`✅ Found ${otps.length} OTPs for session ${params.sessionId}`)

    // Format OTPs
    const otpData = {
      startOtp: otps.find((otp) => otp.type === "START")?.otp,
      endOtp: otps.find((otp) => otp.type === "END")?.otp,
      startUsed: otps.find((otp) => otp.type === "START")?.is_used || false,
      endUsed: otps.find((otp) => otp.type === "END")?.is_used || false,
    }

    return NextResponse.json(otpData)
  } catch (error) {
    console.error("❌ Error fetching session OTPs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch session OTPs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
