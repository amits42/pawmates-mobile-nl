export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get sitter ID
    const sitterResult = await sql`
      SELECT id FROM sitters WHERE user_id = ${userId}
    `

    if (sitterResult.length === 0) {
      return NextResponse.json({ error: "Sitter not found" }, { status: 404 })
    }

    const sitterId = sitterResult[0].id

    // Get or create wallet
    let walletResult = await sql`
      SELECT * FROM sitter_wallets WHERE sitter_id = ${sitterId}
    `

    if (walletResult.length === 0) {
      // Create new wallet
      await sql`
        INSERT INTO sitter_wallets (sitter_id, balance, pending_amount, total_earnings)
        VALUES (${sitterId}, 0.00, 0.00, 0.00)
      `

      walletResult = await sql`
        SELECT * FROM sitter_wallets WHERE sitter_id = ${sitterId}
      `
    }

    const wallet = walletResult[0]

    // Get recent transactions
    const transactionsResult = await sql`
      SELECT 
        wt.*,
        b.date as service_date,
        b.time as service_time,
        s.name as service_name,
        p.name as pet_name,
        u.name as owner_name
      FROM wallet_transactions wt
      LEFT JOIN bookings b ON wt.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE wt.wallet_id = ${wallet.id}
      ORDER BY wt.created_at DESC
      LIMIT 20
    `

    // Get pending withdrawals
    const pendingWithdrawalsResult = await sql`
      SELECT * FROM wallet_withdrawals 
      WHERE wallet_id = ${wallet.id} AND status IN ('pending', 'processing')
      ORDER BY created_at DESC
    `

    // Calculate this month earnings
    const thisMonthResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as this_month_earnings
      FROM wallet_transactions 
      WHERE wallet_id = ${wallet.id} 
        AND type = 'earning' 
        AND status IN ('pending', 'completed')
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    `

    const walletData = {
      balance: Number.parseFloat(wallet.balance) || 0,
      pendingAmount: Number.parseFloat(wallet.pending_amount) || 0,
      totalEarnings: Number.parseFloat(wallet.total_earnings) || 0,
      totalWithdrawn: Number.parseFloat(wallet.total_withdrawn) || 0,
      thisMonthEarnings: Number.parseFloat(thisMonthResult[0].this_month_earnings) || 0,
      lastWithdrawalAt: wallet.last_withdrawal_at,
      paymentMethods: {
        bankAccount: wallet.bank_account_number
          ? {
              accountNumber: wallet.bank_account_number,
              ifscCode: wallet.bank_ifsc_code,
              accountName: wallet.bank_account_name,
            }
          : null,
        upiId: wallet.upi_id,
        preferredMethod: wallet.preferred_payment_method,
      },
      transactions: transactionsResult.map((transaction) => ({
        id: transaction.id,
        amount: Number.parseFloat(transaction.amount),
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        date: transaction.created_at,
        availableAt: transaction.available_at,
        serviceDetails: transaction.booking_id
          ? {
              date: transaction.service_date,
              time: transaction.service_time,
              serviceName: transaction.service_name,
              petName: transaction.pet_name,
              ownerName: transaction.owner_name,
            }
          : null,
      })),
      pendingWithdrawals: pendingWithdrawalsResult.map((withdrawal) => ({
        id: withdrawal.id,
        amount: Number.parseFloat(withdrawal.amount),
        status: withdrawal.status,
        paymentMethod: withdrawal.payment_method,
        requestedAt: withdrawal.requested_at,
        processedAt: withdrawal.processed_at,
      })),
    }

    return NextResponse.json(walletData)
  } catch (error) {
    console.error("Error fetching wallet data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
