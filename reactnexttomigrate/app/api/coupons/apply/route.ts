import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Helper function to get the authenticated user ID from the request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("x-user-id")
  return userId ?? null
}

export async function POST(request: NextRequest) {
  try {
    const { couponCode, bookingId, recurringBookingId, discountAmount } = await request.json()

    // Get user ID from authentication
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!couponCode || !discountAmount) {
      return NextResponse.json({ error: "Coupon code and discount amount are required" }, { status: 400 })
    }

    if (!bookingId && !recurringBookingId) {
      return NextResponse.json({ error: "Either booking ID or recurring booking ID is required" }, { status: 400 })
    }

    console.log(`🎫 Applying coupon: ${couponCode} for user: ${userId}`)

    // Get coupon details
    const coupons = await sql`
      SELECT * FROM coupons 
      WHERE code = ${couponCode} 
      AND status = 'active'
    `

    if (coupons.length === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    const coupon = coupons[0]

    // Check if coupon has already been applied to this booking
    const existingRedemption = await sql`
  SELECT * FROM coupon_redemptions
  WHERE coupon_id = ${coupon.id}
    AND (
      (booking_id = ${bookingId} AND booking_id IS NOT NULL) OR
      (recurring_booking_id = ${recurringBookingId} AND recurring_booking_id IS NOT NULL)
    )
`;


    if (existingRedemption.length > 0) {
      return NextResponse.json({ error: "Coupon has already been applied to this booking" }, { status: 400 })
    }

    // Create redemption record
    const redemption = await sql`
      INSERT INTO coupon_redemptions (
        coupon_id, user_id, booking_id, recurring_booking_id, discount_amount
      ) VALUES (
        ${coupon.id}, 
        ${userId}, 
        ${bookingId || null}, 
        ${recurringBookingId || null}, 
        ${discountAmount}
      )
      RETURNING *
    `

    console.log(`✅ Coupon applied successfully: ${couponCode}, discount: ${discountAmount}`)

    return NextResponse.json({
      success: true,
      message: "Coupon applied successfully",
      redemption: {
        id: redemption[0].id,
        discountAmount: Number.parseFloat(redemption[0].discount_amount),
      },
    })
  } catch (error) {
    console.error("❌ Error applying coupon:", error)
    return NextResponse.json(
      {
        error: "Failed to apply coupon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
