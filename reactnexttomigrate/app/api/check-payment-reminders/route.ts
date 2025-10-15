import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import twilio from "twilio"

const sql = neon(process.env.DATABASE_URL!)
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    try {
        console.log("💳 Running Payment Reminder Cron at", new Date().toISOString())

        // 1️⃣ Get active reminder rules for payments
        const settings = await sql`
      SELECT id, type, offset_interval, max_attempts
      FROM reminder_settings
      WHERE type LIKE 'PAYMENT%' AND is_active = true
    `

        let remindersSent = 0

        for (const setting of settings) {
            // 2️⃣ Build query condition depending on rule type
            const timeColumn = setting.type === "PAYMENT_CREATED" ? "b.created_at" : "b.start_time"

            // --- Normal bookings ---
            const candidatesResult = await sql.unsafe(`
                SELECT b.id, b.start_time, b.created_at, u.phone
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                WHERE b.status = 'PENDING_PAYMENT'
                AND ${timeColumn} <= NOW() - INTERVAL '${setting.offset_interval}'
            `);
            const candidates = candidatesResult.rows || [];

            for (const booking of candidates) {
                // 3️⃣ Check if reminder already sent (max_attempts limit)
                const alreadySent = await sql`
                    SELECT COUNT(*)::int as count
                    FROM reminder_logs
                    WHERE booking_id = ${booking.id}
                    AND type = ${setting.type}
                `
                if (alreadySent[0].count >= setting.max_attempts) {
                    continue // skip, already sent max reminders
                }

                // 4️⃣ Construct payment link
                const paymentUrl = `https://www.zubopets.com/book-service/payment?bookingId=${booking.id}&payExisting=true`

                const message = `💳 Payment Reminder from ZuboPets 💳\n\nYou have a pending payment for your booking on ${booking.start_time.toLocaleString()}.\nPlease complete your payment to confirm your spot 🐶🐾\n\nPay here: ${paymentUrl}`

                try {
                    await twilioClient.messages.create({
                        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                        to: `whatsapp:${booking.phone}`,
                        body: message,
                    })

                    remindersSent++

                    // 5️⃣ Log reminder
                    await sql`
                        INSERT INTO reminder_logs (booking_id, type, reminder_time)
                        VALUES (${booking.id}, ${setting.type}, NOW())
                    `

                    console.log(`✅ Reminder sent (${setting.type}) for booking ${booking.id}`)
                } catch (err) {
                    console.error(`❌ Failed to send reminder for booking ${booking.id}`, err)
                }
            }

            // --- Recurring bookings (sessions) ---
            const recurringTimeColumn = setting.type === "PAYMENT_CREATED" ? "r.created_at" : "r.session_date"
            const recurringResult = await sql.unsafe(`
                SELECT r.id, r.session_date, r.session_time, r.created_at, u.phone
                FROM recurring_booking r
                JOIN users u ON r.user_id = u.id
                WHERE r.payment_status = 'PENDING'
                AND ${recurringTimeColumn} <= NOW() - INTERVAL '${setting.offset_interval}'
            `);
            const recurringCandidates = recurringResult.rows || [];

            for (const session of recurringCandidates) {
                // Check if reminder already sent (max_attempts limit)
                const alreadySent = await sql`
                    SELECT COUNT(*)::int as count
                    FROM reminder_logs
                    WHERE recurring_booking_id = ${session.id}
                    AND type = ${setting.type}
                `
                if (alreadySent[0].count >= setting.max_attempts) {
                    continue // skip, already sent max reminders
                }

                // Construct recurring payment link
                const paymentUrl = `https://www.zubopets.com/book-service/payment?recurringBookingId=${session.id}&payRecurring=true`

                const message = `💳 Payment Reminder from ZuboPets 💳\n\nYou have a pending payment for your recurring session on ${session.session_date} at ${session.session_time}.\nPlease complete your payment to confirm your spot 🐶🐾\n\nPay here: ${paymentUrl}`

                try {
                    await twilioClient.messages.create({
                        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                        to: `whatsapp:${session.phone}`,
                        body: message,
                    })

                    remindersSent++

                    // Log reminder
                    await sql`
                        INSERT INTO reminder_logs (recurring_booking_id, type, reminder_time)
                        VALUES (${session.id}, ${setting.type}, NOW())
                    `

                    console.log(`✅ Reminder sent (${setting.type}) for recurring session ${session.id}`)
                } catch (err) {
                    console.error(`❌ Failed to send reminder for recurring session ${session.id}`, err)
                }
            }
        }

        return NextResponse.json({ success: true, remindersSent })
    } catch (error) {
        console.error("❌ Error in payment reminder cron:", error)
        return NextResponse.json({ success: false, message: "Failed" }, { status: 500 })
    }
}
