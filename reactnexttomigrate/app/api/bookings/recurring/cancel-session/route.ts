import twilio from "twilio"
import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { calculateRefund } from "@/lib/refund-calculator"
import Razorpay from "razorpay"

const sql = neon(process.env.DATABASE_URL!)

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason, userId } = await request.json()

    if (!sessionId || !reason || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get session details
    const sessionResult = await sql`
      SELECT * FROM recurring_booking 
      WHERE id = ${sessionId}::uuid AND user_id = ${userId}
    `

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = sessionResult[0]

    // Check if session can be cancelled
    const cancellableStatuses = ["PENDING", "CONFIRMED", "ASSIGNED", "UPCOMING"]
    if (!cancellableStatuses.includes(session.status?.toUpperCase())) {
      return NextResponse.json(
        {
          error: `This session cannot be cancelled. Current status: ${session.status}`,
        },
        { status: 400 },
      )
    }

    // Prevent cancellation if session is starting within 2 hours
    const sessionDate = session.session_date // DATE
    const sessionTime = session.session_time // TIME
    if (sessionDate && sessionTime) {
      // Combine date and time into a JS Date object (assume server timezone)
      const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`)
      const now = new Date()
      const diffMs = sessionDateTime.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      if (diffHours < 2) {
        return NextResponse.json(
          {
            error: "You cannot cancel a session that is starting within 2 hours.",
          },
          { status: 400 },
        )
      }
    }

    let refundInfo = null

    // Handle refund if session was paid
    if (session.payment_status === "PAID") {
      const refundCalculation = await calculateRefund(undefined, sessionId, session.session_price, userId)

      const refundAmount = refundCalculation.refundAmount
      const deductionAmount = refundCalculation.deductionAmount

      if (refundAmount > 0) {

        // Get payment details for this session
        let paymentResult = await sql`
        SELECT * FROM payments 
        WHERE recurring_booking_id = ${sessionId}::uuid 
        AND status = 'CAPTURED'
        ORDER BY created_at DESC
        LIMIT 1
      `
        if (paymentResult.length === 0) {
          paymentResult = await sql`
        SELECT * FROM payments 
        WHERE booking_id = ${session.booking_id}::text
        AND status = 'CAPTURED'
        ORDER BY created_at DESC
        LIMIT 1
      `
        }
        if (paymentResult.length > 0) {
          const payment = paymentResult[0]

          try {
            // Create refund via Razorpay
            const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
              amount: Math.round(refundAmount * 100), // Convert to paise
              notes: {
                session_id: sessionId,
                sequence_number: session.sequence_number,
                reason: reason,
                cancellation_fee: deductionAmount.toFixed(2),
                refund_percent: refundCalculation.refundPercent,
                hours_until_service: refundCalculation.hoursUntilService,
              },
            })



            // Record refund in database
            await sql`
            INSERT INTO payment_refunds (
              payment_id, refund_id, amount, status,               
              initiated_at, razorpay_response
            ) VALUES (
              ${payment.id},
              ${refund.id},
              ${refundAmount},
              'INITIATED',
              NOW(),
              ${JSON.stringify(refund)}
            )
          `

            refundInfo = {
              refundAmount: refundAmount.toFixed(2),
              deductionAmount: deductionAmount.toFixed(2),
              processingTime: refundCalculation.processingTime,
              refundId: refund.id,
              refundPercent: refundCalculation.refundPercent,
              description: refundCalculation.description,
            }
          } catch (refundError) {
            console.error("Session refund creation failed:", refundError)

            // Still record the refund attempt for manual processing
            await sql`
            INSERT INTO payment_refunds (
              payment_id, refund_id, amount, status, 
              initiated_at, failure_reason
            ) VALUES (
              ${payment.id},
              'manual_' || ${sessionId},
              ${refundAmount},
              'FAILED',
              NOW(),
              ${refundError instanceof Error ? refundError.message : "Razorpay API error"}
            )
          `

            refundInfo = {
              refundAmount: refundAmount.toFixed(2),
              deductionAmount: deductionAmount.toFixed(2),
              processingTime: "7-10 business days (manual processing)",
              error: "Refund will be processed manually by our team",
              refundPercent: refundCalculation.refundPercent,
              description: refundCalculation.description,
            }
          }
        } else {
          return NextResponse.json({ error: "Payment record not found for this session" }, { status: 404 })
        }
      }

      await sql`
            INSERT INTO booking_cancellations (
              recurring_booking_id, cancelled_by, refund_percent, refund_amount,
              policy_id, rule_id, reason
            ) VALUES (
              ${sessionId}::uuid,
              'user',
              ${refundCalculation.refundPercent},
              ${refundAmount},
              ${refundCalculation.policyId},
              ${refundCalculation.ruleApplied?.id ? sql`${refundCalculation.ruleApplied.id}::uuid` : sql`NULL`},
              ${reason}
            )
          `
    }

    // Update session status and add cancellation reason
    await sql`
      UPDATE recurring_booking 
      SET 
        status = 'USERCANCELLED',
        cancellation_reason = ${reason},
        updated_at = NOW()
      WHERE id = ${sessionId}::uuid
    `

    // WhatsApp notification logic
    try {
      // Get user, pet, and address info for WhatsApp (address from bookings)
      const detailsResult = await sql`
        SELECT rb.id, u.name AS user_name, p.name AS pet_name, rb.session_date, rb.session_time, rb.sequence_number, rb.session_price, rb.status,
          addr.line1 || (CASE WHEN addr.landmark IS NOT NULL AND addr.landmark <> '' THEN ' (Landmark: ' || addr.landmark || ')' ELSE '' END) AS location,
          u.phone
        FROM recurring_booking rb
        JOIN users u ON rb.user_id = u.id
        JOIN pets p ON rb.pet_id = p.id
        JOIN bookings b ON rb.booking_id::text = b.id
        LEFT JOIN addresses addr ON addr.id = b.address_id AND addr.is_active = true
        WHERE rb.id = ${sessionId}
        LIMIT 1;
      `
      const info = detailsResult[0]
      if (info) {
        // Format date and time
        function formatIndianFriendlyDate(dateString: string) {
          const date = new Date(dateString)
          const day = date.getDate()
          const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th"
          const formattedDate = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date)
          return `${day}${suffix} ${formattedDate}`
        }
        function formatIndianFriendlyTime(timeString: string) {
          const date = new Date(`1970-01-01T${timeString}`)
          return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
        }

        // Prepare variables
        const petOwnerName = info.user_name || "Customer"
        const petName = info.pet_name || "Pet"
        const bookingDate = formatIndianFriendlyDate(info.session_date)
        const bookingTime = formatIndianFriendlyTime(info.session_time)
        const location = info.location || "Location"
        const fullSessionId = info.id?.toString() || sessionId?.toString() || ""
        const bookingIdVal = fullSessionId.slice(-5)
        const refundAmount = refundInfo?.refundAmount ? `₹${refundInfo.refundAmount}` : "Not applicable"
        const templateVariables = {
          "1": petOwnerName,
          "2": petName,
          "3": bookingDate,
          "4": bookingTime,
          "5": location,
          "6": `#${bookingIdVal}`,
          "7": refundAmount,
          "8": `recurring-session?recurringBookingId=${fullSessionId}`,
          "9": "book-service"
        }

        // WhatsApp send logic
        const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
        const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER
        const TEMPLATE_SID = "HX8b80b86971029bbc0b7534693f47b831"
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        let toPhone = info.phone?.replace(/[^\d]/g, "") || ""
        if (!toPhone.startsWith("+")) toPhone = "+" + toPhone
        await client.messages.create({
          from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${toPhone}`,
          contentSid: TEMPLATE_SID,
          contentVariables: JSON.stringify(templateVariables)
        })
      }
    } catch (whatsappError) {
      console.error("WhatsApp notification failed:", whatsappError)
    }

    return NextResponse.json({
      message: "Session cancelled successfully",
      sessionId,
      sequenceNumber: session.sequence_number,
      refundInfo,
    })
  } catch (error) {
    console.error("Error cancelling session:", error)
    return NextResponse.json(
      {
        error: "Failed to cancel session",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
