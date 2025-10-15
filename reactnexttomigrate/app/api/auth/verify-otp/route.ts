import { NextResponse } from "next/server"
import { formatPhoneNumber } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import type { User } from "@/types/auth"
import { createJWTToken } from "@/lib/jwt-server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json({ success: false, message: "Phone number and OTP are required" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phone)

    console.log(`🔐 Verifying OTP for: ${formattedPhone}`)
    console.log(`📱 Received OTP: ${otp}`)

    // Check for temporary bypass OTP
    // if (otp === "123456") {
    //   console.log("🧪 Using temporary bypass OTP: 123456")
    //   return await handleSuccessfulLogin(formattedPhone)
    // }

    // Get OTP from database
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
        { status: 400 },
      )
    }

    const otpRecord = otpRecords[0]

    // Check if OTP is expired (but don't enforce for now as requested)
    const now = new Date()
    const expiresAt = new Date(otpRecord.expires_at)
    if (now > expiresAt) {
      console.log(`⏰ OTP expired at ${expiresAt}, but allowing login anyway`)
    }

    // Verify OTP
    if (otpRecord.code !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP. Please try again." }, { status: 400 })
    }

    // Mark OTP as used
    await sql`
      UPDATE otp_codes 
      SET is_used = true, updated_at = NOW()
      WHERE id = ${otpRecord.id}
    `

    console.log(`✅ OTP verified successfully for ${formattedPhone}`)

    return await handleSuccessfulLogin(formattedPhone)
  } catch (error) {
    console.error("❌ Verify OTP error:", error)
    return NextResponse.json({ success: false, message: "Failed to verify OTP" }, { status: 500 })
  }
}

async function handleSuccessfulLogin(formattedPhone: string) {
  // Check if user exists in database
  const existingUsers = await sql`
    SELECT id, phone, name, email, user_type, profile_picture, created_at, updated_at
    FROM users 
    WHERE phone = ${formattedPhone} AND is_active = true
  `

  let user: User
  let isNewUser = false

  if (existingUsers.length === 0) {
    // Create new user in database
    console.log("🆕 Creating new user in database")
    const newUsers = await sql`
      INSERT INTO users (phone, user_type, is_active, created_at, updated_at)
      VALUES (${formattedPhone}, 'PET_OWNER', true, NOW(), NOW())
      RETURNING id, phone, name, email, user_type, profile_picture, created_at, updated_at
    `

    const dbUser = newUsers[0]
    user = {
      id: dbUser.id,
      phone: dbUser.phone,
      name: dbUser.name,
      email: dbUser.email,
      userType: dbUser.user_type.toLowerCase() as "pet_owner" | "sitter",
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      isAuthenticated: true,
    }
    isNewUser = true
    console.log("✅ New user created:", user)
  } else {
    // User exists, return existing user
    console.log("👤 Found existing user in database")
    const dbUser = existingUsers[0]

    // Check if this user is a sitter - they should use sitter login
    if (dbUser.user_type === "SITTER") {
      console.log("🚫 Blocking sitter from user login")
      return NextResponse.json(
        {
          success: false,
          message: "This phone number is registered as a Zubo Walkers. Please use the Zubo Walkers login option.",
        },
        { status: 403 },
      )
    }

    user = {
      id: dbUser.id,
      phone: dbUser.phone,
      name: dbUser.name,
      email: dbUser.email,
      userType: dbUser.user_type.toLowerCase() as "pet_owner" | "sitter",
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      isAuthenticated: true,
    }
    isNewUser = !dbUser.name // If name is not set, consider as new user
    console.log("✅ Existing user found:", user)
  }

  const authenticatedUser = user

  // Create JWT token with proper payload
  const token = await createJWTToken({
    userId: authenticatedUser.id,
    phone: authenticatedUser.phone,
    userType: "OWNER",
  })

  console.log(`📊 Returning isNewUser: ${isNewUser} for phone: ${formattedPhone}`)

  return NextResponse.json({
    success: true,
    message: "OTP verified successfully",
    user,
    token,
    isNewUser,
  })
}
