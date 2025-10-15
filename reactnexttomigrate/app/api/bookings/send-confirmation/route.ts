import { sendBookingEmail } from "@/lib/sendBookingEmail";
import { NextResponse } from "next/server";
import twilio from "twilio";
import { sql } from "@vercel/postgres";

// Twilio config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!;
const TEMPLATE_SID = "HXae46b9a1739c93e1bfd9c0ab8e3ff0f0"; // your template ID

const DEBUG = true;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
  try {
    const { bookingId, isRecurring, startOtp, endOtp, payLater } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ success: false, message: "bookingId is required" }, { status: 400 });
    }

    let booking;

    if (isRecurring) {
      const result = await sql`
  SELECT
    rb.id,
    u.name AS user_name,
    p.name AS pet_name,
    s.name AS service_name,
    rb.session_date,
    rb.session_time,
    rb.status,
    rb.payment_status,
    rb.service_started_at,
    rb.service_ended_at,
    rb.notes,
    (addr.line1 ||
      (CASE WHEN addr.line2 IS NOT NULL AND addr.line2 <> '' THEN ', ' || addr.line2 ELSE '' END) ||
      (CASE WHEN addr.landmark IS NOT NULL AND addr.landmark <> '' THEN ' (Landmark: ' || addr.landmark || ')' ELSE '' END)
    ) AS location,
    addr.latitude,
    addr.longitude,
    u.phone
  FROM recurring_booking rb
  JOIN users u ON rb.user_id = u.id
  JOIN pets p ON rb.pet_id = p.id
  JOIN services s ON rb.service_id = s.id
  LEFT JOIN addresses addr 
    ON addr.user_id = u.id 
   AND addr.is_default = true 
   AND addr.is_active = true
  WHERE rb.id = ${bookingId}
  LIMIT 1;
`;


      booking = result.rows[0];
    } else {
      const result = await sql`
  SELECT
    b.id,
    u.name AS user_name,
    p.name AS pet_name,
    s.name AS service_name,
    b.date AS session_date,
    b.time AS session_time,
    b.status,
    b.is_recurring,
    b.payment_status,
    b.service_otp,
    b.actual_start_time AS service_started_at,
    b.actual_end_time AS service_ended_at,
    b.notes,
    -- Prefer address from booking.address_id, else fallback to user's default address
    COALESCE(
      addr1.line1 ||
        (CASE WHEN addr1.line2 IS NOT NULL AND addr1.line2 <> '' THEN ', ' || addr1.line2 ELSE '' END) ||
        (CASE WHEN addr1.landmark IS NOT NULL AND addr1.landmark <> '' THEN ' (Landmark: ' || addr1.landmark || ')' ELSE '' END),
      addr2.line1 ||
        (CASE WHEN addr2.line2 IS NOT NULL AND addr2.line2 <> '' THEN ', ' || addr2.line2 ELSE '' END) ||
        (CASE WHEN addr2.landmark IS NOT NULL AND addr2.landmark <> '' THEN ' (Landmark: ' || addr2.landmark || ')' ELSE '' END)
    ) AS location,
    COALESCE(addr1.latitude, addr2.latitude) AS latitude,
    COALESCE(addr1.longitude, addr2.longitude) AS longitude,
    u.phone
  FROM bookings b
  JOIN users u ON b.user_id = u.id
  JOIN pets p ON b.pet_id = p.id
  JOIN services s ON b.service_id = s.id
  LEFT JOIN addresses addr1 
    ON addr1.id = b.address_id 
   AND addr1.is_active = true
  LEFT JOIN addresses addr2 
    ON addr2.user_id = u.id 
   AND addr2.is_default = true 
   AND addr2.is_active = true
  WHERE b.id = ${bookingId}
  LIMIT 1;
`;


      booking = result.rows[0];
    }

    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    // Format date
    function formatIndianFriendlyDate(dateString: string): string {
      const date = new Date(dateString);
      const day = date.getDate();

      const suffix =
        day === 1 || day === 21 || day === 31 ? "st" :
          day === 2 || day === 22 ? "nd" :
            day === 3 || day === 23 ? "rd" : "th";

      const formattedDate = new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric',
      }).format(date);

      return `${day}${suffix} ${formattedDate}`;
    }
    function formatIndianFriendlyTime(timeString: string): string {
      const date = new Date(`1970-01-01T${timeString}`);
      return new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    }


    // Prepare recipient phone
    let toPhone = booking.phone?.replace(/[^\d]/g, "") || "";
    if (!toPhone.startsWith("+")) toPhone = "+" + toPhone;

    // If both OTPs exist → use template message
    if ((startOtp && endOtp) || payLater) {
      if (!booking.is_recurring) {
        const contentVars = {
          "1": booking.user_name || "Customer", // {{1}}
          "2": booking.pet_name || "Pet",       // {{2}}
          "3": formatIndianFriendlyDate(booking.session_date), // {{3}}
          "4": formatIndianFriendlyTime(booking.session_time), // {{4}}
          "5": booking.location || "Location",  // {{5}}
          "6": `#${(booking.id || bookingId).toString().slice(-5)}`,         // {{6}}
          "7": `booking-details/${bookingId}`,  // {{7}} path only
          "8": booking.latitude && booking.longitude
            ? `maps?q=${booking.latitude},${booking.longitude}`
            : "maps", // {{8}} fallback if coords missing
        };


        const response = await client.messages.create({
          from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${toPhone}`,
          contentSid: TEMPLATE_SID,
          contentVariables: JSON.stringify(contentVars),
        });
      } else {
        // get the first session details for this recurring booking
        const session = await sql`
          SELECT rb.session_date, rb.session_time
          FROM recurring_booking rb
          WHERE rb.booking_id = ${bookingId}
          AND rb.sequence_number = 1
          LIMIT 1;
        `;

        const firstSession = session.rows[0];
        if (!firstSession) {
          throw new Error("First session not found for recurring booking");
        }

        const contentVars = {
          "1": booking.user_name || "Customer", // {{1}}
          "2": booking.pet_name || "Pet",       // {{2}}
          "3": formatIndianFriendlyDate(firstSession.session_date), // {{3}}
          "4": formatIndianFriendlyTime(firstSession.session_time), // {{4}}
          "5": booking.location || "Location",  // {{5}}
          "6": `#${(booking.id || bookingId).toString().slice(-5)}`,         // {{6}}
          "7": `booking-details/${bookingId}`,  // {{7}}
          "8": booking.latitude && booking.longitude
            ? `maps?q=${booking.latitude},${booking.longitude}`
            : "maps", // {{8}}
        };

        const response = await client.messages.create({
          from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${toPhone}`,
          contentSid: 'HX6860561dd418ce9133ff896856e009a3',
          contentVariables: JSON.stringify(contentVars),
        });
      }
    } else {
      // Use new payment confirmation template with end OTP and booking details button (optimized)
      // Prepare queries based on isRecurring
      const paymentQuery = isRecurring
        ? sql`SELECT amount, payment_method FROM payments WHERE recurring_booking_id = ${bookingId} ORDER BY created_at DESC LIMIT 1;`
        : sql`SELECT amount, payment_method FROM payments WHERE booking_id = ${bookingId} ORDER BY created_at DESC LIMIT 1;`;
      const otpQuery = isRecurring
        ? sql`SELECT otp FROM service_otps WHERE recurring_booking_id = ${bookingId} AND type = 'END' LIMIT 1;`
        : sql`SELECT otp FROM service_otps WHERE booking_id = ${bookingId} AND type = 'END' LIMIT 1;`;

      // Run queries in parallel
      const [paymentResult, otps] = await Promise.all([paymentQuery, otpQuery]);
      const payment = paymentResult.rows[0];
      const amount = payment?.amount ? Number(payment.amount).toLocaleString('en-IN') : '0';
      const method = payment?.payment_method || 'Unknown';
      const endOtp = otps.rows[0]?.otp || '';
      const buttonLink = isRecurring
        ? `recurring-session?recurringBookingId=${bookingId}`
        : `booking-details/${bookingId}`;

      // Template variables:
      // 1: Customer name
      // 2: Amount
      // 3: Payment method
      // 4: Booking ID
      // 5: End OTP
      // 6: Button link
      const contentVars = {
        "1": booking.user_name || "Customer",
        "2": amount,
        "3": method,
        "4": `#${(booking.id || bookingId).toString().slice(-5)}`,
        "5": endOtp,
        "6": buttonLink,
      };

      const response = await client.messages.create({
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${toPhone}`,
        contentSid: 'HX390eceff98a8716b5dec09bba88a26dc',
        contentVariables: JSON.stringify(contentVars),
      });

    }

    // Send email
    await sendBookingEmail({
      bookingId: isRecurring ? null : bookingId,
      recurringBookingId: isRecurring ? bookingId : null,
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent via WhatsApp 📱",
      bookingId,
    });
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send WhatsApp notification",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
