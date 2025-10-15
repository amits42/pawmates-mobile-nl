export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { NextRequest } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("📊 Dashboard Stats: Fetching for user ID:", userId)

    // Get sitter ID first
    const sitterResult = await sql`
      SELECT id FROM sitters WHERE user_id = ${userId}
    `

    if (sitterResult.length === 0) {
      console.log("❌ Dashboard Stats: Zubo Walkers not found for user ID:", userId)
      return NextResponse.json({ error: "Zubo Walkers not found" }, { status: 404 })
    }

    const sitterId = sitterResult[0].id
    console.log("✅ Dashboard Stats: Found Zubo Walkers ID:", sitterId)

    // Get earnings and booking stats
    const bookingStats = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_price ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN total_price ELSE 0 END), 0) as this_month_earnings,
        COUNT(CASE WHEN status IN ('CONFIRMED', 'UPCOMING', 'PENDING') AND date >= CURRENT_DATE THEN 1 END) as upcoming_bookings,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings
      FROM bookings 
      WHERE sitter_id = ${sitterId}
    `

    // Get sitter rating from sitters table
    const sitterInfo = await sql`
      SELECT 
        rating,
        total_bookings
      FROM sitters 
      WHERE id = ${sitterId}
    `

    const bookingData = bookingStats[0]
    const sitterData = sitterInfo[0]

    const stats = {
      totalEarnings: Number.parseFloat(bookingData.total_earnings) || 0,
      thisMonthEarnings: Number.parseFloat(bookingData.this_month_earnings) || 0,
      upcomingBookings: Number.parseInt(bookingData.upcoming_bookings) || 0,
      completedBookings: Number.parseInt(bookingData.completed_bookings) || 0,
      rating: Number.parseFloat(sitterData?.rating) || 0,
      totalReviews: Number.parseInt(sitterData?.total_bookings) || 0,
    }

    console.log("✅ Dashboard Stats: Calculated stats:", stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("❌ Dashboard Stats: Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
