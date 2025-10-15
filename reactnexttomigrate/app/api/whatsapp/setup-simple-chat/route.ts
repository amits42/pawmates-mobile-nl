import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { bookingId, userPhone, userAlias } = await request.json()

    console.log("🚀 Setting up simple admin chat:", {
      bookingId,
      userPhone,
      userAlias,
    })

    if (!bookingId || !userPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a simple chat session with admin only
    const chatId = `admin_${bookingId}_${Date.now()}`

    // Insert chat session into database
    await sql`
      INSERT INTO whatsapp_chats (
        chat_id,
        booking_id,
        user_phone,
        user_alias,
        admin_phone,
        admin_alias,
        status,
        created_at
      ) VALUES (
        ${chatId},
        ${bookingId},
        ${userPhone},
        ${userAlias},
        ${process.env.TWILIO_ADMIN_PHONE || "+919999999999"},
        'PawMates Admin',
        'active',
        NOW()
      )
      ON CONFLICT (booking_id, user_phone) 
      DO UPDATE SET 
        status = 'active',
        updated_at = NOW()
    `

    // Send setup message to user
    const setupMessage = `Hi ${userAlias}! 👋

This is PawMates Admin support for your booking #${bookingId}.

How can we help you today? Our support team is here to assist with:
• Booking questions or changes
• Payment issues
• Service concerns
• General inquiries

Please describe your issue and we'll get back to you shortly! 🐾`

    // Send via Twilio WhatsApp
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

    if (accountSid && authToken && fromNumber) {
      const client = require("twilio")(accountSid, authToken)

      await client.messages.create({
        body: setupMessage,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${userPhone}`,
      })

      console.log("✅ Setup message sent to user")
    }

    return NextResponse.json({
      success: true,
      message: "Admin chat started successfully",
      chatId,
    })
  } catch (error) {
    console.error("❌ Error setting up simple chat:", error)
    return NextResponse.json({ error: "Failed to start chat", details: error.message }, { status: 500 })
  }
}
