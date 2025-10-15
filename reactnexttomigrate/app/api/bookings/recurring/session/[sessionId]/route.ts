import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
    const userId = req.headers.get("x-user-id")
    const sessionId = params.sessionId

    if (!userId) {
        return NextResponse.json({ success: false, error: "Missing x-user-id header" }, { status: 401 })
    }

    if (!sessionId) {
        return NextResponse.json({ success: false, error: "Missing sessionId in path" }, { status: 400 })
    }

    try {
        const result = await sql`
      SELECT 
        rb.*,
         c.code as coupon_code,
        b.id AS main_booking_id,
        p.name AS pet_name,
        s.name AS service_name,
        u.name AS sitter_name,
        u.phone AS sitter_phone
        FROM recurring_booking rb
        LEFT JOIN bookings b ON rb.booking_id::text = b.id
        LEFT JOIN pets p ON rb.pet_id = p.id
        LEFT JOIN services s ON rb.service_id = s.id
        LEFT JOIN sitters st ON rb.sitter_id = st.id
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN coupon_redemptions cr ON cr.booking_id = b.id
        LEFT JOIN coupons c ON cr.coupon_id = c.id
        WHERE rb.id = ${sessionId}
        AND rb.user_id = ${userId}

    `

        if (result.length === 0) {
            return NextResponse.json({ success: false, error: "Session not found or access denied" }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            session: result[0],
        })
    } catch (err) {
        console.error("Error fetching recurring session:", err)
        return NextResponse.json({ success: false, error: "Failed to fetch session" }, { status: 500 })
    }
}
