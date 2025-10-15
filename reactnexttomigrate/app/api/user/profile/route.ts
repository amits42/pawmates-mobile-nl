export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Initialize the SQL client
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("👤 Fetching user profile from database...")

    // Get user ID from query params
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    const phone = url.searchParams.get("phone")

    if (!userId && !phone) {
      return NextResponse.json({ error: "User ID or phone is required" }, { status: 400 })
    }

    let users
    if (userId) {
      users = await sql`
        SELECT 
          id,
          phone,
          name, -- Select 'name' instead of 'firstName' and 'lastName'
          email,
          user_type as "userType",
          profile_picture as "profilePicture",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `
    } else {
      users = await sql`
        SELECT 
          id,
          phone,
          name, -- Select 'name' instead of 'firstName' and 'lastName'
          email,
          user_type as "userType",
          profile_picture as "profilePicture",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users
        WHERE phone = ${phone}
        LIMIT 1
      `
    }

    if (users.length === 0) {
      console.log("❌ User not found:", userId || phone)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(users[0])
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log("📝 Updating user profile...")
    const body = await request.json()
    console.log("📥 Profile data received:", body)

    // Get user ID from request body or use phone to find user
    let userId = body.userId
    const phone = body.phone

    if (!userId && !phone) {
      console.log("❌ User ID or phone is required")
      return NextResponse.json({ error: "User ID or phone is required" }, { status: 400 })
    }

    // If no userId provided, find user by phone
    if (!userId && phone) {
      console.log("🔍 Finding user by phone:", phone)
      const users = await sql`
        SELECT id FROM users WHERE phone = ${phone} LIMIT 1
      `

      if (users.length === 0) {
        console.log("❌ User not found with phone:", phone)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      userId = users[0].id
      console.log("✅ Found user ID:", userId)
    }

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      // Validate 'name'
      console.log("❌ Name is required")
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    console.log("🔄 Updating user profile for ID:", userId)

    // Update user profile
    const updatedUsers = await sql`
      UPDATE users
      SET 
        name = ${body.name.trim()}, -- Update 'name'
        email = ${body.email || null},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING 
        id,
        phone,
        name, -- Return 'name'
        email,
        user_type as "userType",
        profile_picture as "profilePicture",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    if (updatedUsers.length === 0) {
      console.log("❌ User not found for update:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = updatedUsers[0]
    console.log("✅ User profile updated successfully:", updatedUser)

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
        message: "Failed to update profile",
      },
      { status: 500 },
    )
  }
}
