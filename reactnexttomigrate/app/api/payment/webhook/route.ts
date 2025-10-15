import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { sql } from "@vercel/postgres"

// Main Webhook Handler
export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Razorpay webhook received")

    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      console.error("❌ No signature in webhook")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("❌ Webhook secret not configured")
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 })
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex")

    if (expectedSignature !== signature) {
      console.error("❌ Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log("📨 Event received:", event.event)

    // Dispatch event to handlers
    switch (event.event) {
      case "payment.authorized":
        await handlePaymentAuthorized(event)
        break

      case "payment.captured":
        await handlePaymentCaptured(event)
        break

      case "payment.failed":
        await handlePaymentFailed(event)
        break

      case "refund.created":
        await handleRefundCreated(event)
        break

      case "refund.processed":
        await handleRefundProcessed(event)
        break

      case "refund.failed":
        await handleRefundFailed(event)
        break

      case "payment.dispute.created":
        await handleDisputeCreated(event)
        break

      case "payment.dispute.won":
        await handleDisputeWon(event)
        break

      case "payment.dispute.lost":
        await handleDisputeLost(event)
        break

      default:
        console.warn("⚠️ Unhandled event:", event.event)
        await logUnhandledEvent(event)
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}

//
// ===== HANDLERS =====
//

// --- Payment Handlers ---

async function handlePaymentAuthorized(event: any) {
  const payment = event.payload.payment.entity
  const paymentId = await getPaymentId(payment)

  if (!paymentId) return

  await sql`
    UPDATE payments
    SET
      status = 'AUTHORIZED',
      authorized_at = NOW(),
      razorpay_response = ${JSON.stringify(payment)},
      updated_at = NOW()
    WHERE id = ${paymentId}
  `
  await logPaymentEvent(paymentId, "payment.authorized", "AUTHORIZED", payment)
  console.log("✅ Payment authorized:", payment.id)
}

async function handlePaymentCaptured(event: any) {
  const payment = event.payload.payment.entity
  const paymentId = await getPaymentId(payment)

  if (!paymentId) return

  await sql`
    UPDATE payments
    SET
      status = 'CAPTURED',
      captured_at = NOW(),
      payment_method = ${payment.method},
      payment_method_details = ${JSON.stringify({
    last4: payment.card?.last4,
    network: payment.card?.network,
    bank: payment.bank,
    wallet: payment.wallet,
  })},
      razorpay_response = ${JSON.stringify(payment)},
      updated_at = NOW()
    WHERE id = ${paymentId}
  `
  await logPaymentEvent(paymentId, "payment.captured", "CAPTURED", payment)
  console.log("✅ Payment captured:", payment.id)
}

async function handlePaymentFailed(event: any) {
  const payment = event.payload.payment.entity
  const paymentId = await getPaymentId(payment)

  if (!paymentId) return

  await sql`
    UPDATE payments
    SET
      status = 'FAILED',
      failed_at = NOW(),
      failure_reason = ${payment.error_description || "Payment failed"},
      razorpay_response = ${JSON.stringify(payment)},
      updated_at = NOW()
    WHERE id = ${paymentId}
  `
  await logPaymentEvent(paymentId, "payment.failed", "FAILED", payment)
  console.log("❌ Payment failed:", payment.id)
}

// --- Refund Handlers ---

async function handleRefundCreated(event: any) {
  const refund = event.payload.refund.entity
  const paymentId = await getPaymentId({ id: refund.payment_id })
  if (!paymentId) return

  await sql`
    INSERT INTO payment_refunds (
      payment_id, refund_id, amount, status, initiated_at, razorpay_response
    )
    VALUES (
      ${paymentId},
      ${refund.id},
      ${refund.amount / 100},
      'INITIATED',
      NOW(),
      ${JSON.stringify(refund)}
    )
    ON CONFLICT (refund_id) DO UPDATE
      SET
        initiated_at     = EXCLUDED.initiated_at,
        razorpay_response = EXCLUDED.razorpay_response,
        updated_at       = NOW()
      WHERE payment_refunds.status NOT IN ('PROCESSED','FAILED')
  `
  await logPaymentEvent(paymentId, "refund.created", "INITIATED", refund)
  console.log("🔄 Refund created:", refund.id)
}


async function handleRefundProcessed(event: any) {
  const refund = event.payload.refund.entity
  const paymentId = await getPaymentId({ id: refund.payment_id })

  if (!paymentId) return

  await sql`
    UPDATE payment_refunds
    SET
      status = 'PROCESSED',
      processed_at = NOW(),
      razorpay_response = ${JSON.stringify(refund)},
      updated_at = NOW()
    WHERE refund_id = ${refund.id}
  `
  await logPaymentEvent(paymentId, "refund.processed", "PROCESSED", refund)
  console.log("✅ Refund processed:", refund.id)
}

async function handleRefundFailed(event: any) {
  const refund = event.payload.refund.entity
  const paymentId = await getPaymentId({ id: refund.payment_id })

  if (!paymentId) return

  await sql`
    UPDATE payment_refunds
    SET
      status = 'FAILED',
      failed_at = NOW(),
      failure_reason = ${refund.error_description || "Refund failed"},
      razorpay_response = ${JSON.stringify(refund)},
      updated_at = NOW()
    WHERE refund_id = ${refund.id}
  `
  await logPaymentEvent(paymentId, "refund.failed", "FAILED", refund)
  console.log("❌ Refund failed:", refund.id)
}

// --- Dispute Handlers ---

async function handleDisputeCreated(event: any) {
  const dispute = event.payload.dispute.entity
  const paymentId = await getPaymentId({ id: dispute.payment_id })

  if (!paymentId) return

  await sql`
    INSERT INTO payment_disputes (
      payment_id, dispute_id, amount, status, reason, razorpay_response, created_at
    ) VALUES (
      ${paymentId},
      ${dispute.id},
      ${dispute.amount / 100},
      'CREATED',
      ${dispute.reason_description},
      ${JSON.stringify(dispute)},
      NOW()
    )
    ON CONFLICT (dispute_id) DO UPDATE SET
      status = EXCLUDED.status,
      reason = EXCLUDED.reason,
      razorpay_response = EXCLUDED.razorpay_response,
      updated_at = NOW()
  `
  await logPaymentEvent(paymentId, "dispute.created", "CREATED", dispute)
  console.log("⚠️ Dispute created:", dispute.id)
}

async function handleDisputeWon(event: any) {
  const dispute = event.payload.dispute.entity
  const paymentId = await getPaymentId({ id: dispute.payment_id })

  if (!paymentId) return

  await sql`
    UPDATE payment_disputes
    SET
      status = 'WON',
      updated_at = NOW()
    WHERE dispute_id = ${dispute.id}
  `
  await logPaymentEvent(paymentId, "dispute.won", "WON", dispute)
  console.log("🏆 Dispute won:", dispute.id)
}

async function handleDisputeLost(event: any) {
  const dispute = event.payload.dispute.entity
  const paymentId = await getPaymentId({ id: dispute.payment_id })

  if (!paymentId) return

  await sql`
    UPDATE payment_disputes
    SET
      status = 'LOST',
      updated_at = NOW()
    WHERE dispute_id = ${dispute.id}
  `
  await logPaymentEvent(paymentId, "dispute.lost", "LOST", dispute)
  console.log("❌ Dispute lost:", dispute.id)
}

//
// ===== HELPERS =====
//

// Get payment.id from Razorpay payment/order ID
async function getPaymentId(payment: any): Promise<string | null> {
  const result = await sql`
    SELECT id FROM payments 
    WHERE razorpay_order_id = ${payment.order_id}
       OR razorpay_payment_id = ${payment.id}
    LIMIT 1
  `
  if (result.rows.length === 0) {
    console.error("❌ No matching payment found for:", payment.id || payment.order_id)
    return null
  }
  return result.rows[0].id
}

// Log payment events
async function logPaymentEvent(
  paymentId: string,
  eventType: string,
  status: string,
  data: any
) {
  try {
    await sql`
      INSERT INTO payment_logs (
        payment_id, event_type, status_to, event_data, razorpay_event_id, created_at
      ) VALUES (
        ${paymentId},
        ${eventType},
        ${status},
        ${JSON.stringify(data)},
        ${data.id},
        NOW()
      )
    `
  } catch (error) {
    console.error("❌ Error logging payment event:", error)
  }
}

// Log unhandled events
async function logUnhandledEvent(event: any) {
  try {
    await sql`
      INSERT INTO payment_logs (
        payment_id, event_type, status_to, event_data, razorpay_event_id, created_at
      ) VALUES (
        NULL,
        ${`unhandled_${event.event}`},
        'UNHANDLED',
        ${JSON.stringify(event)},
        ${event.payload?.payment?.entity?.id || "unknown"},
        NOW()
      )
    `
  } catch (error) {
    console.error("❌ Error logging unhandled event:", error)
  }
}
