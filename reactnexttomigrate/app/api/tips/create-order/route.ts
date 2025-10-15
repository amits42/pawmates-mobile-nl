import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-ID")
    const { bookingId, serviceId, sitterId, tipAmount } = await request.json()

    if (!userId || !bookingId || !serviceId || !tipAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (tipAmount <= 0) {
      return NextResponse.json({ error: "Tip amount must be greater than 0" }, { status: 400 })
    }

    // Check if tip already exists
    const existingTip = await sql`
      SELECT id FROM service_tips 
      WHERE booking_id = ${bookingId} AND user_id = ${userId}
      LIMIT 1
    `

    if (existingTip.length > 0) {
      return NextResponse.json({ error: "Tip already exists for this booking" }, { status: 400 })
    }

    // Verify booking belongs to user and is completed
    const booking = await sql`
      SELECT id, status FROM bookings 
      WHERE id = ${bookingId} AND user_id = ${userId} AND status = 'completed'
      LIMIT 1
    `

    if (booking.length === 0) {
      return NextResponse.json({ error: "Booking not found or not completed" }, { status: 404 })
    }

    // Create Razorpay order
    const Razorpay = require("razorpay")
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const amountInPaise = Math.round(tipAmount * 100)
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `tip_${bookingId}_${Date.now()}`,
      notes: {
        bookingId,
        serviceId,
        sitterId,
        tipAmount: tipAmount.toString(),
        userId,
      },
    })

    // Create pending tip record
    await sql`
      INSERT INTO service_tips (booking_id, user_id, service_id, sitter_id, tip_amount, razorpay_order_id, payment_status)
      VALUES (${bookingId}, ${userId}, ${serviceId}, ${sitterId}, ${tipAmount}, ${order.id}, 'pending')
    `

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID!,
    })
  } catch (error) {
    console.error("Error creating tip order:", error)
    return NextResponse.json({ error: "Failed to create tip order" }, { status: 500 })
  }
}
