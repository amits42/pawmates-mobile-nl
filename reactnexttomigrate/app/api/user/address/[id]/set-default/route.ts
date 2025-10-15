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

    // Verify the address belongs to the user
    const addressExists = await sql`
      SELECT id FROM addresses 
      WHERE id = ${addressId} AND user_id = ${userId} AND is_active = true
    `

    if (addressExists.length === 0) {
      return NextResponse.json({ message: "Address not found" }, { status: 404 })
    }

    // Unset all other default addresses for this user
    await sql`
      UPDATE addresses 
      SET is_default = false, updated_at = now()
      WHERE user_id = ${userId} AND id != ${addressId}
    `

    // Set the specified address as default
    await sql`
      UPDATE addresses 
      SET is_default = true, updated_at = now()
      WHERE id = ${addressId} AND user_id = ${userId}
    `

    return NextResponse.json({ message: "Default address updated successfully" })
  } catch (error) {
    console.error("Error setting default address:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
