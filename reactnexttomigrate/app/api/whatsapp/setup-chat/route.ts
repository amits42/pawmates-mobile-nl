import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!
const ADMIN_PHONE = process.env.TWILIO_ADMIN_PHONE!

async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Format phone number
    let formattedPhone = to
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone
    }
    formattedPhone = formattedPhone.replace(/[^\d+]/g, "")

    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const response = await fetch(twilioEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        To: `whatsapp:${formattedPhone}`,
        Body: message,
      }),
    })

    const responseText = await response.text()

    if (response.ok) {
      let result
      try {
        result = JSON.parse(responseText)
        console.log("✅ WhatsApp message sent successfully:", result.sid)
        return { success: true }
      } catch (e) {
        console.error("Failed to parse Twilio response:", e)
        return { success: false, error: "Failed to parse Twilio response" }
      }
    } else {
      console.error("Twilio API error:", responseText)
      return { success: false, error: `Twilio error: ${responseText}` }
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bookingId, userPhone, sitterPhone, userAlias, sitterAlias } = await request.json()

    // Determine chat type based on whether sitter info is provided
    const isAdminOnlyChat = !sitterPhone || !sitterAlias
    const chatType = isAdminOnlyChat ? "admin-support" : "3-way-chat"

    console.log(`📞 Setting up ${chatType}:`, {
      bookingId,
      userPhone,
      sitterPhone: sitterPhone || "N/A",
      userAlias,
      sitterAlias: sitterAlias || "N/A",
      adminPhone: ADMIN_PHONE,
    })

    // Validate required fields
    if (!bookingId || !userPhone || !userAlias) {
      return NextResponse.json({ error: "Missing required fields: bookingId, userPhone, userAlias" }, { status: 400 })
    }

    // Check if chat room already exists for this booking
    const existingRooms = await sql`
      SELECT * FROM whatsapp_chat_rooms 
      WHERE booking_id = ${bookingId} AND status = 'active'
    `

    const roomExists = existingRooms.length > 0
    let room = roomExists ? existingRooms[0] : null

    if (!roomExists) {
      // Create new chat room
      console.log(`🆕 Creating new ${chatType} room...`)
      const newRooms = await sql`
        INSERT INTO whatsapp_chat_rooms (
          booking_id, twilio_number, user_phone, sitter_phone,
          user_alias, sitter_alias, status, created_at
        ) VALUES (
          ${bookingId}, ${TWILIO_WHATSAPP_NUMBER}, ${userPhone}, ${sitterPhone || null},
          ${userAlias}, ${sitterAlias || null}, 'active', NOW()
        )
        RETURNING *
      `
      room = newRooms[0]
      console.log("✅ Chat room created:", room.id)
    } else {
      console.log("📱 Chat room already exists:", room.id)
    }

    // Prepare template messages based on chat type
    let userMessage, adminMessage

    if (isAdminOnlyChat) {
      // Admin-only support chat messages
      const templateMessage = roomExists
        ? `🔄 *Follow-up Support Request*

Hi! This is a follow-up message for booking #${bookingId}.

${userAlias} needs additional help with their booking.

Please continue providing support below! 💬`
        : `🆘 *New Support Request*

Booking ID: #${bookingId}
Customer: ${userAlias}

This is a support chat between the customer and admin team. Please provide assistance with their booking inquiry.

Reply to this message to help the customer! 💬`

      userMessage = templateMessage
      adminMessage = `🔧 *Admin Support Notification*

${templateMessage}

Customer Phone: ${userPhone}
Admin Phone: ${ADMIN_PHONE}
Monitor and respond to this support request.`
    } else {
      // 3-way chat messages
      const templateMessage = roomExists
        ? `🔄 *Follow-up Message*

Hi! This is a follow-up message for booking #${bookingId}.

${userAlias} has sent a new message regarding their pet care service with ${sitterAlias}.

Please continue your conversation below! 💬`
        : `🐾 *New Pet Care Chat Started!*

Booking ID: #${bookingId}
Pet Owner: ${userAlias}
Sitter: ${sitterAlias}

This is a 3-way chat between the pet owner, Zubo Walkers, and admin support. Feel free to communicate about the booking details, schedule, or any questions!

Reply to this message to start chatting! 💬`

      userMessage = templateMessage
      adminMessage = `🔧 *Admin Notification*

${templateMessage}

Admin Phone: ${ADMIN_PHONE}
Monitor this conversation for support.`
    }

    // Send WhatsApp messages to participants
    const messageResults = []

    try {
      // Send to user
      const userResult = await sendWhatsAppMessage(userPhone, userMessage)
      messageResults.push({ recipient: "user", phone: userPhone, success: userResult.success })
      console.log("📱 Message to user:", userResult.success ? "✅ Sent" : "❌ Failed")

      // Send to sitter (only for 3-way chats)
      if (!isAdminOnlyChat && sitterPhone) {
        const sitterResult = await sendWhatsAppMessage(sitterPhone, userMessage)
        messageResults.push({ recipient: "sitter", phone: sitterPhone, success: sitterResult.success })
        console.log("📱 Message to sitter:", sitterResult.success ? "✅ Sent" : "❌ Failed")
      }

      // Send to admin
      const adminResult = await sendWhatsAppMessage(ADMIN_PHONE, adminMessage)
      messageResults.push({ recipient: "admin", phone: ADMIN_PHONE, success: adminResult.success })
      console.log("📱 Message to admin:", adminResult.success ? "✅ Sent" : "❌ Failed")

      const successCount = messageResults.filter((r) => r.success).length
      const totalCount = messageResults.length

      const responseMessage = roomExists
        ? `${isAdminOnlyChat ? "Support request" : "Chat message"} sent! Your message for booking #${bookingId} has been sent${isAdminOnlyChat ? " to our support team" : ` to ${sitterAlias} and admin support`
        }. (${successCount}/${totalCount} messages delivered)`
        : `${isAdminOnlyChat ? "Support chat" : "3-way chat"} created! WhatsApp chat for booking #${bookingId} has been set up${isAdminOnlyChat ? " with our support team" : ` with ${sitterAlias} and admin support`
        }. (${successCount}/${totalCount} messages delivered)`

      return NextResponse.json({
        success: true,
        message: responseMessage,
        roomId: room.id,
        chatType,
        participants: isAdminOnlyChat
          ? {
            user: { phone: userPhone, alias: userAlias },
            admin: { phone: ADMIN_PHONE, alias: "Admin" },
          }
          : {
            user: { phone: userPhone, alias: userAlias },
            sitter: { phone: sitterPhone, alias: sitterAlias },
            admin: { phone: ADMIN_PHONE, alias: "Admin" },
          },
        isNewRoom: !roomExists,
        messageResults,
        messagesDelivered: successCount,
        totalMessages: totalCount,
      })
    } catch (twilioError) {
      console.error("❌ Twilio error:", twilioError)
      return NextResponse.json(
        {
          error: "Failed to send WhatsApp messages",
          details: twilioError instanceof Error ? twilioError.message : "Unknown Twilio error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Error setting up chat:", error)
    return NextResponse.json(
      {
        error: "Failed to set up chat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
