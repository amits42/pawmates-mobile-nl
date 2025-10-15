import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingDetails } = body

    if (!bookingDetails) {
      return NextResponse.json({ error: "Booking details are required" }, { status: 400 })
    }

    // Create WhatsApp message
    const message = `Hi! I need help with my booking:

📋 *Booking Details:*
• Booking ID: #${bookingDetails.id}
• Service: ${bookingDetails.service_name}
• Pet: ${bookingDetails.pet_name}
• Date: ${new Date(bookingDetails.service_date).toLocaleDateString()}
• Time: ${bookingDetails.service_time}
• Status: ${bookingDetails.status}
• Amount: ₹${bookingDetails.total_amount}

Please assist me with this booking. Thank you!`

    // Format phone number for WhatsApp
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "919999999999"
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

    return NextResponse.json({ whatsappUrl })
  } catch (error) {
    console.error("Error generating WhatsApp message:", error)
    return NextResponse.json({ error: "Failed to generate WhatsApp message" }, { status: 500 })
  }
}
