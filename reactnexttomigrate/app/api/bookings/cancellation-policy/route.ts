import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function POST(request: NextRequest) {
  try {
    const { bookingId, sessionId, amount, paymentStatus } = await request.json()

    // Get cancellation fee percentage from config
    const configResult = await sql`
      SELECT value FROM config_settings 
      WHERE key = 'percentageDeductionOnSelfCancellation'
    `
    const percentageDeduction = configResult.rows.length > 0 ? Number.parseInt(configResult.rows[0].value) : 10

    // Calculate refund amounts
    const deductionAmount = (amount * percentageDeduction) / 100
    const refundAmount = amount - deductionAmount

    const policy = {
      percentageDeduction,
      description: `A ${percentageDeduction}% cancellation fee will be deducted from your refund. The remaining amount will be refunded to your original payment method.`,
      refundAmount: Math.max(0, refundAmount),
      deductionAmount,
      processingTime: "5-7 business days",
      canRefund: paymentStatus === "PAID" || paymentStatus === "paid",
    }

    return NextResponse.json(policy)
  } catch (error) {
    console.error("Error calculating cancellation policy:", error)
    return NextResponse.json({ error: "Failed to calculate cancellation policy" }, { status: 500 })
  }
}
