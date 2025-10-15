import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const userId = request.headers.get("X-User-ID")

    if (!bookingId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get existing tip for this booking
    const tips = await sql`
      SELECT * FROM service_tips 
      WHERE booking_id = ${bookingId} AND user_id = ${userId}
      LIMIT 1
    `

    return NextResponse.json({
      tip: tips.length > 0 ? tips[0] : null,
    })
  } catch (error) {
    console.error("Error fetching tip:", error)
    return NextResponse.json({ error: "Failed to fetch tip" }, { status: 500 })
  }
}
