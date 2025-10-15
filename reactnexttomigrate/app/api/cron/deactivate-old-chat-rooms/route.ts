// app/api/cron/deactivate-old-chat-rooms/route.ts
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Deactivate chat rooms if booking is completed or if room is older than 12 hours
export async function POST() {
  try {
    const now = Date.now()

    // Fetch active chat rooms with possible booking references
    const rows = await sql/*sql*/`
      SELECT 
        r.id, 
        r.created_at, 
        b.status AS booking_status,
        rb.status AS recurring_booking_status
      FROM whatsapp_chat_rooms r
      LEFT JOIN bookings b 
        ON r.booking_id = b.id
      LEFT JOIN recurring_booking rb
        ON r.recurring_booking_id = rb.id
      WHERE r.status = 'active'
    `

    const toDeactivate: number[] = []

    for (const room of rows) {
      const createdAt = new Date(room.created_at).getTime()
      const isOlderThan12h = now - createdAt > 12 * 60 * 60 * 1000

      // Check status from bookings OR recurring_booking
      const bookingStatus = (room.booking_status || room.recurring_booking_status || '').toLowerCase()
      const isBookingCompleted = bookingStatus === 'completed'

      if (isBookingCompleted || isOlderThan12h) {
        toDeactivate.push(room.id)
      }
    }

    if (toDeactivate.length > 0) {
      await sql/*sql*/`
        UPDATE whatsapp_chat_rooms
        SET status = 'inactive'
        WHERE id = ANY(${toDeactivate})
      `
    }

    return NextResponse.json({
      status: "success",
      deactivated: toDeactivate.length,
      deactivated_ids: toDeactivate
    })
  } catch (e) {
    console.error("❌ Error in cron deactivate-old-chat-rooms:", e)
    return NextResponse.json(
      { status: "error", message: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" })
}
