import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { sql } from "@vercel/postgres"
import { isTimeSlotBookable } from "@/lib/booking-time-validator"

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Starting payment verification...")

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = body

    console.log("📋 Payment verification data:", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      hasSignature: !!razorpay_signature,
      signatureLength: razorpay_signature?.length,
    })

    // 🔍 DEBUG: Check environment variables
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    console.log("🔑 Environment check:", {
      hasKeySecret: !!keySecret,
      keySecretLength: keySecret?.length,
      keySecretStart: keySecret?.substring(0, 8) + "...",
    })

    if (!keySecret) {
      console.error("❌ RAZORPAY_KEY_SECRET not found in environment!")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // 🔒 SECURITY: Verify Razorpay signature
    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`
    console.log("🔐 Signature payload:", signaturePayload)

    const expectedSignature = crypto.createHmac("sha256", keySecret).update(signaturePayload).digest("hex")

    console.log("🔍 Signature comparison:", {
      expected: expectedSignature,
      received: razorpay_signature,
      match: expectedSignature === razorpay_signature,
      expectedLength: expectedSignature.length,
      receivedLength: razorpay_signature?.length,
    })

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Signature verification failed!")
      console.error("Expected:", expectedSignature)
      console.error("Received:", razorpay_signature)
      console.error("Payload:", signaturePayload)

      // Log failed verification attempt
      try {
        await sql`
          INSERT INTO payment_logs (
            payment_id, event_type, status_from, status_to, 
            event_data, created_at
          ) VALUES (
            NULL, 'signature_verification_failed', NULL, 'FAILED',
            ${JSON.stringify({
              razorpay_order_id,
              razorpay_payment_id,
              expected_signature: expectedSignature,
              received_signature: razorpay_signature,
              payload: signaturePayload,
            })}, NOW()
          )
        `
      } catch (logError) {
        console.error("Failed to log verification error:", logError)
      }

      return NextResponse.json(
        {
          error: "Payment verification failed",
          details: "Signature mismatch",
          debug: {
            expectedLength: expectedSignature.length,
            receivedLength: razorpay_signature?.length,
            payloadLength: signaturePayload.length,
          },
        },
        { status: 400 },
      )
    }

    console.log("✅ Razorpay signature verified successfully")

    // Add this after the signature verification and before booking creation
    let isRecurringPayment = false
    let recurringBookingId = null

    if (bookingData.recurringBookingId) {
      isRecurringPayment = true
      recurringBookingId = bookingData.recurringBookingId
      console.log("🔄 Processing recurring session payment for:", recurringBookingId)
    }

    // 🔍 DEBUG: Check if payment record exists
    console.log("🔍 Looking for payment record with order ID:", razorpay_order_id)

    const paymentResult = await sql`
      SELECT * FROM payments 
      WHERE razorpay_order_id = ${razorpay_order_id}
    `

    console.log("📊 Payment record query result:", {
      found: paymentResult.rows.length > 0,
      count: paymentResult.rows.length,
      orderId: razorpay_order_id,
    })

    if (paymentResult.rows.length === 0) {
      console.error("❌ Payment record not found for order:", razorpay_order_id)

      // Log missing payment record
      try {
        await sql`
          INSERT INTO payment_logs (
            payment_id, event_type, status_from, status_to, 
            event_data, created_at
          ) VALUES (
            NULL, 'payment_record_not_found', NULL, 'ERROR',
            ${JSON.stringify({ razorpay_order_id, razorpay_payment_id })}, NOW()
          )
        `
      } catch (logError) {
        console.error("Failed to log missing record error:", logError)
      }

      return NextResponse.json(
        {
          error: "Payment record not found",
          details: "Order not found in database",
          orderId: razorpay_order_id,
        },
        { status: 404 },
      )
    }

    const payment = paymentResult.rows[0]
    console.log("💾 Found payment record:", {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      userId: payment.user_id,
    })

    // Existing payment update logic for regular bookings
    await sql`
        UPDATE payments 
        SET 
          status = 'CAPTURED',
          razorpay_payment_id = ${razorpay_payment_id},
          razorpay_signature = ${razorpay_signature},
          captured_at = NOW(),
          updated_at = NOW(),
          amount_validated = true
        WHERE id = ${payment.id}
      `

    // Log successful payment
    await sql`
      SELECT log_payment_event(
        ${payment.id}, 'payment_captured', 'CREATED', 'CAPTURED',
        ${JSON.stringify({
          razorpay_payment_id,
          razorpay_signature,
          amount: payment.amount,
        })},
        NULL, ${request.headers.get("x-forwarded-for")}, ${request.headers.get("user-agent")}
      )
    `

    console.log("✅ Payment updated to CAPTURED status")

    let booking
    let serviceOtp
    let startOtp
    let endOtp
    if (!isRecurringPayment && !bookingData.bookingId) {
      // Now create the booking
      console.log("📝 Creating booking after successful payment...")

      // Generate all OTPs
      serviceOtp = Math.floor(100000 + Math.random() * 900000).toString() // Legacy
      startOtp = Math.floor(100000 + Math.random() * 900000).toString()
      endOtp = Math.floor(100000 + Math.random() * 900000).toString()
      console.log(`🔐 Generated OTPs for booking:`)
      console.log(`   Legacy Service OTP: ${serviceOtp}`)
      console.log(`   START OTP: ${startOtp}`)
      console.log(`   END OTP: ${endOtp}`)

      const bookingPayload = {
        userId: payment.user_id,
        petId: bookingData.petId,
        serviceId: payment.service_id,
        date: bookingData.date,
        time: bookingData.time,
        times: bookingData.times,
        duration: bookingData.duration || 60,
        totalPrice: payment.amount,
        paymentId: payment.id,
        status: "PENDING",
        addressId: bookingData.addressId,
        paymentStatus: "PAID",
        recurring: bookingData.recurring || false,
        recurringPattern: bookingData.recurringPattern || null,
        recurringEndDate: bookingData.recurringEndDate || null,
        notes: `Booking created after successful payment. Payment ID: ${razorpay_payment_id}`,
      }

      console.log("📤 Creating booking with payload:", JSON.stringify(bookingPayload, null, 2))
      const time = bookingPayload.time
        ? bookingPayload.time
        : Array.isArray(bookingPayload.times) && bookingPayload.times.length > 0
          ? bookingPayload.times[0]
          : ""
      // Create booking
      const bookingResult = await sql`
        INSERT INTO bookings (
          user_id, pet_id, service_id, address_id, date, time, duration,
          status, total_price, payment_id, payment_status,
          is_recurring, recurring_pattern, recurring_end_date, notes,
          service_otp, otp_expiry,
          created_at, updated_at
        ) VALUES (
          ${bookingPayload.userId}, ${bookingPayload.petId}, ${bookingPayload.serviceId}, ${bookingPayload.addressId},
          ${bookingPayload.date}, ${time}, ${bookingPayload.duration},
          ${bookingPayload.status}, ${bookingPayload.totalPrice}, ${bookingPayload.paymentId}, ${bookingPayload.paymentStatus},
          ${bookingPayload.recurring}, ${bookingPayload.recurringPattern}, ${bookingPayload.recurringEndDate}, ${bookingPayload.notes},
          ${serviceOtp}, ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()},
          NOW(), NOW()
        ) RETURNING *
      `

      booking = bookingResult.rows[0]
      console.log("✅ Booking created successfully:", {
        id: booking.id,
        status: booking.status,
        totalPrice: booking.total_price,
      })

      // 🔐 NOW CREATE START AND END OTPs in service_otps table
      console.log("🔐 Creating START and END OTPs in service_otps table...")
      console.log(`   Booking ID: ${booking.id}`)
      console.log(`   START OTP: ${startOtp}`)
      console.log(`   END OTP: ${endOtp}`)

      try {
        // Insert START OTP
        console.log("🔐 Inserting START OTP...")
        const startResult = await sql`
        INSERT INTO service_otps (booking_id, type, otp, is_used, created_at)
        VALUES (${booking.id}, 'START', ${startOtp}, false, NOW())
        RETURNING *
      `
        console.log("✅ START OTP created:", startResult.rows[0])

        // Insert END OTP
        console.log("🔐 Inserting END OTP...")
        const endResult = await sql`
        INSERT INTO service_otps (booking_id, type, otp, is_used, created_at)
        VALUES (${booking.id}, 'END', ${endOtp}, false, NOW())
        RETURNING *
      `
        console.log("✅ END OTP created:", endResult.rows[0])

        // Verify both OTPs were created
        const verifyOtps = await sql`
        SELECT id, booking_id, type, otp, is_used, created_at 
        FROM service_otps 
        WHERE booking_id = ${booking.id}
        ORDER BY type
      `
        console.log("🔍 Verification - All OTPs for this booking:", verifyOtps.rows)
      } catch (otpError) {
        console.error("❌ CRITICAL ERROR creating service OTPs:", otpError)
        console.error("❌ OTP Error details:", {
          name: otpError instanceof Error ? otpError.name : "Unknown",
          message: otpError instanceof Error ? otpError.message : "Unknown OTP error",
          stack: otpError instanceof Error ? otpError.stack : "No stack",
          bookingId: booking.id,
          startOtp,
          endOtp,
        })
      }
    } else if (isRecurringPayment) {
      // Update the recurring booking status to PAID
      await sql`
        UPDATE recurring_booking 
        SET payment_status = 'PAID', updated_at = NOW()
        WHERE id = ${recurringBookingId}
      `

      // Check if all sessions are paid and update main booking
      const mainBookingId = bookingData.mainBookingId
      if (mainBookingId) {
        const allSessions = await sql`
          SELECT COUNT(*) as total_sessions, 
                 COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_sessions
          FROM recurring_booking 
          WHERE booking_id = ${mainBookingId}
        `

        const { total_sessions, paid_sessions } = allSessions.rows[0]
        console.log(`📊 Session payment status: ${paid_sessions}/${total_sessions} paid`)

        if (Number.parseInt(paid_sessions) === Number.parseInt(total_sessions)) {
          await sql`
            UPDATE bookings 
            SET payment_status = 'PAID', updated_at = NOW()
            WHERE id = ${mainBookingId}
          `
          console.log("🎉 All sessions paid! Main booking marked as PAID")
        }
      }
    } else if (!isRecurringPayment && bookingData.bookingId) {
      await sql`
        UPDATE bookings 
        SET payment_status = 'PAID'
        WHERE id = ${bookingData.bookingId}
      `

      const bookings = await sql`
        SELECT * FROM bookings 
        WHERE id = ${bookingData.bookingId}
        `
      booking = bookings.rows[0]
    }

    if (isRecurringPayment) {
      await sql`
            UPDATE payments 
            SET recurring_booking_id = ${recurringBookingId}
            WHERE id = ${payment.id}
          `

      await sql`
      SELECT log_payment_event(
        ${payment.id}, 'booking_created', 'CAPTURED', 'CAPTURED',
        ${JSON.stringify({
          recurring_booking_id: recurringBookingId,
        })},
        NULL, ${request.headers.get("x-forwarded-for")}, ${request.headers.get("user-agent")}
      )
    `
    } else {
      await sql`
        UPDATE payments 
        SET booking_id = ${booking.id}
        WHERE id = ${payment.id}
      `

      await sql`
      SELECT log_payment_event(
        ${payment.id}, 'booking_created', 'CAPTURED', 'CAPTURED',
        ${JSON.stringify({
          booking_id: booking.id,
        })},
        NULL, ${request.headers.get("x-forwarded-for")}, ${request.headers.get("user-agent")}
      )
    `
    }

    if (!isRecurringPayment && bookingData.recurring && !bookingData.recurringBookingId) {
      // Start transaction
      await sql`BEGIN`

      try {
        const times = Array.isArray(bookingData.times) ? bookingData.times : [bookingData.time]

        // Validate first session date with all times
        for (const time of times) {
          const validation = isTimeSlotBookable(bookingData.date, time)
          if (!validation.isBookable) {
            return NextResponse.json(
              {
                error: "Invalid booking time",
                details: validation.reason,
              },
              { status: 400 },
            )
          }
        }

        const sessions = times.flatMap((time) =>
          calculateRecurringDates(bookingData.date, bookingData.recurringEndDate, bookingData.recurringPattern, time),
        )
        const sessionPrice = payment.amount / sessions.length

        // Prepare bulk insert values for recurring_booking
        const recurringValues = sessions.map((s) => [
          payment.user_id,
          bookingData.petId,
          payment.service_id,
          null, // sitter_id
          booking.id, // booking_id
          s.sequenceNumber,
          s.date,
          s.time,
          bookingData.duration || 60,
          sessionPrice,
          "PENDING",
          "PAID",
          `Session ${s.sequenceNumber} of recurring booking`,
          new Date(),
          new Date(),
        ])
        const recurringPlaceholders = recurringValues
          .map(
            (_, i) =>
              `(${Array(15)
                .fill(0)
                .map((__, j) => `$${i * 15 + j + 1}`)
                .join(",")})`,
          )
          .join(",")
        const flatRecurring = recurringValues.flat()

        const recurringResult = await sql.query(
          `INSERT INTO recurring_booking (
        user_id, pet_id, service_id, sitter_id, booking_id,
        sequence_number, session_date, session_time, duration,
        session_price, status, payment_status, notes, created_at, updated_at
      ) VALUES ${recurringPlaceholders} RETURNING *`,
          flatRecurring,
        )

        // Prepare bulk insert values for service_otps
        const otpValues = recurringResult.rows.flatMap((r) => {
          const startOtp = Math.floor(100000 + Math.random() * 900000).toString()
          const endOtp = Math.floor(100000 + Math.random() * 900000).toString()
          return [
            [null, r.id, "START", startOtp, false, new Date()],
            [null, r.id, "END", endOtp, false, new Date()],
          ]
        })
        const otpPlaceholders = otpValues
          .map(
            (_, i) =>
              `(${Array(6)
                .fill(0)
                .map((__, j) => `$${i * 6 + j + 1}`)
                .join(",")})`,
          )
          .join(",")
        const flatOtp = otpValues.flat()

        await sql.query(
          `INSERT INTO service_otps (booking_id, recurring_booking_id, type, otp, is_used, created_at)
       VALUES ${otpPlaceholders}`,
          flatOtp,
        )

        await sql`COMMIT`
      } catch (err) {
        await sql`ROLLBACK`
        console.error("❌ Error creating recurring bookings and OTPs:", err)
        throw err
      }
    }

    console.log("🎉 Payment verification and booking creation completed successfully!")

    if (isRecurringPayment) {
      return NextResponse.json({
        success: true,
        message: "Recurring session payment verified successfully",
        recurringBookingId: recurringBookingId,
        paymentId: razorpay_payment_id,
        amount: payment.amount,
      })
    } else if (bookingData.bookingId) {
      return NextResponse.json({
        success: true,
        message: "Payment verified and booking updated successfully",
        bookingId: booking.id,
        paymentId: razorpay_payment_id,
        amount: payment.amount,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "Payment verified and booking created successfully",
        bookingId: booking.id,
        serviceOtp: serviceOtp,
        startOtp: startOtp,
        endOtp: endOtp,
        paymentId: razorpay_payment_id,
        amount: payment.amount,
      })
    }
  } catch (error) {
    console.error("❌ Error in payment verification:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    try {
      await sql`
        INSERT INTO payment_logs (
          payment_id, event_type, status_from, status_to, 
          event_data, created_at
        ) VALUES (
          NULL, 'verification_error', NULL, 'ERROR',
          ${JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : "No stack trace",
          })}, NOW()
        )
      `
    } catch (logError) {
      console.error("Failed to log verification error:", logError)
    }

    return NextResponse.json(
      {
        error: "Payment verification failed",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Helper function to calculate recurring session dates
function calculateRecurringDates(
  startDate: string,
  endDate: string,
  pattern: string,
  times: Array<string> | string,
): Array<{ date: string; time: string; sequenceNumber: number }> {
  const sessions: Array<{ date: string; time: string; sequenceNumber: number }> = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  let sequenceNumber = 1

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  if (pattern.startsWith("weekly")) {
    const [, intervalStr, daysStr] = pattern.split("_")
    const interval = Number.parseInt(intervalStr, 10)
    const weekdays = daysStr.split(",").map((d) => dayMap[d.toLowerCase()])

    const current = new Date(start)

    while (current <= end) {
      const currentWeekStart = new Date(current)

      // Add each target weekday in this interval week
      for (const weekday of weekdays) {
        const sessionDate = new Date(currentWeekStart)
        sessionDate.setDate(sessionDate.getDate() + ((7 + weekday - sessionDate.getDay()) % 7))

        if (sessionDate >= start && sessionDate <= end) {
          const isoDate = sessionDate.toISOString().split("T")[0]
          if (!sessions.find((s) => s.date === isoDate)) {
            for (const time of Array.isArray(times) ? times : [times]) {
              sessions.push({
                date: isoDate,
                time,
                sequenceNumber: sequenceNumber++,
              })
            }
          }
        }
      }

      // Move to next interval week
      current.setDate(current.getDate() + interval * 7)
    }
  } else if (pattern.startsWith("monthly")) {
    const [, monthIntervalStr, nthStr, weekdaysStr] = pattern.split("_")
    const monthInterval = Number.parseInt(monthIntervalStr, 10)
    const nth = Number.parseInt(nthStr, 10)
    const weekdays = weekdaysStr.split(",").map((d) => dayMap[d.toLowerCase()])

    const current = new Date(start)

    while (current <= end) {
      const year = current.getFullYear()
      const month = current.getMonth()

      for (const weekday of weekdays) {
        const date = getNthWeekdayOfMonth(year, month, weekday, nth)
        if (date && date >= start && date <= end) {
          for (const time of Array.isArray(times) ? times : [times]) {
            sessions.push({
              date: date.toISOString().split("T")[0],
              time,
              sequenceNumber: sequenceNumber++,
            })
          }
        }
      }

      // Move to next applicable month
      current.setMonth(current.getMonth() + monthInterval)
      current.setDate(1)
    }
  }

  return sessions
}

// Helper to get Nth weekday of a given month
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const offset = (7 + weekday - firstDayOfWeek) % 7
  const day = 1 + offset + (nth - 1) * 7
  const result = new Date(year, month, day)
  return result.getMonth() === month ? result : null
}
