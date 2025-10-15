import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

// Initialize the SQL client
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware-verified headers
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    console.log("📍 Fetching user address(es) from database...")

    // Fetch all active addresses for the user
    const addresses = await sql`
      SELECT 
        id,
        user_id as "userId",
        line1,
        line2,
        city,
        state,
        postal_code as "postalCode",
        country,
        latitude,
        longitude,
        landmark,
        is_default as "isDefault",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM addresses
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY is_default DESC, created_at ASC
    `

    return NextResponse.json(addresses)
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from middleware-verified headers
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    console.log("📝 Updating user address...")
    const body = await request.json()
    console.log("📥 Address data received:", body)

    // Validate required fields
    if (!body.line1 || !body.city || !body.state || !body.postalCode) {
      console.log("❌ Missing required address fields")
      return NextResponse.json(
        {
          error: "Missing required address fields",
          required: ["line1", "city", "state", "postalCode"],
        },
        { status: 400 },
      )
    }

    console.log("🔄 Processing address for user ID:", userId)

    // Process latitude and longitude
    let latitude = null
    let longitude = null

    if (body.latitude !== undefined && body.latitude !== null) {
      latitude = Number.parseFloat(body.latitude)
      console.log("📍 Parsed latitude:", latitude)
    }

    if (body.longitude !== undefined && body.longitude !== null) {
      longitude = Number.parseFloat(body.longitude)
      console.log("📍 Parsed longitude:", longitude)
    }

    let updatedAddress

    if (body.id) {
      // Update existing address
      console.log("🔄 Updating existing address with ID:", body.id)

      // If setting as default, unset other default addresses
      if (body.isDefault) {
        await sql`
          UPDATE addresses
          SET is_default = false, updated_at = NOW()
          WHERE user_id = ${userId} AND is_default = true AND id != ${body.id}
        `
      }

      const updated = await sql`
        UPDATE addresses
        SET 
          line1 = ${body.line1},
          line2 = ${body.line2 || null},
          city = ${body.city},
          state = ${body.state},
          postal_code = ${body.postalCode},
          country = ${body.country || "India"},
          landmark = ${body.landmark || null},
          latitude = ${latitude},
          longitude = ${longitude},
          is_default = ${body.isDefault || false},
          updated_at = NOW()
        WHERE id = ${body.id} AND user_id = ${userId}
        RETURNING 
          id,
          user_id as "userId",
          line1,
          line2,
          city,
          state,
          postal_code as "postalCode",
          country,
          latitude,
          longitude,
          landmark,
          is_default as "isDefault",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `

      if (updated.length === 0) {
        return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 })
      }

      updatedAddress = updated[0]
      console.log("✅ Address updated:", updatedAddress)
    } else {
      // Find existing default address to update
      const existingAddresses = await sql`
        SELECT * FROM addresses
        WHERE user_id = ${userId} AND is_default = true AND is_active = true
        LIMIT 1
      `

      console.log("🔍 Existing default addresses found:", existingAddresses.length)

      if (existingAddresses.length > 0) {
        console.log("🔄 Updating existing default address...")

        const updated = await sql`
          UPDATE addresses
          SET 
            line1 = ${body.line1},
            line2 = ${body.line2 || null},
            city = ${body.city},
            state = ${body.state},
            postal_code = ${body.postalCode},
            country = ${body.country || "India"},
            landmark = ${body.landmark || null},
            latitude = ${latitude},
            longitude = ${longitude},
            updated_at = NOW()
          WHERE id = ${existingAddresses[0].id}
          RETURNING 
            id,
            user_id as "userId",
            line1,
            line2,
            city,
            state,
            postal_code as "postalCode",
            country,
            latitude,
            longitude,
            landmark,
            is_default as "isDefault",
            is_active as "isActive",
            created_at as "createdAt",
            updated_at as "updatedAt"
        `
        updatedAddress = updated[0]
        console.log("✅ Default address updated:", updatedAddress)
      } else {
        console.log("➕ Creating new default address...")

        const newAddresses = await sql`
          INSERT INTO addresses (
            user_id,
            line1,
            line2,
            city,
            state,
            postal_code,
            country,
            landmark,
            latitude,
            longitude,
            is_default,
            is_active
          ) VALUES (
            ${userId},
            ${body.line1},
            ${body.line2 || null},
            ${body.city},
            ${body.state},
            ${body.postalCode},
            ${body.country || "India"},
            ${body.landmark || null},
            ${latitude},
            ${longitude},
            true,
            true
          )
          RETURNING 
            id,
            user_id as "userId",
            line1,
            line2,
            city,
            state,
            postal_code as "postalCode",
            country,
            latitude,
            longitude,
            landmark,
            is_default as "isDefault",
            is_active as "isActive",
            created_at as "createdAt",
            updated_at as "updatedAt"
        `
        updatedAddress = newAddresses[0]
        console.log("✅ New default address created:", updatedAddress)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    })
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update address",
        message: "Failed to update address",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware-verified headers
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { line1, line2, city, state, postalCode, country, latitude, longitude, landmark, isDefault } = body

    // Validate required fields
    if (!line1 || !city || !state || !postalCode || !country) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await sql`
        UPDATE addresses 
        SET is_default = false, updated_at = now()
        WHERE user_id = ${userId}
      `
    }

    // Check if this is the first address (should be default)
    const existingAddresses = await sql`
      SELECT COUNT(*) as count FROM addresses 
      WHERE user_id = ${userId} AND is_active = true
    `

    const shouldBeDefault = isDefault || existingAddresses[0].count === 0

    // Create the new address
    const result = await sql`
      INSERT INTO addresses (
        user_id, line1, line2, city, state, postal_code, country, 
        latitude, longitude, landmark, is_default, is_active
      ) VALUES (
        ${userId}, ${line1}, ${line2 || null}, ${city}, ${state}, 
        ${postalCode}, ${country}, ${latitude || null}, ${longitude || null}, 
        ${landmark || null}, ${shouldBeDefault}, true
      ) RETURNING *
    `

    const address = result[0]
    return NextResponse.json(
      {
        id: address.id,
        userId: address.user_id,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        country: address.country,
        latitude: address.latitude,
        longitude: address.longitude,
        landmark: address.landmark,
        isDefault: address.is_default,
        isActive: address.is_active,
        createdAt: address.created_at,
        updatedAt: address.updated_at,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating address:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
