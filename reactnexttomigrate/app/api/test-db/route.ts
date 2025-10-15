import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("Testing database connection...")

    // Example query
    const testValue = "test"
    const result = await sql`SELECT 1`

    console.log("Database connected successfully:", result)

    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
      result: result,
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({ error: "Failed to connect to database" }, { status: 500 })
  }
}
