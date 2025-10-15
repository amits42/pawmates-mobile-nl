import { jwtVerify } from "jose"
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dklsjh786324#8362f")

export async function POST(req: Request) {
    try {
        const { token } = await req.json()

        if (!token) {
            return NextResponse.json({ valid: false, error: "Token required" }, { status: 400 })
        }

        // 1️⃣ Verify JWT
        const { payload } = await jwtVerify(token, JWT_SECRET)

        // Expect the token to contain user ID in payload (e.g. payload.userId)
        const userId = payload.userId
        if (!userId) {
            return NextResponse.json({ valid: false, error: "Invalid token payload" }, { status: 401 })
        }

        // 2️⃣ Check if user exists in DB using Neon
        const result = await sql`
      SELECT id FROM users WHERE id = ${userId} LIMIT 1
    `

        if (!result || result.length === 0) {
            return NextResponse.json({ valid: false, error: "User not found" }, { status: 401 })
        }

        // 3️⃣ All good — token is valid and user exists
        return NextResponse.json({ valid: true }, { status: 200 })
    } catch (error) {
        console.error("❌ Token verification error:", error)
        return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 401 })
    }
}

export async function GET() {
    return NextResponse.json({ message: "Use POST to verify token" }, { status: 405 })
}
