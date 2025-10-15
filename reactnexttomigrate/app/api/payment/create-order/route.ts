import { type NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { sql } from "@vercel/postgres"

export async function POST(request: NextRequest) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    console.log("✅ Razorpay instance created")

    const body = await request.json()
    const { bookingData } = body

    console.log("📋 Booking data received:", bookingData)

    // Validate required fields
    if (!bookingData?.serviceId || !bookingData?.petId) {
      return NextResponse.json({ error: "Missing required booking data" }, { status: 400 })
    }

    // Get user from request headers or body
    const userId = request.headers.get("x-user-id") || bookingData.userId
    if (!userId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 })
    }

    // 🔒 SECURITY: Server-side price validation
    // console.log("🔍 Validating service price...")
    // const serviceResult = await sql`
    //   SELECT id, name, price, duration 
    //   FROM services 
    //   WHERE id = ${bookingData.serviceId} AND is_active = true
    // `

    // if (serviceResult.rows.length === 0) {
    //   return NextResponse.json({ error: "Invalid service selected" }, { status: 400 })
    // }
    // const service = serviceResult.rows[0]
    // let expectedAmount = 0
    // if (bookingData.recurringPattern && bookingData.recurringPattern) {
    //   const sessions = calculateRecurringSessions(
    //     bookingData.date,
    //     bookingData.recurringEndDate,
    //     bookingData.recurringPattern,
    //   )
    //   expectedAmount = sessions * Number.parseFloat(service.price)
    // } else {
    //   expectedAmount = Number.parseFloat(service.price)
    // }

    // 🔒 SECURITY: Server-side price validation
    console.log("🔍 Validating service price...")
    const serviceResult = await sql`
      SELECT id, name, price, duration 
      FROM services 
      WHERE id = ${bookingData.serviceId} AND is_active = true
    `

    if (serviceResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid service selected" }, { status: 400 })
    }
    const service = serviceResult.rows[0]
    let expectedAmount = 0
    if (bookingData.recurringPattern && bookingData.recurringPattern) {
      const sessions = calculateRecurringSessions(
        bookingData.date,
        bookingData.recurringEndDate,
        bookingData.recurringPattern,
      )
      const times = bookingData.times?.length || 1;
      expectedAmount = sessions * Number.parseFloat(service.price) * times;
    } else {
      expectedAmount = Number.parseFloat(service.price)
    }

    let finalAmount = expectedAmount
    let appliedCoupon = null

    // Only validate coupons if both recurringBookingId and bookingId are NOT present
    if (bookingData.couponCode) {

      if (!bookingData.recurringBookingId && !bookingData.bookingId) {
        const coupons = await sql`
          SELECT * FROM coupons
              WHERE code = ${bookingData.couponCode} 
          AND status = 'active'
          AND (start_date IS NULL OR start_date <= (NOW() AT TIME ZONE 'Asia/Kolkata'))
          AND (end_date   IS NULL OR end_date   >= (NOW() AT TIME ZONE 'Asia/Kolkata'));
        `


        if (coupons.rows.length === 0) {
          return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 })
        }

        const coupon = coupons.rows[0];
        // Step 5: Calculate discount amount
        let discountAmount = 0
        if (coupon.discount_type === "percentage") {
          discountAmount = (expectedAmount * Number.parseFloat(coupon.discount_value)) / 100
        } else if (coupon.discount_type === "fixed") {
          discountAmount = Number.parseFloat(coupon.discount_value)
        }

        // Ensure discount doesn't exceed booking amount
        discountAmount = Math.min(discountAmount, expectedAmount)
        finalAmount = expectedAmount - discountAmount

        appliedCoupon = {
          id: coupon.id,
          code: coupon.code,
          discountAmount: discountAmount,
        }

        console.log("✅ Coupon validated server-side:", {
          code: coupon.code,
          originalAmount: expectedAmount,
          discountAmount: discountAmount,
          finalAmount: finalAmount,
        })
        console.log("🎫 Validating coupon server-side:", bookingData.couponCode)

        try {
          // Step 1: Check if coupon exists and is active


          // Step 2: Check usage limits
          if (coupon.max_uses) {
            const totalUsage = await sql`
            SELECT COUNT(*) as usage_count 
            FROM coupon_redemptions 
            WHERE coupon_id = ${coupon.id}
          `

            if (Number.parseInt(totalUsage.rows[0].usage_count) >= coupon.max_uses) {
              return NextResponse.json({ error: "Coupon usage limit exceeded" }, { status: 400 })
            }
          }

          // Step 3: Check per-user limit
          if (coupon.per_user_limit) {
            const userUsage = await sql`
            SELECT COUNT(*) as user_usage_count 
            FROM coupon_redemptions 
            WHERE coupon_id = ${coupon.id} AND user_id = ${userId}
          `

            if (Number.parseInt(userUsage.rows[0].user_usage_count) >= coupon.per_user_limit) {
              return NextResponse.json(
                { error: "You have already used this coupon the maximum number of times" },
                { status: 400 },
              )
            }
          }

          // Step 4: Check user eligibility (coupon_targets)
          const targets = await sql`
          SELECT * FROM coupon_targets 
          WHERE coupon_id = ${coupon.id}
        `

          if (targets.rows.length > 0) {
            const isEligible = targets.rows.some((target) => {
              if (target.target_type === "ALL") return true
              if (target.target_type === "USER" && target.target_id === userId) return true
              return false
            })

            if (!isEligible) {
              return NextResponse.json({ error: "This coupon is not available for your account" }, { status: 400 })
            }
          }


        } catch (couponError) {
          console.error("❌ Server-side coupon validation error:", couponError)
          return NextResponse.json({ error: "Failed to validate coupon" }, { status: 400 })
        }
      } else {
        let couponRedemptions = null;
        let discountAmount = 0;
        if (bookingData.mainBookingId) {
          couponRedemptions = await sql`SELECT * FROM coupon_redemptions WHERE booking_id = ${bookingData.mainBookingId}`;

        } else {
          couponRedemptions = await sql`SELECT * FROM coupon_redemptions WHERE booking_id = ${bookingData.bookingId}`;

        }
        if (couponRedemptions.rows.length == 0) {
          return NextResponse.json({ error: "Coupan redemption not found" }, { status: 400 })
        }
        const couponRedemption = couponRedemptions.rows[0];
        if (bookingData.mainBookingId) {
          const sessionResult = await sql`
            SELECT COUNT(id) AS count
            FROM recurring_booking
            WHERE booking_id = ${bookingData.mainBookingId}
          `;

          // Extract the count value
          const sessionCount = Number(sessionResult.rows[0]?.count ?? 0);
          discountAmount = Number(couponRedemption.discount_amount) / sessionCount;

        } else {
          discountAmount = Number(couponRedemption.discount_amount);
        }

        // Ensure discount doesn't exceed booking amount
        discountAmount = Math.min(discountAmount, expectedAmount)
        finalAmount = expectedAmount - discountAmount

        appliedCoupon = {
          id: couponRedemption.coupon_id,
          code: bookingData.couponCode,
          discountAmount: discountAmount,
        }

        console.log("✅ Coupon validated server-side:", {
          code: bookingData.couponCode,
          originalAmount: expectedAmount,
          discountAmount: discountAmount,
          finalAmount: finalAmount,
        })
      }
    }

    // 🔒 SECURITY: Validate amount matches expected final amount (after coupon discount)
    if (Math.abs(finalAmount - Number.parseFloat(bookingData.totalPrice)) > 0.01) {
      console.error("❌ Price mismatch detected!", {
        expected: finalAmount,
        received: bookingData.totalPrice,
        originalAmount: expectedAmount,
        couponApplied: !!appliedCoupon,
      })

      return NextResponse.json({ error: "Price validation failed. Please refresh and try again." }, { status: 400 })
    }

    // Convert final amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(finalAmount * 100)

    console.log("💳 Creating Razorpay order with amount:", amountInPaise, "paise")

    // Add this right before razorpay.orders.create()
    const orderParams = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${Date.now()}`,
      notes: {
        booking_type: "pet_care_service",
        service_id: bookingData.serviceId,
        pet_id: bookingData.petId,
        user_id: userId,
        service_name: service.name,
        ...(appliedCoupon && {
          coupon_code: appliedCoupon.code,
          original_amount: expectedAmount,
          discount_amount: appliedCoupon.discountAmount,
          final_amount: finalAmount,
        }),
      },
    }

    console.log("📤 Sending to Razorpay:", JSON.stringify(orderParams, null, 2))

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create(orderParams)

    console.log("✅ Razorpay order response:", JSON.stringify(razorpayOrder, null, 2))
    console.log("🔍 Order ID specifically:", razorpayOrder?.id)
    console.log("🔍 Order object keys:", Object.keys(razorpayOrder || {}))

    // Create payment record in database
    const paymentResult = await sql`
      INSERT INTO payments (
        user_id, service_id, amount, currency, expected_amount,
        razorpay_order_id, status, razorpay_response
      ) VALUES (
        ${userId}, ${bookingData.serviceId}, ${finalAmount}, 'INR', ${finalAmount},
        ${razorpayOrder.id}, 'CREATED', ${JSON.stringify(razorpayOrder)}
      ) RETURNING id
    `

    const paymentId = paymentResult.rows[0].id

    // Log payment creation
    await sql`
      SELECT log_payment_event(
        ${paymentId}, 'order_created', NULL, 'CREATED',
        ${JSON.stringify({ razorpay_order_id: razorpayOrder.id, amount: finalAmount })},
        NULL, ${request.headers.get("x-forwarded-for")}, ${request.headers.get("user-agent")}
      )
    `

    console.log("💾 Payment record created with ID:", paymentId)

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      paymentId: paymentId,
      key: process.env.RAZORPAY_KEY_ID,
      name: "ZuboPets",
      description: `${service.name} for your pet`,
      prefill: {
        name: bookingData.userName || "Pet Owner",
        email: bookingData.userEmail || "",
        contact: bookingData.userPhone || "",
      },
      theme: {
        color: "#24324C",
      },
      notes: razorpayOrder.notes,
    })
  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error)

    return NextResponse.json(
      {
        error: "Failed to create payment order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function calculateRecurringSessions(
  selectedDate: string | number | Date,
  recurringEndDate: string | number | Date,
  recurringPattern: string,
): number {
  const startDate = new Date(selectedDate)
  const endDate = new Date(recurringEndDate)

  if (endDate <= startDate) return 0

  const daysOfWeekMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  let sessionCount = 0

  if (recurringPattern.startsWith("weekly_")) {
    const [, intervalStr, daysStr] = recurringPattern.split("_")
    const weekInterval = Number.parseInt(intervalStr, 10)
    const days = daysStr.split(",").map((d) => daysOfWeekMap[d.toLowerCase()])

    const currentWeekStart = new Date(startDate)

    while (currentWeekStart <= endDate) {
      for (const day of days) {
        const sessionDate = new Date(currentWeekStart)
        const offset = (day - currentWeekStart.getDay() + 7) % 7
        sessionDate.setDate(currentWeekStart.getDate() + offset)

        if (sessionDate >= startDate && sessionDate <= endDate) {
          sessionCount++
        }
      }

      // Move forward by N weeks
      currentWeekStart.setDate(currentWeekStart.getDate() + weekInterval * 7)
    }
  } else if (recurringPattern.startsWith("monthly_")) {
    const [, intervalStr, nthStr, daysStr] = recurringPattern.split("_")
    const monthInterval = Number.parseInt(intervalStr, 10)
    const nth = Number.parseInt(nthStr, 10)
    const weekdays = daysStr.split(",").map((d) => daysOfWeekMap[d.toLowerCase()])

    const current = new Date(startDate)

    while (current <= endDate) {
      const year = current.getFullYear()
      const month = current.getMonth()

      for (const weekday of weekdays) {
        const date = getNthWeekdayOfMonth(year, month, weekday, nth)
        if (date && date >= startDate && date <= endDate) {
          sessionCount++
        }
      }

      current.setMonth(current.getMonth() + monthInterval)
      current.setDate(1) // reset to start of month
    }
  }

  return sessionCount
}

// ✅ Utility: Get Nth weekday in a month (e.g., 3rd Tuesday of June 2025)
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const offset = (7 + weekday - firstDayOfWeek) % 7
  const date = 1 + offset + (nth - 1) * 7
  const result = new Date(year, month, date)
  return result.getMonth() === month ? result : null
}
