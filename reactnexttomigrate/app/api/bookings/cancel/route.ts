import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { calculateRefund } from "@/lib/refund-calculator"
import Razorpay from "razorpay"
import twilio from 'twilio'

const sql = neon(process.env.DATABASE_URL!)

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { bookingId, reason, userId } = await request.json()

    // Get booking details
    const bookingResult = await sql`
      SELECT * FROM bookings 
      WHERE id = ${bookingId} AND user_id = ${userId}
    `

    if (bookingResult.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const booking = bookingResult[0]

    // Check if booking can be cancelled (only for non-recurring bookings)
    if (booking.is_recurring) {
      return NextResponse.json(
        {
          error: "Cannot cancel entire recurring booking. Please cancel individual sessions instead.",
        },
        { status: 400 },
      )
    }

    const cancellableStatuses = ["PENDING", "CONFIRMED", "ASSIGNED", "UPCOMING"]
    if (!cancellableStatuses.includes(booking.status?.toUpperCase())) {
      return NextResponse.json({ error: "This booking cannot be cancelled" }, { status: 400 })
    }

    // Prevent cancellation if booking is starting within 2 hours
    const bookingDate = booking.date // DATE
    const bookingTime = booking.time // TEXT (should be HH:MM or similar)
    if (bookingDate && bookingTime) {
      // Combine date and time into a JS Date object (assume server timezone)
      const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`)
      const now = new Date()
      const diffMs = bookingDateTime.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      if (diffHours < 2) {
        return NextResponse.json(
          {
            error: "Cancellations are not allowed within 2 hours of the booking start time.",
          },
          { status: 400 },
        )
      }
    }

    let refundInfo = null

    // Handle refund if booking was paid
    if (booking.payment_status === "PAID") {
      const refundCalculation = await calculateRefund(bookingId, undefined, booking.total_price, userId)

      const refundAmount = refundCalculation.refundAmount
      const deductionAmount = refundCalculation.deductionAmount
      if (refundAmount > 0) {

        // Get payment details
        const paymentResult = await sql`
        SELECT * FROM payments 
        WHERE booking_id = ${bookingId} 
        AND status = 'CAPTURED'
        ORDER BY created_at DESC
        LIMIT 1
      `

        if (paymentResult.length > 0) {
          const payment = paymentResult[0]

          try {
            // Create refund via Razorpay
            const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
              amount: Math.round(refundAmount * 100), // Convert to paise
              notes: {
                booking_id: bookingId,
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
            console.error("Booking refund creation failed:", refundError)
            refundInfo = {
              refundAmount: refundAmount.toFixed(2),
              deductionAmount: deductionAmount.toFixed(2),
              processingTime: "5-7 business days (processing)",
              error: "Refund will be processed manually",
              refundPercent: refundCalculation.refundPercent,
              description: refundCalculation.description,
            }
          }
        }
      }

      await sql`
            INSERT INTO booking_cancellations (
              booking_id, cancelled_by, refund_percent, refund_amount,
              policy_id, rule_id, reason
            ) VALUES (
              ${bookingId},
              'user',
              ${refundCalculation.refundPercent},
              ${refundAmount},
              ${refundCalculation.policyId},
              ${refundCalculation.ruleApplied?.id ? sql`${refundCalculation.ruleApplied.id}::uuid` : sql`NULL`},
              ${reason}
            )
          `
    }

    // Update booking status
    await sql`
      UPDATE bookings 
      SET 
        status = 'USERCANCELLED',
        cancellation_reason = ${reason},
        updated_at = NOW()
      WHERE id = ${bookingId}
    `

    // WhatsApp notification logic
    try {
      // Get user, pet, and address info for WhatsApp
      const detailsResult = await sql`
        SELECT b.id, u.name AS user_name, p.name AS pet_name, b.date, b.time, b.address_id, b.total_price, b.status,
          COALESCE(
          addr1.line1 ||
          (CASE WHEN addr1.line2 IS NOT NULL AND addr1.line2 <> '' THEN ', ' || addr1.line2 ELSE '' END) ||
          (CASE WHEN addr1.landmark IS NOT NULL AND addr1.landmark <> '' THEN ' (Landmark: ' || addr1.landmark || ')' ELSE '' END),
          addr2.line1 ||
          (CASE WHEN addr2.line2 IS NOT NULL AND addr2.line2 <> '' THEN ', ' || addr2.line2 ELSE '' END) ||
          (CASE WHEN addr2.landmark IS NOT NULL AND addr2.landmark <> '' THEN ' (Landmark: ' || addr2.landmark || ')' ELSE '' END)
          ) AS location,
          u.phone
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN pets p ON b.pet_id = p.id
        LEFT JOIN addresses addr1 ON addr1.id = b.address_id AND addr1.is_active = true
        LEFT JOIN addresses addr2 ON addr2.user_id = u.id AND addr2.is_default = true AND addr2.is_active = true
        WHERE b.id = ${bookingId}
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
        const bookingDate = formatIndianFriendlyDate(info.date)
        const bookingTime = formatIndianFriendlyTime(info.time)
        const location = info.location || "Location"
        const fullBookingId = info.id?.toString() || bookingId?.toString() || ""
        const bookingIdVal = fullBookingId.slice(-5)
        const refundDetails = refundInfo?.refundAmount ? `₹${refundInfo.refundAmount}` : "Not applicable"
        const refundAmount = refundInfo?.refundAmount ? `₹${refundInfo.refundAmount}` : "Not applicable"
        const templateVariables = {
          "1": petOwnerName,
          "2": petName,
          "3": bookingDate,
          "4": bookingTime,
          "5": location,
          "6": `#${bookingIdVal}`,
          "7": refundAmount,
          "8": `booking-details/${fullBookingId}`,
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
      message: "Booking cancelled successfully",
      refundInfo,
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}
