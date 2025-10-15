import { NextResponse } from "next/server"
import { formatPhoneNumber } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { createJWTToken } from "@/lib/jwt-server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json({ success: false, message: "Phone and OTP are required" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phone)

    console.log(`🔐 Verifying OTP for sitter: ${formattedPhone}`)
    console.log(`📱 Received OTP: ${otp}`)

    // Allow temporary bypass
    // if (otp === "123456") {
    //   console.log("🧪 Using dev OTP bypass: 123456")
    //   return await handleSitterLogin(formattedPhone)
    // }

    // Find OTP
    const otpRecords = await sql`
      SELECT * FROM otp_codes
      WHERE phone = ${formattedPhone}
      AND is_used = false
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (otpRecords.length === 0) {
      return NextResponse.json(
        { success: false, message: "OTP not found or expired. Please request a new OTP." },
        { status: 400 }
      )
    }

    const otpRecord = otpRecords[0]

    // Allow expired OTPs, log it
    const now = new Date()
    const expiresAt = new Date(otpRecord.expires_at)
    if (now > expiresAt) {
      console.log(`⏰ OTP expired at ${expiresAt}, but allowing login anyway`)
    }

    // Check OTP match
    if (otpRecord.code !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 })
    }

    // Mark OTP as used
    await sql`
      UPDATE otp_codes
      SET is_used = true, updated_at = NOW()
      WHERE id = ${otpRecord.id}
    `

    console.log(`✅ OTP verified for sitter: ${formattedPhone}`)

    return await handleSitterLogin(formattedPhone)
  } catch (error) {
    console.error("❌ Sitter OTP login error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

async function handleSitterLogin(formattedPhone: string) {
  // Fetch sitter and linked user
  const sitterRecords = await sql`
    SELECT 
      s.id AS sitter_id,
      s.user_id,
      s.photo_url,
      u.phone,
      u.name,
      u.email,
      u.created_at,
      u.updated_at,
      u.is_active
    FROM sitters s
    JOIN users u ON s.user_id = u.id
    WHERE u.phone = ${formattedPhone}
    LIMIT 1
  `

  if (sitterRecords.length === 0 || !sitterRecords[0].is_active) {
    return NextResponse.json(
      { success: false, message: "Zubo Walkers not found or inactive. Please contact support." },
      { status: 404 }
    )
  }

  const sitter = sitterRecords[0]

  const user = {
    userId: sitter.user_id,
    phone: sitter.phone,
    photo: sitter.photo_url,
    name: sitter.name,
    email: sitter.email,
    userType: "sitter" as const,
    createdAt: new Date(sitter.created_at),
    updatedAt: new Date(sitter.updated_at),
    isAuthenticated: true,
  }

  const token = await createJWTToken({
    userId: sitter.user_id,
    phone: sitter.phone,
    userType: "SITTER",
  })

  console.log(`📲 Sitter logged in: ${formattedPhone}`)

  return NextResponse.json({
    success: true,
    message: "OTP verified successfully",
    user,
    sitter: user,
    token,
    isNewUser: false,
  })
}
