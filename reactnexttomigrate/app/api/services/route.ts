import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Initialize the SQL client
const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 Fetching services from database...")

    // Get all active services with raw SQL - using correct column names
    const services = await sql`
      SELECT 
        id,
        name,
        description,
        price,
        duration,
        image,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM services
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("✅ Services fetched:", services.length)
    return NextResponse.json(services)
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.basePrice) {
      return NextResponse.json({ error: "Name and base price are required" }, { status: 400 })
    }

    // Create new service with raw SQL - using correct column names
    const newServices = await sql`
      INSERT INTO services (
        name, 
        description, 
        price, 
        duration, 
        image, 
        is_active
      ) VALUES (
        ${body.name},
        ${body.description || ""},
        ${Number.parseFloat(body.basePrice)},
        ${Number.parseInt(body.duration) || 60},
        ${body.image || "/placeholder.svg?height=200&width=300"},
        ${body.isActive !== undefined ? body.isActive : true}
      )
      RETURNING 
        id,
        name,
        description,
        price,
        duration,
        image,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    return NextResponse.json(newServices[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}
