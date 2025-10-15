import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { userId, amount, paymentMethod, paymentDetails } = await request.json()

    if (!userId || !amount || !paymentMethod || !paymentDetails) {
      return NextResponse.json(
        {
          error: "User ID, amount, payment method, and payment details are required",
        },
        { status: 400 },
      )
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 })
    }

    // Get sitter and wallet info
    const sitterResult = await sql`
      SELECT s.id as sitter_id, sw.* 
      FROM sitters s
      LEFT JOIN sitter_wallets sw ON s.id = sw.sitter_id
      WHERE s.user_id = ${userId}
    `

    if (sitterResult.length === 0) {
      return NextResponse.json({ error: "Sitter not found" }, { status: 404 })
    }

    const sitter = sitterResult[0]

    if (!sitter.id) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    const availableBalance = Number.parseFloat(sitter.balance) || 0

    if (amount > availableBalance) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Minimum withdrawal amount check
    const minWithdrawal = 100 // ₹100 minimum
    if (amount < minWithdrawal) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal amount is ₹${minWithdrawal}`,
        },
        { status: 400 },
      )
    }

    // Start transaction
    await sql`BEGIN`

    try {
      // Create withdrawal request
      const withdrawalResult = await sql`
        INSERT INTO wallet_withdrawals (
          wallet_id,
          amount,
          payment_method,
          payment_details,
          status
        ) VALUES (
          ${sitter.id},
          ${amount},
          ${paymentMethod},
          ${JSON.stringify(paymentDetails)},
          'pending'
        ) RETURNING id
      `

      const withdrawalId = withdrawalResult[0].id

      // Deduct from available balance
      await sql`
        UPDATE sitter_wallets 
        SET 
          balance = balance - ${amount},
          updated_at = NOW()
        WHERE id = ${sitter.id}
      `

      // Create transaction record
      await sql`
        INSERT INTO wallet_transactions (
          wallet_id,
          amount,
          type,
          status,
          description,
          reference_id,
          metadata
        ) VALUES (
          ${sitter.id},
          ${-amount},
          'withdrawal',
          'pending',
          'Withdrawal request',
          ${withdrawalId},
          ${JSON.stringify({
            payment_method: paymentMethod,
            withdrawal_id: withdrawalId,
          })}
        )
      `

      // Update payment method in wallet if provided
      if (paymentMethod === "bank_transfer" && paymentDetails.accountNumber) {
        await sql`
          UPDATE sitter_wallets 
          SET 
            bank_account_number = ${paymentDetails.accountNumber},
            bank_ifsc_code = ${paymentDetails.ifscCode},
            bank_account_name = ${paymentDetails.accountName},
            preferred_payment_method = 'bank_transfer',
            updated_at = NOW()
          WHERE id = ${sitter.id}
        `
      } else if (paymentMethod === "upi" && paymentDetails.upiId) {
        await sql`
          UPDATE sitter_wallets 
          SET 
            upi_id = ${paymentDetails.upiId},
            preferred_payment_method = 'upi',
            updated_at = NOW()
          WHERE id = ${sitter.id}
        `
      }

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        withdrawalId,
        message: "Withdrawal request submitted successfully",
        estimatedProcessingTime: "2-3 business days",
        amount,
        paymentMethod,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
