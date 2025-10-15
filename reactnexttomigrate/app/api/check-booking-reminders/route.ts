// app/api/send-service-reminders/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import twilio from "twilio";

// Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

const TEMPLATE_SID = "HXbc8bc28b20820667efcf3b78285aca7e"; // your WhatsApp template
const FROM_WHATSAPP = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

function formatDateIndian(date: Date): string {
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    }); // e.g. 10 Sep
}

function formatTimeIndian(date: Date): string {
    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }); // e.g. 2:15 PM
}

export async function GET() {
    try {
        // 1. Load active reminder settings
        const settings = await sql`
      SELECT * FROM reminder_settings
      WHERE type = 'SERVICE' AND is_active = true
    `;

        let remindersSent = 0;

        for (const setting of settings) {
            // 2. Find bookings due for reminders
            const bookings = await sql`
        SELECT 
          b.id,
          b.is_recurring,
          b.start_time,
          u.name AS user_name,
          u.phone,
          p.name AS pet_name,
          addr.line1 || ', ' || addr.city AS location,
          addr.latitude,
          addr.longitude
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN pets p ON b.pet_id = p.id
        LEFT JOIN addresses addr ON addr.id = b.address_id AND addr.is_active = true
        WHERE b.status = 'CONFIRMED'
        AND b.start_time > NOW()
        AND b.start_time <= NOW() + (${setting.offset_interval}::interval)
      `;

            // 3. Include recurring bookings too
            const recurringBookings = await sql`
        SELECT 
          rb.id,
          true as is_recurring,
          rb.session_date + rb.session_time AS start_time,
          u.name AS user_name,
          u.phone,
          p.name AS pet_name,
          addr.line1 || ', ' || addr.city AS location,
          addr.latitude,
          addr.longitude
        FROM recurring_booking rb
        JOIN users u ON rb.user_id = u.id
        JOIN pets p ON rb.pet_id = p.id
        LEFT JOIN addresses addr ON addr.user_id = u.id 
          AND addr.is_default = true AND addr.is_active = true
        WHERE rb.status = 'CONFIRMED'
        AND (rb.session_date + rb.session_time) > NOW()
        AND (rb.session_date + rb.session_time) <= NOW() + (${setting.offset_interval}::interval)
      `;

            const allBookings = [...bookings, ...recurringBookings];

            for (const booking of allBookings) {
                // 4. Check if already sent (respect max_attempts)
                const { count } = await sql`
          SELECT COUNT(*)::int as count
          FROM reminder_logs
          WHERE booking_id = ${booking.id}
          AND type = 'SERVICE'
          AND reminder_setting_id = ${setting.id}
        `.then((res: any[]) => res[0]);

                if (count >= setting.max_attempts) {
                    console.log(`⏩ Skipping booking ${booking.id}, attempts exhausted.`);
                    continue;
                }

                // 5. Prepare template variables
                const start = new Date(booking.start_time);
                const contentVars = {
                    "1": booking.user_name || "Customer",
                    "2": booking.pet_name || "Pet",
                    "3": formatDateIndian(start),
                    "4": formatTimeIndian(start),
                    "5": booking.location || "Location",
                    "6": booking.id,
                    "7": `booking-details/${booking.id}`,
                    "8":
                        booking.latitude && booking.longitude
                            ? `maps?q=${booking.latitude},${booking.longitude}`
                            : "maps",
                };

                try {
                    // 6. Send WhatsApp template message
                    await twilioClient.messages.create({
                        from: FROM_WHATSAPP,
                        to: `whatsapp:${booking.phone}`,
                        contentSid: TEMPLATE_SID,
                        contentVariables: JSON.stringify(contentVars),
                    });

                    remindersSent++;

                    // 7. Log reminder
                    await sql`
            INSERT INTO reminder_logs (booking_id, type, reminder_time, reminder_setting_id)
            VALUES (${booking.id}, 'SERVICE', NOW(), ${setting.id})
          `;

                    console.log(`✅ Reminder sent for booking ${booking.id}`);
                } catch (err) {
                    console.error(`❌ Failed to send reminder for booking ${booking.id}`, err);
                }
            }
        }

        return NextResponse.json({ success: true, remindersSent });
    } catch (err) {
        console.error("❌ Reminder API failed:", err);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
