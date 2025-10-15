import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Get all admin contacts
export async function GET() {
  try {
    const admins = await sql`
      SELECT id, phone, name, role, is_active, created_at
      FROM admin_contacts
      ORDER BY created_at DESC
    `

    return NextResponse.json(admins)
  } catch (error) {
    console.error("❌ Error fetching admin contacts:", error)
    return NextResponse.json({ error: "Failed to fetch admin contacts" }, { status: 500 })
  }
}

// Add new admin contact
export async function POST(request: NextRequest) {
  try {
    const { phone, name, role = "admin" } = await request.json()

    if (!phone || !name) {
      return NextResponse.json(
        {
          error: "Missing required fields: phone, name",
        },
        { status: 400 },
      )
    }

    const newAdmins = await sql`
      INSERT INTO admin_contacts (phone, name, role, is_active)
      VALUES (${phone}, ${name}, ${role}, true)
      RETURNING *
    `

    return NextResponse.json(newAdmins[0], { status: 201 })
  } catch (error) {
    console.error("❌ Error adding admin contact:", error)
    return NextResponse.json(
      {
        error: "Failed to add admin contact",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
