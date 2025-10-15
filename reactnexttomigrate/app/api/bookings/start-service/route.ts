import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendFcmNotification } from "@/lib/sendFcmNotification"
import { publishServiceUpdate } from "@/lib/ably-server"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { bookingId, otp } = await request.json()

    console.log("🔐 START Service API - bookingId:", bookingId, "otp:", otp)

    if (!bookingId || !otp) {
      return NextResponse.json({ error: "Booking ID and OTP are required" }, { status: 400 })
    }

    // First, check if this is a regular booking or recurring session
    const regularBookingCheck = await sql`
      SELECT id FROM bookings WHERE id = ${bookingId}
    `

    const recurringSessionCheck = await sql`
      SELECT id FROM recurring_booking WHERE id = ${bookingId}
    `

    let isRecurringSession = false
    let targetTable = "bookings"
    let otpColumn = "booking_id"

    if (recurringSessionCheck.length > 0) {
      isRecurringSession = true
      targetTable = "recurring_booking"
      otpColumn = "recurring_booking_id"
    } else if (regularBookingCheck.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Get booking details INCLUDING user_id for targeted notifications
    let bookingDetails: any = null
    if (isRecurringSession) {
      const result = await sql`
        SELECT rb.*, u.id as user_id, p.name as pet_name, s.name as sitter_name, srv.name as service_name
        FROM recurring_booking rb
        JOIN users u ON rb.user_id = u.id
        JOIN pets p ON rb.pet_id = p.id
        JOIN sitters st ON rb.sitter_id = st.id
        JOIN users s ON st.user_id = s.id
        JOIN services srv ON rb.service_id = srv.id
        WHERE rb.id = ${bookingId}
      `
      bookingDetails = result[0]
    } else {
      const result = await sql`
        SELECT b.*, u.id as user_id, p.name as pet_name, s.name as sitter_name, srv.name as service_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN pets p ON b.pet_id = p.id
        JOIN sitters st ON b.sitter_id = st.id
        JOIN users s ON st.user_id = s.id
        JOIN services srv ON b.service_id = srv.id
        WHERE b.id = ${bookingId}
      `
      bookingDetails = result[0]
    }

    if (!bookingDetails) {
      return NextResponse.json({ error: "Booking details not found" }, { status: 404 })
    }

    const ownerUserId = bookingDetails.user_id

    console.log("🔐 Is recurring session:", isRecurringSession)
    console.log("🎯 Target user ID for notifications:", ownerUserId)

    // Verify the START OTP
    const otpQuery = isRecurringSession
      ? sql`
          SELECT * FROM service_otps 
          WHERE recurring_booking_id = ${bookingId} 
          AND type = 'START' 
          AND otp = ${otp} 
          AND is_used = false 
          AND (expires_at IS NULL OR expires_at > NOW())
        `
      : sql`
          SELECT * FROM service_otps 
          WHERE booking_id = ${bookingId} 
          AND type = 'START' 
          AND otp = ${otp} 
          AND is_used = false 
          AND (expires_at IS NULL OR expires_at > NOW())
        `

    const otpResult = await otpQuery

    console.log("🔐 OTP verification result:", otpResult)

    if (otpResult.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Mark OTP as used
    await sql`
      UPDATE service_otps 
      SET is_used = true, used_at = NOW() 
      WHERE id = ${otpResult[0].id}
    `

    // Update booking/session status to ONGOING
    if (isRecurringSession) {
      await sql`
        UPDATE recurring_booking 
        SET status = 'ONGOING', service_started_at = NOW(), updated_at = NOW()
        WHERE id = ${bookingId}
      `
    } else {
      await sql`
        UPDATE bookings 
        SET status = 'ONGOING', actual_start_time = NOW(), updated_at = NOW()
        WHERE id = ${bookingId}
      `
    }

    // Send FCM notification to the SPECIFIC user
    if (ownerUserId) {
      try {
        await sendFcmNotification({
          userIds: [ownerUserId],
          title: "Service Started",
          body: `${bookingDetails.sitter_name} has started caring for ${bookingDetails.pet_name}`,
        })
      } catch (notifyErr) {
        console.error("Failed to send FCM notification to owner:", notifyErr)
      }
    }

    // 🎯 TARGETED ABLY NOTIFICATION - Only to the specific pet owner
    try {
      await publishServiceUpdate(ownerUserId, "service:started", {
        bookingId: bookingId,
        status: "ONGOING",
        startedAt: new Date().toISOString(),
        sitterName: bookingDetails.sitter_name,
        petName: bookingDetails.pet_name,
        service: bookingDetails.service_name,
        bookingType: isRecurringSession ? "recurring_session" : "regular",
      })

      console.log("✅ Real-time notification sent to user:", ownerUserId)
    } catch (ablyError) {
      console.error("❌ Failed to send Ably notification:", ablyError)
      // Don't fail the entire request if Ably fails
    }

    console.log("🔐 Service started successfully for:", isRecurringSession ? "recurring session" : "regular booking")

    return NextResponse.json({
      success: true,
      message: "Service started successfully",
      bookingType: isRecurringSession ? "recurring_session" : "regular",
    })
  } catch (error) {
    console.error("Error starting service:", error)
    return NextResponse.json({ error: "Failed to start service" }, { status: 500 })
  }
}
