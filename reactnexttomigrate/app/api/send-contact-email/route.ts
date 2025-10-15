import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json()

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        // Transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.zoho.in",
            port: 465,
            secure: true,
            auth: {
                user: process.env.ZOHO_EMAIL_USER,
                pass: process.env.ZOHO_EMAIL_PASS,
            },
        })

        // Email to you (admin)
        const adminMailOptions = {
            from: `"PetCare 🐾" <${process.env.ZOHO_EMAIL_USER}>`,
            to: `${process.env.ZOHO_EMAIL_USER}`,
            subject: `📬 New Contact from ${name}`,
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
        }

        // Auto-reply to user
        const userReplyOptions = {
            from: `"PetCare 🐾" <${process.env.ZOHO_EMAIL_USER}>`,
            to: email,
            subject: "📨 We Received Your Message",
            html: `
                <p>Hi ${name},</p>
                <p>Thank you for contacting PetCare. We've received your message and will get back to you shortly.</p>
                <p><em>Your message:</em></p>
                <blockquote>${message}</blockquote>
                <p>Best regards,<br/>PetCare Team 🐶</p>
            `,
        }

        // Send both emails
        await transporter.sendMail(adminMailOptions)
        await transporter.sendMail(userReplyOptions)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Email sending failed:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
