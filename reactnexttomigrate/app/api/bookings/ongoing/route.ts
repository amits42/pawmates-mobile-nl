import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ownerId = searchParams.get("ownerId")

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Owner ID is required" },
        { status: 400 }
      )
    }

    const regularBookings = await sql`
  SELECT 
    b.id::text AS id,
    b.date,
    b.time,
    b.duration,
    b.payment_status as paymentStatus,
    b.status,
    b.total_price AS amount,
    b.notes,
    sv.name AS "serviceName",
    b.actual_start_time AS "startedAt",
    b.actual_end_time AS "endedAt",
    u.name AS "sitterName",
    u.phone AS "sitterPhone",
    p.name AS "petName",
    p.image AS "petImage",
    'regular' AS booking_type
  FROM bookings b
  JOIN sitters s ON b.sitter_id = s.id
  join services sv ON b.service_id = sv.id

  JOIN users u ON s.user_id = u.id
  JOIN pets p ON b.pet_id = p.id
  WHERE b.user_id = ${ownerId}
    AND LOWER(b.status) = 'ongoing'
`

    const recurringBookings = await sql`
  SELECT 
    rb.id::text AS id,
    rb.session_date AS date,
    rb.session_time AS time,
    rb.duration,
    rb.status,
    rb.payment_status as paymentStatus,
    rb.session_price AS amount,
    rb.notes,
    rb.service_started_at AS "startedAt",
    rb.service_ended_at AS "endedAt",
    u.name AS "sitterName",
    sv.name AS "serviceName",
    u.phone AS "sitterPhone",
    p.name AS "petName",
        p.image AS "petImage",

    'recurring_session' AS booking_type
  FROM recurring_booking rb
  JOIN sitters s ON rb.sitter_id = s.id
  join services sv ON rb.service_id = sv.id
  JOIN users u ON s.user_id = u.id
  JOIN pets p ON rb.pet_id = p.id
  WHERE rb.user_id = ${ownerId}
    AND LOWER(rb.status) = 'ongoing'
`

    // Fetch OTPs for all bookings (regular and recurring)
    const allBookingsRaw = [...regularBookings, ...recurringBookings];
    const bookingIds = allBookingsRaw
      .filter(b => b.booking_type === 'regular')
      .map(b => b.id);
    const recurringIds = allBookingsRaw
      .filter(b => b.booking_type === 'recurring_session')
      .map(b => b.id);

    // Fetch OTPs for both booking_id and recurring_booking_id

    let otps: any[] = [];
    if (bookingIds.length > 0 || recurringIds.length > 0) {
      otps = await sql`
        SELECT id, booking_id, recurring_booking_id, type, otp
        FROM service_otps
        WHERE (booking_id = ANY(${bookingIds}) OR recurring_booking_id = ANY(${recurringIds}))
      ` as any[];
    }

    // Attach OTPs to bookings
    const allBookings = allBookingsRaw.map((b: any) => {
      let startOtp = null;
      let endOtp = null;
      if (b.booking_type === 'regular') {
        startOtp = otps.find((o: any) => o.booking_id === b.id && o.type === 'START')?.otp || null;
        endOtp = otps.find((o: any) => o.booking_id === b.id && o.type === 'END')?.otp || null;
      } else if (b.booking_type === 'recurring_session') {
        startOtp = otps.find((o: any) => o.recurring_booking_id === b.id && o.type === 'START')?.otp || null;
        endOtp = otps.find((o: any) => o.recurring_booking_id === b.id && o.type === 'END')?.otp || null;
      }
      return { ...b, startOtp, endOtp };
    }).sort(
      (a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      bookings: allBookings,
    })
  } catch (error) {
    console.error("Error fetching ongoing bookings:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
