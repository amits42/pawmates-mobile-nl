export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"

import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const userId = request.headers.get("x-user-id")

    if (!bookingId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get refunds for both main booking and recurring sessions
    const refundsResult = await sql`
  SELECT 
    pr.*,
    rb.id AS recurring_booking_id,
    b.id AS booking_id,
    rb.sequence_number,
    rb.session_date
  FROM payment_refunds pr
  LEFT JOIN payments p ON pr.payment_id = p.id
  LEFT JOIN bookings b ON p.booking_id = b.id
  LEFT JOIN recurring_booking rb ON p.recurring_booking_id = rb.id
  WHERE 
    (
      p.booking_id = ${bookingId} 
      OR rb.booking_id::text = ${bookingId}
    )
    AND (
      b.user_id = ${userId} 
      OR EXISTS (
        SELECT 1 FROM bookings b2 
        WHERE b2.id = rb.booking_id::text AND b2.user_id::text = ${userId}
      )
    )
  ORDER BY pr.initiated_at DESC
`


    const refunds = refundsResult.rows.map((row) => ({
      id: row.id,
      refundId: row.refund_id,
      amount: Number.parseFloat(row.amount),
      status: row.status,
      bookingId: row.booking_id,
      sessionId: row.recurring_booking_id,
      sequenceNumber: row.sequence_number,
      sessionDate: row.session_date,
      initiatedAt: row.initiated_at,
      processedAt: row.processed_at,
      failedAt: row.failed_at,
      failureReason: row.failure_reason,
      estimatedProcessingTime: row.estimated_processing_time || "5-7 business days",
    }))

    return NextResponse.json({ refunds })
  } catch (error) {
    console.error("Error fetching refund status:", error)
    return NextResponse.json({ error: "Failed to fetch refund status" }, { status: 500 })
  }
}
