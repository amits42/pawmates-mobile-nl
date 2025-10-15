import { sql } from "@vercel/postgres";
import nodemailer from "nodemailer";

// ✅ Nodemailer transporter (update SMTP settings)
const transporter = nodemailer.createTransport({
  host: "smtp.zeptomail.in",
  port: 587,
  auth: {
    user: process.env.ZOHO_ZEPTO_SMTP_USER,
    pass: process.env.ZOHO_ZEPTO_SMTP_PASS,
  },
});

/**
 * Send booking confirmation email
 * @param {Object} params
 * @param {string} [params.bookingId]
 */
export async function sendBookingEmail({ bookingId, recurringBookingId }) {
  // commenting out the email functionality
  return;
  try {
    // 🔥 Fetch booking details
    let bookingDetails;
    if (bookingId) {
      const result = await sql`
        SELECT b.*, u.email AS user_email, u.name AS user_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ${bookingId};
      `;
      if (result.rowCount === 0) throw new Error(`Booking ID ${bookingId} not found`);
      bookingDetails = result.rows[0];
    }
    else if (recurringBookingId) {
      const result = await sql`
        SELECT rb.*, u.email AS user_email, u.name AS user_name
        FROM recurring_booking rb
        JOIN users u ON rb.user_id = u.id
        WHERE rb.id = ${recurringBookingId};
      `;
      if (result.rowCount === 0) throw new Error(`Recurring Booking ID ${recurringBookingId} not found`);
      bookingDetails = result.rows[0];
    }
    else {
      throw new Error("Provide either bookingId or recurringBookingId");
    }

    const { user_email, user_name, id, date, time, total_price, session_date, session_time } = bookingDetails;

    const bookingDate = date || session_date;
    const bookingTime = time || session_time;
    const price = total_price || bookingDetails.session_price;

    // 🌟 ZuboPets branded HTML email template
    const logoUrl = "https://www.zubopets.com/logo/zubo-logo-white.png"; // ZuboPets logo
    const appUrl = `https://www.zubopets.com/booking-details/${id}`; // ✅ dynamic booking details page

    const userHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8faf9; padding: 20px; color: #253347; line-height: 1.6;">
        <table style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(37, 51, 71, 0.1); border: 1px solid #e8ebf0;">
          
          <!-- Header with ZuboPets branding -->
          <tr>
            <td style="text-align: center; background: linear-gradient(135deg, #253347 0%, #3d4a5c 100%); padding: 30px 20px;">
              <img src="${logoUrl}" alt="ZuboPets Logo" style="height: 60px; margin-bottom: 10px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">ZuboPets</h1>
              <p style="color: #aab89b; margin: 5px 0 0 0; font-size: 14px;">Premium Pet Care Services</p>
            </td>
          </tr>
          
          
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              <div style="background: #f5f7f3; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #aab89b;">
                <h3 style="color: #253347; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Hi ${user_name}! 👋</h3>
                <p style="color: #4a5568; margin: 0; font-size: 16px;">Great news! Your pet care booking has been successfully confirmed. We're excited to take care of your furry friend!</p>
              </div>
              
              <!-- Booking Details Card -->
              <div style="background: #ffffff; border: 2px solid #e8ebf0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <h4 style="color: #253347; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #f5f7f3; padding-bottom: 10px;">📋 Booking Details</h4>
                
                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; align-items: center; padding: 12px; background: #f8faf9; border-radius: 8px;">
                    <span style="color: #aab89b; font-size: 18px; margin-right: 12px;">🆔</span>
                    <div>
                      <strong style="color: #253347; font-size: 14px;">Booking ID:</strong>
                      <span style="color: #4a5568; margin-left: 8px; font-family: monospace; background: #e8ebf0; padding: 2px 6px; border-radius: 4px;">${id}</span>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; padding: 12px; background: #f8faf9; border-radius: 8px;">
                    <span style="color: #aab89b; font-size: 18px; margin-right: 12px;">📅</span>
                    <div>
                      <strong style="color: #253347; font-size: 14px;">Date:</strong>
                      <span style="color: #4a5568; margin-left: 8px;">${bookingDate}</span>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; padding: 12px; background: #f8faf9; border-radius: 8px;">
                    <span style="color: #aab89b; font-size: 18px; margin-right: 12px;">⏰</span>
                    <div>
                      <strong style="color: #253347; font-size: 14px;">Time:</strong>
                      <span style="color: #4a5568; margin-left: 8px;">${bookingTime}</span>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; padding: 12px; background: #f0f9f4; border-radius: 8px; border: 1px solid #d4edda;">
                    <span style="color: #28a745; font-size: 18px; margin-right: 12px;">💰</span>
                    <div>
                      <strong style="color: #253347; font-size: 14px;">Total Amount:</strong>
                      <span style="color: #28a745; margin-left: 8px; font-size: 16px; font-weight: 600;">₹${price}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #253347 0%, #3d4a5c 100%); color: #ffffff; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 16px rgba(37, 51, 71, 0.3); transition: all 0.3s ease;">
                  🐾 View Booking Details
                </a>
              </div>
              
              <!-- Additional Info -->
              <div style="background: #fff8e1; border: 1px solid #ffecb3; border-radius: 8px; padding: 20px; margin-top: 25px;">
                <h4 style="color: #f57c00; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">📞 Need Help?</h4>
                <p style="color: #5d4037; margin: 0; font-size: 14px;">If you have any questions or need to make changes to your booking, please don't hesitate to contact our support team. We're here to help!</p>
              </div>
              
              <p style="margin-top: 30px; color: #4a5568; font-size: 16px; text-align: center;">Thank you for choosing ZuboPets for your pet's care! ❤️🐾</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #253347; text-align: center; font-size: 12px; color: #aab89b; padding: 25px 20px;">
              <div style="margin-bottom: 15px;">
                <img src="${logoUrl}" alt="ZuboPets" style="height: 30px; opacity: 0.8;" />
              </div>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #ffffff;">🐾 Your Trusted Pet Care Partner</p>
              <p style="margin: 0; font-size: 11px; opacity: 0.8;">© ${new Date().getFullYear()} ZuboPets. All rights reserved.</p>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #3d4a5c;">
                <p style="margin: 0; font-size: 10px; opacity: 0.7;">This email was sent to ${user_email}</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const adminHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8faf9; padding: 20px; color: #253347;">
        <table style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(37, 51, 71, 0.1); border: 1px solid #e8ebf0;">
          
          <!-- Admin Header -->
          <tr>
            <td style="text-align: center; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">🚨 New Booking Alert</h1>
              <p style="color: #ffcccb; margin: 5px 0 0 0; font-size: 14px;">ZuboPets Admin Dashboard</p>
            </td>
          </tr>
          
          <!-- Admin Content -->
          <tr>
            <td style="padding: 25px;">
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
                <h3 style="color: #253347; margin: 0 0 15px 0; font-size: 18px;">📢 New Booking Received!</h3>
                <p style="color: #4a5568; margin: 0;">A new pet care booking has been confirmed and requires your attention.</p>
              </div>
              
              <!-- Booking Summary -->
              <div style="background: #ffffff; border: 2px solid #e8ebf0; border-radius: 8px; padding: 20px;">
                <h4 style="color: #253347; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Customer & Booking Information:</h4>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; font-weight: 600; color: #253347; width: 30%;">Customer:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; color: #4a5568;">${user_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; font-weight: 600; color: #253347;">Email:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; color: #4a5568;">${user_email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; font-weight: 600; color: #253347;">Booking ID:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; color: #4a5568; font-family: monospace; background: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; font-weight: 600; color: #253347;">Date:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; color: #4a5568;">${bookingDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; font-weight: 600; color: #253347;">Time:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f5f7f3; color: #4a5568;">${bookingTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #253347;">Total Price:</td>
                    <td style="padding: 8px 0; color: #28a745; font-weight: 600; font-size: 16px;">₹${price}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Action Required -->
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <h4 style="color: #856404; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">⚡ Action Required:</h4>
                <p style="color: #856404; margin: 0; font-size: 13px;">Please verify the booking details and assign an appropriate Zubo Walkers. Ensure all necessary preparations are made for the scheduled service.</p>
              </div>
            </td>
          </tr>
          
          <!-- Admin Footer -->
          <tr>
            <td style="background: #253347; text-align: center; font-size: 11px; color: #aab89b; padding: 15px;">
              <p style="margin: 0;">ZuboPets Admin System - Automated Notification</p>
              <p style="margin: 5px 0 0 0; opacity: 0.8;">© ${new Date().getFullYear()} ZuboPets</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    // ✅ Send email to user
    await transporter.sendMail({
      from: 'notifications@zubopets.com',
      to: user_email,
      subject: "🎉 Your ZuboPets Booking is Confirmed! 🐾",
      html: userHtml,
    });
    console.log(`✅ Email sent to user: ${user_email}`);

    // ✅ Send email to admin
    await transporter.sendMail({
      from: 'notifications@zubopets.com',
      to: "care@zubopets.com",
      subject: `🚨 New ZuboPets Booking: ID ${id}`,
      html: adminHtml,
    });
  } catch (error) {
    console.error("❌ Failed to send booking email:", error);
    throw error;
  }
}
