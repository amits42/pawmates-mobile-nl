import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-ID")
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, tipAmount } = await request.json()

    if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    // Create payment record
    const payment = await sql`
      INSERT INTO payments (
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        amount, currency, status, payment_type, user_id, booking_id
      )
      VALUES (
        ${razorpay_order_id}, ${razorpay_payment_id}, ${razorpay_signature},
        ${tipAmount}, 'INR', 'completed', 'tip', ${userId}, ${bookingId}
      )
      RETURNING id
    `

    // Update tip record
    const tip = await sql`
      UPDATE service_tips 
      SET 
        payment_id = ${payment[0].id},
        razorpay_payment_id = ${razorpay_payment_id},
        payment_status = 'completed',
        updated_at = NOW()
      WHERE razorpay_order_id = ${razorpay_order_id} AND user_id = ${userId}
      RETURNING *
    `

    if (tip.length === 0) {
      return NextResponse.json({ error: "Tip record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      tip: tip[0],
      paymentId: payment[0].id,
    })
  } catch (error) {
    console.error("Error verifying tip payment:", error)
    return NextResponse.json({ error: "Failed to verify tip payment" }, { status: 500 })
  }
}
