import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get sitter profile with user data
    const sitterResult = await sql`
      SELECT 
        s.*,
        u.name,
        u.email,
        u.phone,
        u.profile_picture,
        u.user_type,
        a.line1,
        a.line2,
        a.city,
        a.state,
        a.postal_code,
        a.country,
        a.latitude,
        a.longitude
      FROM sitters s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
      WHERE s.user_id = ${userId} AND u.user_type = 'SITTER'
    `

    if (sitterResult.length === 0) {
      return NextResponse.json({ error: "Zubo Walkers not found" }, { status: 404 })
    }

    const sitter = sitterResult[0]

    // Get total earnings from completed bookings
    const earningsResult = await sql`
      SELECT 
        COALESCE(SUM(total_price), 0) as total_earnings,
        COUNT(*) as total_bookings
      FROM bookings 
      WHERE sitter_id = ${sitter.id} AND status = 'COMPLETED'
    `

    const earnings = earningsResult[0]

    // Format response
    const response = {
      id: sitter.id,
      userId: sitter.user_id,
      phone: sitter.phone,
      name: sitter.name,
      email: sitter.email,
      photo: sitter.profile_picture,
      bio: sitter.bio,
      experience: sitter.experience,
      rating: Number.parseFloat(sitter.rating) || 0,
      totalBookings: Number.parseInt(earnings.total_bookings) || 0,
      isVerified: sitter.is_verified,
      services: sitter.services || [],
      hourlyRate: Number.parseFloat(sitter.hourly_rate) || 0,
      availability: sitter.availability || {},
      address: {
        line1: sitter.line1 || "",
        line2: sitter.line2 || "",
        city: sitter.city || "",
        state: sitter.state || "",
        postalCode: sitter.postal_code || "",
        country: sitter.country || "India",
        latitude: sitter.latitude,
        longitude: sitter.longitude,
      },
      wallet: {
        balance: 0, // Will be calculated from payments
        pendingAmount: 0,
        totalEarnings: Number.parseFloat(earnings.total_earnings) || 0,
      },
      createdAt: sitter.created_at,
      updatedAt: sitter.updated_at,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching Zubo Walkers profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
