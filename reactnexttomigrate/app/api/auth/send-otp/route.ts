import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import twilio from "twilio"

const sql = neon(process.env.DATABASE_URL!)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const TEMPLATE_SID = "HX5d94201ad97f4169771d7d46b5a528c8"

export async function POST(request: Request) {
  try {
    const { phone, userType = "PET_OWNER" } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 })
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ success: false, message: "Invalid phone number format" }, { status: 400 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    console.log(`📱 Generating OTP for: ${phone}`)
    console.log(`🔐 Generated OTP: ${otp}`)
    console.log(`👤 User type: ${userType}`)

    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users
      WHERE phone = ${phone} AND is_active = true
    `

    let userId = null
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id
    }

    // Delete any existing OTPs for this phone
    await sql`
      DELETE FROM otp_codes 
      WHERE phone = ${phone}
    `

    // Store OTP in database
    await sql`
      INSERT INTO otp_codes (
        user_id,
        phone,
        code,
        user_type,
        expires_at,
        is_used,
        created_at
      ) VALUES (
        ${userId},
        ${phone},
        ${otp},
        ${userType},
        ${expiresAt.toISOString()},
        false,
        NOW()
      )
    `

    console.log(`💾 OTP saved to database for ${phone} with user_type: ${userType}`)

    // Send OTP via Twilio WhatsApp Template
    const sendSuccess = await sendOTPViaWhatsApp(phone, otp)

    if (!sendSuccess) {
      return NextResponse.json({
        success: false,
        message: "Failed to send OTP via WhatsApp"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your WhatsApp",
      userId,
      expiresAt: expiresAt.toISOString(),
      expiresIn: "10 minutes",
      otp, // For development/testing only, remove in production
    })
  } catch (error) {
    console.error("❌ Error sending OTP:", error)
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
  }
}

async function sendOTPViaWhatsApp(phone: string, otp: string): Promise<boolean> {
  //return true;
  try {
    // Sanitize phone number
    let formattedPhone = phone.replace(/[^\d+]/g, "")
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone
    }

    const message = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`,
      to: `whatsapp:${formattedPhone}`,
      contentSid: TEMPLATE_SID,
      contentVariables: JSON.stringify({
        "1": otp
      }),
    })

    console.log(`✅ WhatsApp OTP template sent to ${formattedPhone}, SID: ${message.sid}`)
    return true
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp OTP template to ${phone}:`, err)
    return false
  }
}
