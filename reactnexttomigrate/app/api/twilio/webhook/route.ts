// app/api/twilio/whatsapp/route.ts
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import twilio from "twilio"

const sql = neon(process.env.DATABASE_URL!)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

// ----------------- Helpers -----------------

function getAdminPhones(): string[] {
  const raw = process.env.TWILIO_ADMIN_PHONE || ""
  return raw
    .split(",") // allow comma-separated list
    .map((p) => p.trim())
    .filter(Boolean)
}

async function findActiveChatRooms(senderPhone: string, twilioNumber: string) {
  try {
    // Fetch active chat rooms
    const rows = await sql`
      SELECT wcr.*, 
             b.status AS booking_status, b.date AS booking_date, b.time AS booking_time,
             s.name AS service_name, p.name AS pet_name, u.name AS user_name
      FROM whatsapp_chat_rooms wcr
      LEFT JOIN bookings b ON wcr.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE (wcr.user_phone = ${senderPhone} OR wcr.sitter_phone = ${senderPhone})
        AND wcr.status = 'active'
        AND wcr.twilio_number = ${twilioNumber}
        AND (
          b.id IS NULL OR LOWER(b.status) IN ('pending','confirmed','assigned','upcoming','ongoing')
        )
      ORDER BY wcr.created_at DESC
      LIMIT 10
    `

    // No deactivation here; handled by cron job now
    return rows
  } catch (e) {
    console.error("❌ Error finding chat rooms:", e)
    return []
  }
}

async function getActiveMenuFor(phone: string) {
  const rows = await sql`
    SELECT chat_room_options 
    FROM whatsapp_menu_state
    WHERE phone_number = ${phone} AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `
  return rows[0]?.chat_room_options ?? null
}

async function tryParseMenuSelection(senderPhone: string, body: string) {
  const options = await getActiveMenuFor(senderPhone)
  if (!options) return null
  const trimmed = (body || "").trim()
  const match = /^(\d{1,2})\D*$/.exec(trimmed)
  if (!match) return "not-a-number"
  const n = parseInt(match[1], 10)
  if (n < 1 || n > options.length) return "invalid"
  return options[n - 1] // { id, booking_id }
}

async function sendWhatsAppMessage(to: string, body: string, mediaUrls?: string[]) {
  try {
    const opts: any = {
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body
    }
    if (mediaUrls?.length) opts.mediaUrl = mediaUrls
    const msg = await twilioClient.messages.create(opts)
    console.log(`✅ Sent to ${to}: ${msg.sid}`)
    return msg
  } catch (e) {
    console.error(`❌ Failed to send to ${to}:`, e)
    return null
  }
}

function getSenderIdentity(sender: string, room: any, isForAdmin = false) {
  if (isForAdmin) {
    if (sender === room.user_phone) return `${room.user_alias || "Pet Owner"} (${sender})`
    if (sender === room.sitter_phone) return `${room.sitter_alias || "Pet Zubo Walkers"} (${sender})`
    return `Admin (${sender})`
  } else {
    if (sender === room.user_phone) return room.user_alias || "Pet Owner"
    if (sender === room.sitter_phone) return room.sitter_alias || "Pet Zubo Walkers"
    return "Support Team"
  }
}

// ----------------- Main Webhook -----------------

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const payload = Object.fromEntries(formData.entries())
    const {
      From, To, Body: MessageBody, MessageSid,
      NumMedia
    } = payload as any

    const senderPhone = (From || "").toString().replace("whatsapp:", "")
    const twilioNumber = (To || "").toString().replace("whatsapp:", "")

    if (!senderPhone || !twilioNumber) {
      return NextResponse.json({ error: "Missing phone numbers" }, { status: 400 })
    }

    // Idempotency: ignore Twilio retries
    if (MessageSid) {
      const dup = await sql`SELECT 1 FROM whatsapp_messages WHERE twilio_message_sid = ${MessageSid} LIMIT 1`
      if (dup.length) return NextResponse.json({ status: "duplicate_ignored" })
    }

    // Gather media (all attachments)
    const mediaCount = parseInt((payload as any).NumMedia || "0", 10) || 0
    const mediaUrls: string[] = []
    const mediaTypes: string[] = []
    for (let i = 0; i < mediaCount; i++) {
      mediaUrls.push((payload as any)[`MediaUrl${i}`])
      mediaTypes.push((payload as any)[`MediaContentType${i}`])
    }
    const messageType =
      mediaCount > 0 && (MessageBody || "").trim()
        ? "mixed"
        : mediaCount > 0 ? "media" : "text"

    // 1) Menu selection?
    const selection = await tryParseMenuSelection(senderPhone, MessageBody || "")
    if (selection && selection !== "invalid" && selection !== "not-a-number") {
      await sql`
        INSERT INTO whatsapp_selected_room (phone_number, chat_room_id, expires_at)
        VALUES (${senderPhone}, ${selection.id}, NOW() + INTERVAL '30 minutes')
        ON CONFLICT (phone_number) DO UPDATE
        SET chat_room_id = EXCLUDED.chat_room_id,
            expires_at   = EXCLUDED.expires_at,
            last_used_at = now()
      `
      // Clear menu so future numbers aren't captured as menu replies
      await sql`DELETE FROM whatsapp_menu_state WHERE phone_number = ${senderPhone}`
      await sendWhatsAppMessage(senderPhone, `✅ Selected Booking #${selection.booking_id}. Send your message now!`)
      return NextResponse.json({ status: "menu_response_handled" })
    }
    if (selection === "invalid") {
      const options = await getActiveMenuFor(senderPhone)
      await sendWhatsAppMessage(senderPhone, `❌ Invalid option. Please choose 1–${options.length}.`)
      return NextResponse.json({ status: "invalid_menu_option" })
    }

    // 2) Use sticky selection if available
    let chatRoom: any = null
    const sticky = await sql`
      SELECT wcr.*, wsr.sticky, wsr.expires_at
      FROM whatsapp_selected_room wsr
      JOIN whatsapp_chat_rooms wcr ON wsr.chat_room_id = wcr.id
      WHERE wsr.phone_number = ${senderPhone}
        AND (wsr.expires_at > NOW() OR wsr.sticky = true)
      LIMIT 1
    `
    if (sticky.length > 0) {
      chatRoom = sticky[0]
      await sql`
        UPDATE whatsapp_selected_room
        SET expires_at = NOW() + INTERVAL '30 minutes', last_used_at = NOW()
        WHERE phone_number = ${senderPhone}
      `
    } else {
      // 3) Find active chat rooms (this Twilio number only)
      const active = await findActiveChatRooms(senderPhone, twilioNumber)
      if (active.length === 0) {
        // 4) Auto-create 2-way support chat when nothing exists
        const createdRows = await sql`
          INSERT INTO whatsapp_chat_rooms (
            booking_id, twilio_number, user_phone, sitter_phone,
            user_alias, sitter_alias, status, chat_mode, created_at
          ) VALUES (
            NULL, ${twilioNumber}, ${senderPhone}, NULL,
            'User', NULL, 'active', 'two_way', NOW()
          )
          RETURNING *
        `
        chatRoom = createdRows[0]

        // Store selection for smooth follow-up
        await sql`
          INSERT INTO whatsapp_selected_room (phone_number, chat_room_id, expires_at)
          VALUES (${senderPhone}, ${chatRoom.id}, NOW() + INTERVAL '30 minutes')
          ON CONFLICT (phone_number) DO UPDATE
          SET chat_room_id = EXCLUDED.chat_room_id,
              expires_at   = EXCLUDED.expires_at,
              last_used_at = now()
        `

        // Friendly notice to user
        await sendWhatsAppMessage(
          senderPhone,
          "👋 We’ve created a support chat for you. An admin will reply shortly."
        )
      } else if (active.length === 1) {
        chatRoom = active[0]
      } else {
        // Multiple rooms -> send menu
        let menu = "🤔 Multiple active chats found!\n\n"
        active.forEach((r: any, i: number) => {
          const booking = r.service_name || "Pet Care Service"
          const pet = r.pet_name ? ` for ${r.pet_name}` : ""
          const date = r.booking_date ? ` (${r.booking_date})` : ""
          const user = r.user_name ? ` by ${r.user_name}` : ""
          menu += `*${i + 1}.* Booking #${r.booking_id}${pet}${user}\n   ${booking}${date}\n\n`
        })
        menu += "📱 Reply with just the number to select.\n⏰ Expires in 5 minutes."

        await sendWhatsAppMessage(senderPhone, menu)

        await sql`
          INSERT INTO whatsapp_menu_state (
            phone_number, chat_room_options, expires_at, created_at
          ) VALUES (
            ${senderPhone},
            ${JSON.stringify(active.map((r: any) => ({ id: r.id, booking_id: r.booking_id })))},
            NOW() + INTERVAL '5 minutes',
            NOW()
          )
          ON CONFLICT (phone_number) DO UPDATE
          SET chat_room_options = EXCLUDED.chat_room_options,
              expires_at = EXCLUDED.expires_at,
              created_at = EXCLUDED.created_at
        `
        return NextResponse.json({ status: "menu_sent", rooms_found: active.length })
      }
    }

    if (!chatRoom) {
      return NextResponse.json({ status: "no_chat_room" })
    }

    // ----------------- Routing -----------------
    const adminPhones = getAdminPhones()
    const mode = (chatRoom.chat_mode ?? "three_way").toLowerCase()
    const isTwoWay = mode === "two_way"
    const isThreeWay = mode === "three_way"

    let recipients: string[] = []

    if (isTwoWay) {
      // 2-way: user <-> admin only
      if (senderPhone === chatRoom.user_phone) {
        recipients.push(...adminPhones)
      } else if (adminPhones.includes(senderPhone)) {
        recipients.push(chatRoom.user_phone)
      } else if (senderPhone === chatRoom.sitter_phone) {
        // sitter shouldn't be here in two_way; ignore or notify?
        // We'll ignore silently.
      }
    } else {
      // 3-way: user <-> sitter with admins CC'ed
      if (senderPhone === chatRoom.user_phone) {
        if (chatRoom.sitter_phone) recipients.push(chatRoom.sitter_phone)
        recipients.push(...adminPhones)
      } else if (senderPhone === chatRoom.sitter_phone) {
        recipients.push(chatRoom.user_phone)
        recipients.push(...adminPhones)
      } else if (adminPhones.includes(senderPhone)) {
        recipients.push(chatRoom.user_phone)
        if (chatRoom.sitter_phone) recipients.push(chatRoom.sitter_phone)
      }
    }

    // Remove sender & dedupe
    recipients = [...new Set(recipients.filter(p => p && p !== senderPhone))]

    // Build forward text
    const forwardPromises = recipients.map(async (r) => {
      const isAdminRecipient = adminPhones.includes(r)
      const identity = getSenderIdentity(senderPhone, chatRoom, isAdminRecipient)

      let msgBody = ""
      if ((MessageBody || "").trim()) {
        const context = chatRoom.booking_id ? ` (Booking #${chatRoom.booking_id})` : isTwoWay ? " (Support Chat)" : ""
        msgBody = `*${identity}*${context}:\n${MessageBody}`
      } else if (mediaUrls.length) {
        const context = chatRoom.booking_id ? ` (Booking #${chatRoom.booking_id})` : isTwoWay ? " (Support Chat)" : ""
        msgBody = `*${identity}*${context} sent a ${mediaTypes[0]?.split("/")[0] || "file"}`
      }

      return sendWhatsAppMessage(r, msgBody, mediaUrls)
    })

    await Promise.allSettled(forwardPromises)

    // Log inbound
    await sql`
      INSERT INTO whatsapp_messages (
        chat_room_id, direction, sender_phone, recipient_phones,
        message_body, message_type, media_urls, media_content_types,
        twilio_message_sid, status
      ) VALUES (
        ${chatRoom.id}, 'inbound', ${senderPhone}, ${JSON.stringify(recipients)},
        ${MessageBody || ""}, ${messageType}, ${JSON.stringify(mediaUrls)}, ${JSON.stringify(mediaTypes)},
        ${MessageSid || null}, 'forwarded'
      )
      ON CONFLICT (twilio_message_sid) DO NOTHING
    `

    return NextResponse.json({ status: "success", forwarded_to: recipients.length, chat_room_id: chatRoom.id })
  } catch (e) {
    console.error("❌ Webhook error:", e)
    return NextResponse.json(
      { status: "error", message: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "Twilio WhatsApp webhook active" })
}
