import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendFcmNotification } from "@/lib/sendFcmNotification"
import { publishServiceUpdate } from "@/lib/ably-server"
import twilio from "twilio"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function POST(request: NextRequest) {
  try {
    const { bookingId, otp } = await request.json()

    if (!bookingId || !otp) {
      return NextResponse.json({ error: "Booking ID and OTP are required" }, { status: 400 })
    }

    // Check if it's a recurring session or a regular booking
    const regularBookingCheck = await sql`
      SELECT id, user_id, total_price, sitter_id, date, time FROM bookings WHERE id = ${bookingId}
    `
    const recurringSessionCheck = await sql`
      SELECT id, user_id, sitter_id, session_price, service_started_at, session_date AS date, session_time AS time
      FROM recurring_booking WHERE id = ${bookingId}
    `

    let isRecurringSession = false
    let bookingData: any = null

    if (recurringSessionCheck.length > 0) {
      isRecurringSession = true
      bookingData = recurringSessionCheck[0]
    } else if (regularBookingCheck.length > 0) {
      bookingData = regularBookingCheck[0]
    } else {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const ownerUserId = bookingData.user_id
    const sitterId = bookingData.sitter_id
    const totalPrice = Number.parseFloat(isRecurringSession ? bookingData.session_price : bookingData.total_price) || 0

    // Get additional booking details for notifications (includes user phone & name)
    let bookingDetails: any = null
    if (isRecurringSession) {
      const result = await sql`
        SELECT rb.*, 
               p.name as pet_name, 
               s.name as sitter_name, 
               u.name as owner_name, 
               u.phone as owner_phone, 
               srv.name as service_name
        FROM recurring_booking rb
        JOIN pets p ON rb.pet_id = p.id
        JOIN sitters st ON rb.sitter_id = st.id
        JOIN users s ON st.user_id = s.id
        JOIN users u ON rb.user_id = u.id
        JOIN services srv ON rb.service_id = srv.id
        WHERE rb.id = ${bookingId}
      `
      bookingDetails = result[0]
    } else {
      const result = await sql`
        SELECT b.*, 
               p.name as pet_name, 
               s.name as sitter_name, 
               u.name as owner_name, 
               u.phone as owner_phone,
               srv.name as service_name
        FROM bookings b
        JOIN pets p ON b.pet_id = p.id
        JOIN sitters st ON b.sitter_id = st.id
        JOIN users s ON st.user_id = s.id
        JOIN users u ON b.user_id = u.id
        JOIN services srv ON b.service_id = srv.id
        WHERE b.id = ${bookingId}
      `
      bookingDetails = result[0]
    }

    console.log("🎯 Target user ID for end service notifications:", ownerUserId)

    // Send FCM Notification to the SPECIFIC user
    if (ownerUserId) {
      try {
        await sendFcmNotification({
          userIds: [ownerUserId],
          title: "Service Completed",
          body: `${bookingDetails?.sitter_name || "Your Zubo Walkers"} has completed the service for ${bookingDetails?.pet_name || "your pet"}`,
        })
      } catch (notifyErr) {
        console.error("Failed to send FCM notification to owner:", notifyErr)
      }
    }

    // OTP Verification
    let otpResult
    if (isRecurringSession) {
      otpResult = await sql`
        SELECT * FROM service_otps 
        WHERE recurring_booking_id = ${bookingId} 
        AND type = 'END' 
        AND otp = ${otp} 
        AND is_used = false 
        AND (expires_at > NOW() OR expires_at IS NULL)
      `
    } else {
      otpResult = await sql`
        SELECT * FROM service_otps 
        WHERE booking_id = ${bookingId} 
        AND type = 'END' 
        AND otp = ${otp} 
        AND is_used = false 
        AND (expires_at > NOW() OR expires_at IS NULL)
      `
    }

    if (otpResult.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Mark OTP as used
    await sql`
      UPDATE service_otps 
      SET is_used = true, used_at = NOW() 
      WHERE id = ${otpResult[0].id}
    `

    // Start transaction
    await sql`BEGIN`
    try {
      let actualDuration = null
      if (isRecurringSession && bookingData.service_started_at) {
        const startTime = new Date(bookingData.service_started_at)
        const endTime = new Date()
        actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      }

      // Update booking status
      if (isRecurringSession) {
        await sql`
          UPDATE recurring_booking 
          SET status = 'COMPLETED', 
              service_ended_at = NOW(), 
              actual_duration = ${actualDuration},
              updated_at = NOW()
          WHERE id = ${bookingId}
        `
      } else {
        await sql`
          UPDATE bookings 
          SET status = 'COMPLETED',
              completed_at = NOW(),
              earnings_processed = true,
              actual_end_time = NOW(),
              sitter_earnings = ${totalPrice},
              platform_fee = 0,
              updated_at = NOW()
          WHERE id = ${bookingId}
        `
      }

      // Increment total_bookings for the sitter
      await sql`
        UPDATE sitters SET total_bookings = COALESCE(total_bookings, 0) + 1, updated_at = NOW() WHERE id = ${sitterId}
      `;

      // Handle sitter wallet
      const walletResult = await sql`
        SELECT id FROM sitter_wallets WHERE sitter_id = ${sitterId}
      `
      let walletId
      if (walletResult.length === 0) {
        const newWallet = await sql`
          INSERT INTO sitter_wallets (sitter_id, balance, pending_amount, total_earnings)
          VALUES (${sitterId}, 0.00, 0.00, 0.00)
          RETURNING id
        `
        walletId = newWallet[0].id
      } else {
        walletId = walletResult[0].id
      }

      // Add earnings to wallet
      await sql`
        UPDATE sitter_wallets 
        SET 
          pending_amount = pending_amount + ${totalPrice},
          total_earnings = total_earnings + ${totalPrice},
          updated_at = NOW()
        WHERE id = ${walletId}
      `

      const availableAt = new Date()
      availableAt.setDate(availableAt.getDate() + 3)

      await sql`
        INSERT INTO wallet_transactions (
          wallet_id, booking_id, amount, type, status, description, available_at, metadata
        ) VALUES (
          ${walletId},
          ${bookingId},
          ${totalPrice},
          'earning',
          'pending',
          'Service completion earnings',
          ${availableAt.toISOString()},
          ${JSON.stringify({
        service_date: bookingData.date,
        service_time: bookingData.time,
        total_price: totalPrice,
        commission_rate: 1,
      })}
        )
      `

      await sql`COMMIT`

      // 🎯 Send WhatsApp Feedback Notification using Twilio
      try {
        if (bookingDetails?.owner_phone) {
          await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${bookingDetails.owner_phone}`, // must be E.164
            contentSid: "HXaf07f334d1d4b38c15973b299c36cdfd", // pp_feedback
            contentVariables: JSON.stringify({
              "1": bookingDetails.owner_name || "Customer",
              "2": bookingDetails.pet_name || "your pet",
            }),
          })
          console.log("✅ WhatsApp feedback message sent to:", bookingDetails.owner_phone)
        }
      } catch (waError) {
        console.error("❌ Failed to send WhatsApp feedback message:", waError)
      }

      // 🎯 Ably Notification
      try {
        await publishServiceUpdate(ownerUserId, "service:ended", {
          bookingId: bookingId,
          status: "COMPLETED",
          endedAt: new Date().toISOString(),
          sitterName: bookingDetails?.sitter_name,
          petName: bookingDetails?.pet_name,
          service: bookingDetails?.service_name,
          bookingType: isRecurringSession ? "recurring_session" : "regular",
          earnings: {
            amount: totalPrice,
            availableAt: availableAt.toISOString(),
          },
        })
        console.log("✅ Real-time end service notification sent to user:", ownerUserId)
      } catch (ablyError) {
        console.error("❌ Failed to send Ably notification:", ablyError)
      }

      return NextResponse.json({
        success: true,
        message: "Service completed and earnings credited",
        bookingType: isRecurringSession ? "recurring_session" : "regular",
        earnings: {
          amount: totalPrice,
          availableAt: availableAt.toISOString(),
        },
      })
    } catch (err) {
      await sql`ROLLBACK`
      throw err
    }
  } catch (error) {
    console.error("❌ Error ending service:", error)
    return NextResponse.json({ error: "Failed to end service" }, { status: 500 })
  }
}
