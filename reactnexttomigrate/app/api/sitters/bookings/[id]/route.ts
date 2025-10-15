import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const bookingId = params.id
        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get("type") // "regular" | "recurring"
        const userId = request.headers.get("x-user-id")

        console.log("Booking details API - id:", bookingId, "type:", type, "userId:", userId)

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 })
        }

        // Verify sitter ownership (get sitterId from userId)
        const sitterResult = await sql`SELECT id FROM sitters WHERE user_id = ${userId}`
        if (sitterResult.length === 0) {
            return NextResponse.json({ error: "Sitter not found" }, { status: 404 })
        }

        const sitterId = sitterResult[0].id

        let bookingResult: any[] = []

        if (type === "regular") {
            bookingResult = await sql`
        SELECT 
          b.id,
          b.date,
          b.time,
          b.duration,
          b.status,
          b.total_price,
          b.notes,
          b.is_recurring,
          b.recurring_pattern,
          s.name as service_name,
          p.name as pet_name,
          p.id as pet_id,
          p.type as pet_type,
          u.name as owner_name,
          p.breed,
          u.phone as owner_phone,
          a.line1,
          a.city,
          a.state,
          'regular' as booking_type
        FROM bookings b
        LEFT JOIN services s ON b.service_id = s.id
        LEFT JOIN pets p ON b.pet_id = p.id
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN addresses a ON u.id = a.user_id
        WHERE b.id = ${bookingId} AND b.sitter_id = ${sitterId}
      `
        } else if (type === "recurring") {
            bookingResult = await sql`
        SELECT 
          rb.id,
          rb.session_date as date,
          rb.session_time as time,
          rb.duration,
          rb.status,
          rb.session_price as total_price,
          rb.notes,
          false as is_recurring,
          null as recurring_pattern,
          s.name as service_name,
          p.name as pet_name,
          p.type as pet_type,
            p.id as pet_id,
          u.name as owner_name,
          p.breed,
          u.phone as owner_phone,
          a.line1,
          a.city,
          a.state,
          'recurring_session' as booking_type,
          rb.sequence_number,
          rb.payment_status
        FROM recurring_booking rb
        LEFT JOIN services s ON rb.service_id = s.id
        LEFT JOIN pets p ON rb.pet_id = p.id
        LEFT JOIN users u ON rb.user_id = u.id
        LEFT JOIN bookings b ON rb.booking_id::text = b.id
        LEFT JOIN addresses a ON u.id = a.user_id
        WHERE rb.id = ${bookingId} AND rb.sitter_id = ${sitterId}
      `
        } else {
            return NextResponse.json(
                { error: "Invalid type. Use ?type=regular or ?type=recurring" },
                { status: 400 }
            )
        }

        if (bookingResult.length === 0) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 })
        }

        const booking = bookingResult[0]

        const formattedBooking = {
            id: booking.id,
            date: booking.date,
            time: booking.time,
            service: booking.service_name || "Service",
            breed: booking.breed,
            petName: booking.pet_name || "Pet",
            petType: booking.pet_type || "Unknown",
            ownerName: booking.owner_name || "Owner",
            ownerPhone: booking.owner_phone || "",
            location:
                `${booking.line1 || ""}, ${booking.city || ""}, ${booking.state || ""}`
                    .trim()
                    .replace(/^,|,$/, "") || "Location not specified",
            status: booking.status ? booking.status.toLowerCase() : "pending",
            duration: booking.duration || 60,
            amount: Number.parseFloat(booking.total_price) || 0,
            notes: booking.notes,
            recurring: booking.is_recurring || false,
            recurringPattern: booking.recurring_pattern,
            bookingType: booking.booking_type,
            sequenceNumber: booking.sequence_number,
            petId: booking.pet_id,
            paymentStatus: booking.payment_status,
        }

        return NextResponse.json(formattedBooking)
    } catch (error) {
        console.error("Error fetching booking details:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
