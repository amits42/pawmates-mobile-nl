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
    const { couponCode, bookingAmount, userId: requestUserId } = await request.json()

    // Get user ID from authentication
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Use the authenticated user ID, not the one from request body
    const validUserId = userId

    if (!couponCode || !bookingAmount) {
      return NextResponse.json({ error: "Coupon code and booking amount are required" }, { status: 400 })
    }

    console.log(`🎫 Validating coupon: ${couponCode} for user: ${validUserId}, amount: ${bookingAmount}`)

    // Step 1: Check if coupon exists and is active
    const coupons = await sql`
      SELECT * FROM coupons
      WHERE code = ${couponCode} 
      AND status = 'active'
      AND (start_date IS NULL OR start_date <= (NOW() AT TIME ZONE 'Asia/Kolkata'))
      AND (end_date   IS NULL OR end_date   >= (NOW() AT TIME ZONE 'Asia/Kolkata'));

    `

    if (coupons.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid or expired coupon code",
        },
        { status: 400 },
      )
    }

    const coupon = coupons[0]

    // Step 2: Check usage limits
    if (coupon.max_uses) {
      const totalUsage = await sql`
        SELECT COUNT(*) as usage_count 
        FROM coupon_redemptions 
        WHERE coupon_id = ${coupon.id}
      `

      if (Number.parseInt(totalUsage[0].usage_count) >= coupon.max_uses) {
        return NextResponse.json(
          {
            valid: false,
            error: "Coupon usage limit exceeded",
          },
          { status: 400 },
        )
      }
    }

    // Step 3: Check per-user limit
    if (coupon.per_user_limit) {
      const userUsage = await sql`
        SELECT COUNT(*) as user_usage_count 
        FROM coupon_redemptions 
        WHERE coupon_id = ${coupon.id} AND user_id = ${validUserId}
      `

      if (Number.parseInt(userUsage[0].user_usage_count) >= coupon.per_user_limit) {
        return NextResponse.json(
          {
            valid: false,
            error: "You have already used this coupon the maximum number of times",
          },
          { status: 400 },
        )
      }
    }

    // Step 4: Check user eligibility (coupon_targets)
    const targets = await sql`
      SELECT * FROM coupon_targets 
      WHERE coupon_id = ${coupon.id}
    `

    if (targets.length > 0) {
      const isEligible = targets.some((target) => {
        if (target.target_type === "ALL") return true
        if (target.target_type === "USER" && target.target_id === validUserId) return true
        // GROUP targeting would need additional logic based on your user groups system
        return false
      })

      if (!isEligible) {
        return NextResponse.json(
          {
            valid: false,
            error: "This coupon is not available for your account",
          },
          { status: 400 },
        )
      }
    }

    // Step 5: Calculate discount amount
    let discountAmount = 0
    if (coupon.discount_type === "percentage") {
      discountAmount = (Number.parseFloat(bookingAmount) * Number.parseFloat(coupon.discount_value)) / 100
    } else if (coupon.discount_type === "fixed") {
      discountAmount = Number.parseFloat(coupon.discount_value)
    }

    // Ensure discount doesn't exceed booking amount
    discountAmount = Math.min(discountAmount, Number.parseFloat(bookingAmount))

    const finalAmount = Number.parseFloat(bookingAmount) - discountAmount

    console.log(
      `✅ Coupon valid: ${coupon.discount_type} ${coupon.discount_value}, discount: ${discountAmount}, final: ${finalAmount}`,
    )

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
      },
      originalAmount: Number.parseFloat(bookingAmount),
      discountAmount: discountAmount,
      finalAmount: finalAmount,
    })
  } catch (error) {
    console.error("❌ Error validating coupon:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to validate coupon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
