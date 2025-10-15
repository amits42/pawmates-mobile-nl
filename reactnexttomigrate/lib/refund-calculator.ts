import { neon } from "@neondatabase/serverless"
import { toZonedTime } from 'date-fns-tz'

const sql = neon(process.env.DATABASE_URL!)

export interface RefundCalculation {
  canRefund: boolean
  policyId?: string
  refundPercent: number
  refundAmount: number
  deductionAmount: number
  originalAmount: number
  processingTime: string
  description: string
  hoursUntilService: number
  ruleApplied: {
    id: string
    minHoursBeforeService: number | null
    maxHoursBeforeService: number | null
    refundPercent: number
    description: string | null
  } | null
}

export async function calculateRefund(
  bookingId?: string,
  sessionId?: string,
  amount?: number,
  userId?: string,
): Promise<RefundCalculation> {
  if (!amount || amount <= 0) {
    return {
      canRefund: false,
      refundPercent: 0,
      policyId: undefined,
      refundAmount: 0,
      deductionAmount: 0,
      originalAmount: amount || 0,
      processingTime: "N/A",
      description: "No refund available - payment not completed",
      hoursUntilService: 0,
      ruleApplied: null,
    }
  }

  // 1. Get active policy
  const policies = await sql`
    SELECT *
    FROM cancellation_policies
    WHERE is_active = true
    ORDER BY effective_from DESC
    LIMIT 1
  `

  if (policies.length === 0) {
    throw new Error("No active cancellation policy found")
  }

  const activePolicy = policies[0]

  // 2. Get rules for the active policy
  const rules = await sql`
    SELECT *
    FROM cancellation_rules
    WHERE policy_id = ${activePolicy.id}
    ORDER BY min_hours_before_service DESC
  `

  if (rules.length === 0) {
    throw new Error("No rules found for active policy")
  }

  // 3. Fetch service date/time
  let serviceDate: Date

  if (sessionId) {
    // Recurring booking session
    const sessionResult = await sql`
      SELECT session_date, session_time
      FROM recurring_booking
      WHERE id = ${sessionId}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
    `
    if (sessionResult.length === 0) {
      throw new Error("Recurring session not found")
    }
    const session = sessionResult[0]
    // session.session_date may be a JS Date object, session.session_time is a string like '08:00'
    let baseDate = session.session_date instanceof Date ? session.session_date : new Date(session.session_date)
    baseDate = toZonedTime(baseDate, "Asia/Kolkata")
    const [hours, minutes] = String(session.session_time).split(":").map(Number)
    serviceDate = new Date(baseDate)
    serviceDate.setHours(hours, minutes, 0, 0)
  } else if (bookingId) {
    // Single booking
    const bookingResult = await sql`
      SELECT date, time
      FROM bookings
      WHERE id = ${bookingId}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
    `
    if (bookingResult.length === 0) {
      throw new Error("Booking not found")
    }
    const booking = bookingResult[0]
    // booking.date may be a JS Date object, booking.time is a string like '08:00'
    let baseDate = booking.date instanceof Date ? booking.date : new Date(booking.date)
    baseDate = toZonedTime(baseDate, "Asia/Kolkata")
    const [hours, minutes] = String(booking.time).split(":").map(Number)
    serviceDate = new Date(baseDate)
    serviceDate.setHours(hours, minutes, 0, 0)
  } else {
    throw new Error("Either bookingId or sessionId is required")
  }

  // 4. Calculate hours until service (always use IST)
  const now = toZonedTime(new Date(), "Asia/Kolkata")
  console.log("[RefundCalc] Service Date:", serviceDate)
  console.log("[RefundCalc] Now (IST):", now)
  const hoursUntilService = (serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  console.log("[RefundCalc] Hours Until Service:", hoursUntilService)

  // 5. Find applicable rule
  let applicableRule = rules[rules.length - 1] // default to last rule (lowest refund)

  for (const rule of rules) {
    const minH = rule.min_hours_before_service ?? Number.NEGATIVE_INFINITY
    const maxH = rule.max_hours_before_service ?? Number.POSITIVE_INFINITY

    if (hoursUntilService >= minH && hoursUntilService < maxH) {
      applicableRule = rule
      break
    }
  }

  // 6. Calculate refund
  const refundPercent = Number(applicableRule.refund_percent)
  const refundAmount = (amount * refundPercent) / 100
  const deductionAmount = amount - refundAmount

  return {
    canRefund: refundAmount > 0,
    refundPercent,
    policyId: activePolicy.id,
    refundAmount: Number(refundAmount.toFixed(2)),
    deductionAmount: Number(deductionAmount.toFixed(2)),
    originalAmount: amount,
    processingTime: "5-7 business days",
    description:
      applicableRule.notes ||
      `${refundPercent}% refund will be processed. ${100 - refundPercent}% cancellation fee will be deducted.`,
    hoursUntilService: Math.round(hoursUntilService * 100) / 100,
    ruleApplied: {
      id: applicableRule.id,
      minHoursBeforeService: applicableRule.min_hours_before_service,
      maxHoursBeforeService: applicableRule.max_hours_before_service,
      refundPercent,
      description: applicableRule.notes,
    },
  }
}
