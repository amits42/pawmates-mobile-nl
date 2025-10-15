import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    // This would typically be called by a cron job or admin
    // For security, you might want to add authentication here

    console.log("Processing pending earnings...")

    // Get all pending transactions that are ready to be made available
    const pendingTransactions = await sql`
      SELECT * FROM wallet_transactions 
      WHERE status = 'pending' 
        AND type = 'earning'
        AND available_at <= NOW()
    `

    console.log(`Found ${pendingTransactions.length} transactions to process`)

    let processedCount = 0

    for (const transaction of pendingTransactions) {
      try {
        await sql`BEGIN`

        // Move amount from pending to available balance
        await sql`
          UPDATE sitter_wallets 
          SET 
            balance = balance + ${transaction.amount},
            pending_amount = pending_amount - ${transaction.amount},
            updated_at = NOW()
          WHERE id = ${transaction.wallet_id}
        `

        // Update transaction status
        await sql`
          UPDATE wallet_transactions 
          SET 
            status = 'completed',
            processed_at = NOW(),
            updated_at = NOW()
          WHERE id = ${transaction.id}
        `

        await sql`COMMIT`
        processedCount++

        console.log(`Processed transaction ${transaction.id}: ₹${transaction.amount}`)
      } catch (error) {
        await sql`ROLLBACK`
        console.error(`Error processing transaction ${transaction.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} pending earnings`,
      processedCount,
      totalFound: pendingTransactions.length,
    })
  } catch (error) {
    console.error("Error processing pending earnings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
