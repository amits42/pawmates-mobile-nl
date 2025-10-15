import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { bookingId, userId } = await request.json()

    if (!bookingId || !userId) {
      return NextResponse.json({ error: "Booking ID and User ID are required" }, { status: 400 })
    }

    // Get booking details with sitter info
    const bookingResult = await sql`
      SELECT 
        b.*,
        s.commission_rate,
        s.id as sitter_id
      FROM bookings b
      LEFT JOIN sitters s ON b.sitter_id = s.id
      WHERE b.id = ${bookingId} AND b.user_id = ${userId}
    `

    if (bookingResult.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const booking = bookingResult[0]

    if (booking.status === "COMPLETED") {
      return NextResponse.json({ error: "Booking already completed" }, { status: 400 })
    }

    if (!booking.sitter_id) {
      return NextResponse.json({ error: "No sitter assigned to this booking" }, { status: 400 })
    }

    // Calculate earnings
    const totalPrice = Number.parseFloat(booking.total_price) || 0
    const commissionRate = Number.parseFloat(booking.commission_rate) || 0.75 // Default 75%
    const sitterEarnings = totalPrice * commissionRate
    const platformFee = totalPrice - sitterEarnings

    console.log("Calculating earnings:", {
      totalPrice,
      commissionRate,
      sitterEarnings,
      platformFee,
    })

    // Start transaction
    await sql`BEGIN`

    try {
      // Update booking status and earnings
      await sql`
        UPDATE bookings 
        SET 
          status = 'COMPLETED',
          completed_at = NOW(),
          sitter_earnings = ${sitterEarnings},
          platform_fee = ${platformFee},
          earnings_processed = true,
          updated_at = NOW()
        WHERE id = ${bookingId}
      `

      // Get or create sitter wallet
      const walletResult = await sql`
        SELECT id FROM sitter_wallets WHERE sitter_id = ${booking.sitter_id}
      `

      let walletId
      if (walletResult.length === 0) {
        // Create new wallet
        const newWalletResult = await sql`
          INSERT INTO sitter_wallets (sitter_id, balance, pending_amount, total_earnings)
          VALUES (${booking.sitter_id}, 0.00, 0.00, 0.00)
          RETURNING id
        `
        walletId = newWalletResult[0].id
      } else {
        walletId = walletResult[0].id
      }

      // Add earnings to pending amount (holding period)
      await sql`
        UPDATE sitter_wallets 
        SET 
          pending_amount = pending_amount + ${sitterEarnings},
          total_earnings = total_earnings + ${sitterEarnings},
          updated_at = NOW()
        WHERE id = ${walletId}
      `

      // Create wallet transaction (pending for 3 days)
      const availableAt = new Date()
      availableAt.setDate(availableAt.getDate() + 3) // 3-day holding period

      await sql`
        INSERT INTO wallet_transactions (
          wallet_id, 
          booking_id, 
          amount, 
          type, 
          status, 
          description,
          available_at,
          metadata
        ) VALUES (
          ${walletId},
          ${bookingId},
          ${sitterEarnings},
          'earning',
          'pending',
          'Service completion earnings',
          ${availableAt.toISOString()},
          ${JSON.stringify({
            service_date: booking.date,
            service_time: booking.time,
            total_price: totalPrice,
            commission_rate: commissionRate,
          })}
        )
      `

      // Commit transaction
      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: "Booking completed and earnings credited",
        earnings: {
          sitterEarnings,
          platformFee,
          availableAt: availableAt.toISOString(),
        },
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error completing booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
