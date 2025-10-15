import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
    try {
        const { to, subject, message, imageBase64, userDetails, bookingDetails } = await request.json()

        if (!to || !subject || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Configure SMTP transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.zeptomail.in",
            port: 587,
            secure: false,
            auth: {
                user: process.env.ZOHO_ZEPTO_SMTP_USER,
                pass: process.env.ZOHO_ZEPTO_SMTP_PASS,
            },
        })

        // Compose email HTML
        const emailHtml = `
          <div style="font-family:sans-serif;line-height:1.6;color:#333">
            <h2 style="color:#4caf50;">🐾 PetCare Support Request</h2>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            
            <hr style="margin:20px 0;">

            <h3 style="color:#2196f3;">👤 User Details</h3>
            <ul style="list-style:none;padding:0;">
              <li><strong>Name:</strong> ${userDetails?.name || "N/A"}</li>
              <li><strong>Email:</strong> ${userDetails?.email || "N/A"}</li>
              <li><strong>Phone:</strong> ${userDetails?.phone || "N/A"}</li>
            </ul>

            <h3 style="color:#2196f3;">📅 Booking Details</h3>
            <ul style="list-style:none;padding:0;">
              <li><strong>Booking ID:</strong> ${bookingDetails?.id || "N/A"}</li>
              <li><strong>Service Name:</strong> ${bookingDetails?.serviceName || "N/A"}</li>
              <li><strong>Pet Name:</strong> ${bookingDetails?.petName || "N/A"}</li>
              <li><strong>Date:</strong> ${bookingDetails?.date || "N/A"}</li>
              <li><strong>Time:</strong> ${bookingDetails?.time || "N/A"}</li>
              <li><strong>Status:</strong> ${bookingDetails?.status || "N/A"}</li>
              <li><strong>Total Price:</strong> ₹${bookingDetails?.totalPrice || "N/A"}</li>
            </ul>

            <p style="margin-top:20px;">Regards,<br>PetCare Team 🐶🐱</p>
          </div>
        `

        // Prepare attachments
        const attachments = imageBase64
            ? [
                {
                    filename: "attachment.png",
                    content: Buffer.from(
                        imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                        "base64"
                    ),
                    encoding: "base64",
                },
            ]
            : []

        const mailOptions = {
            from: `noreply@zubopets.com`,
            to: `${to}, ${process.env.ZOHO_EMAIL_USER}`,
            subject,
            html: emailHtml,
            attachments, // Include image as attachment
        }

        // Send the email
        await transporter.sendMail(mailOptions)

        return NextResponse.json({ success: true, message: "Email sent successfully" })
    } catch (error: any) {
        console.error("Email send error:", error)
        return NextResponse.json(
            { error: "Failed to send email", details: String(error) },
            { status: 500 }
        )
    }
}
