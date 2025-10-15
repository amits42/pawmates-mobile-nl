import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from middleware-verified headers
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const addressId = params.id
    const body = await request.json()
    const { line1, line2, city, state, postalCode, country, latitude, longitude, landmark, isDefault } = body

    // If setting as default, unset other default addresses first
    if (isDefault) {
      await sql`
        UPDATE addresses 
        SET is_default = false, updated_at = now()
        WHERE user_id = ${userId} AND id != ${addressId}
      `
    }

    // Update the address
    const result = await sql`
      UPDATE addresses 
      SET 
        line1 = ${line1},
        line2 = ${line2 || null},
        city = ${city},
        state = ${state},
        postal_code = ${postalCode},
        country = ${country},
        latitude = ${latitude || null},
        longitude = ${longitude || null},
        landmark = ${landmark || null},
        is_default = ${isDefault || false},
        updated_at = now()
      WHERE id = ${addressId} AND user_id = ${userId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ message: "Address not found" }, { status: 404 })
    }

    const address = result[0]
    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("Error updating address:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user ID from middleware-verified headers
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const addressId = params.id

    // Check if this is the only address
    const addressCount = await sql`
      SELECT COUNT(*) as count FROM addresses 
      WHERE user_id = ${userId} AND is_active = true
    `

    if (addressCount[0].count <= 1) {
      return NextResponse.json({ message: "Cannot delete the only address" }, { status: 400 })
    }

    // Check if this is the default address
    const addressToDelete = await sql`
      SELECT is_default FROM addresses 
      WHERE id = ${addressId} AND user_id = ${userId}
    `

    if (addressToDelete.length === 0) {
      return NextResponse.json({ message: "Address not found" }, { status: 404 })
    }

    // Soft delete the address
    await sql`
      UPDATE addresses 
      SET is_active = false, updated_at = now()
      WHERE id = ${addressId} AND user_id = ${userId}
    `

    // If deleted address was default, set another address as default
    if (addressToDelete[0].is_default) {
      await sql`
        UPDATE addresses 
        SET is_default = true, updated_at = now()
        WHERE user_id = ${userId} AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1
      `
    }

    return NextResponse.json({ message: "Address deleted successfully" })
  } catch (error) {
    console.error("Error deleting address:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
