import { type NextRequest, NextResponse } from "next/server"
import { calculateRefund } from "@/lib/refund-calculator"

export async function POST(request: NextRequest) {
  try {
    const { bookingId, sessionId, amount, paymentStatus } = await request.json()
    const userId = request.headers.get("X-User-ID")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    if (!amount || paymentStatus !== "PAID") {
      return NextResponse.json({
        canRefund: false,
        message: "No refund available - payment not completed",
      })
    }

    const refundCalculation = await calculateRefund(bookingId, sessionId, amount, userId)

    return NextResponse.json({
      canRefund: refundCalculation.canRefund,
      deductionPercent: 100 - refundCalculation.refundPercent,
      deductionAmount: refundCalculation.deductionAmount,
      refundAmount: refundCalculation.refundAmount,
      originalAmount: refundCalculation.originalAmount,
      processingTime: refundCalculation.processingTime,
      description: refundCalculation.description,
      hoursUntilService: refundCalculation.hoursUntilService,
      ruleApplied: refundCalculation.ruleApplied,
    })
  } catch (error) {
    console.error("Error calculating refund:", error)
    return NextResponse.json({ error: error.message || "Failed to calculate refund" }, { status: 500 })
  }
}
