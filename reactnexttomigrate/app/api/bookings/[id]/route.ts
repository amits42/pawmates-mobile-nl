import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Helper function to get the authenticated user ID from the request
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("x-user-id")
  return userId ?? null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Get user ID from authentication
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Try to fetch from bookings table first
    let booking: any = null;
    let recurring = false;
    let recurringStartDate: string | null = null;
    let result = await sql`
      SELECT 
        b.id,
        c.code as coupon_code,
        b.user_id,
        b.pet_id,
        b.service_id,
        b.sitter_id,
        b.address_id,
        b.date,
        b.time,
        b.duration,
        b.status,
        b.total_price,
        b.payment_status,
        b.payment_id,
        b.notes,
        b.is_recurring,
        b.recurring_pattern,
        b.recurring_end_date,
        b.service_otp,
        b.otp_expiry,
        b.otp_verified,
        b.actual_start_time,
        b.actual_end_time,
        b.actual_duration,
        b.created_at,
        b.updated_at,
        p.name as pet_name,
        p.type as pet_type,
        p.breed as pet_breed,
        s.name as service_name,
        s.description as service_description,
        s.price as service_price,
        s.duration as service_duration,
        sit.bio as sitter_bio,
        sit.rating as sitter_rating,
        sit.profile_picture as sitter_profile_picture,
        u.name as sitter_name,
        u.phone as sitter_phone,
        u.email as sitter_email,
        start_otp.otp as start_otp,
        end_otp.otp as end_otp
      FROM bookings b
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN sitters sit ON b.sitter_id = sit.id
      LEFT JOIN users u ON sit.user_id = u.id
      LEFT JOIN service_otps start_otp ON b.id = start_otp.booking_id AND start_otp.type = 'START'
      LEFT JOIN service_otps end_otp ON b.id = end_otp.booking_id AND end_otp.type = 'END'
      LEFT JOIN coupon_redemptions cr ON cr.booking_id = b.id
      LEFT JOIN coupons c ON cr.coupon_id = c.id
      WHERE b.id = ${bookingId} AND b.user_id = ${userId}
      LIMIT 1
    `;
    if (result.length) {
      booking = result[0];
      recurring = !!booking.is_recurring;
      // If recurring, fetch recurringStartDate and recurringEndDate from recurring_booking table
      if (recurring) {
        const startSession = await sql`
          SELECT session_date FROM recurring_booking WHERE booking_id = ${bookingId} AND sequence_number = 1 LIMIT 1;
        `;
        recurringStartDate = startSession[0]?.session_date || null;
        const endSession = await sql`
          SELECT session_date FROM recurring_booking WHERE booking_id = ${bookingId} ORDER BY sequence_number DESC LIMIT 1;
        `;
        booking.recurring_end_date = endSession[0]?.session_date || null;
      }
    } else {
      // Try recurring_booking table
      let recurringResult = await sql`
        SELECT 
          rb.id,
          rb.user_id,
          rb.pet_id,
          rb.service_id,
          rb.sitter_id,
          
          rb.session_date as date,
          rb.session_time as time,
          rb.duration,
          rb.status,
          rb.session_price as total_price,
          rb.payment_status,
          true as is_recurring,
          
          NULL as service_otp,
          NULL as otp_expiry,
          NULL as otp_verified,
          NULL as actual_start_time,
          NULL as actual_end_time,
          NULL as actual_duration,
          rb.created_at,
          rb.updated_at,
          p.name as pet_name,
          p.type as pet_type,
          p.breed as pet_breed,
          s.name as service_name,
          s.description as service_description,
          s.price as service_price,
          s.duration as service_duration,
          sit.bio as sitter_bio,
          sit.rating as sitter_rating,
          sit.profile_picture as sitter_profile_picture,
          u.name as sitter_name,
          u.phone as sitter_phone,
          u.email as sitter_email,
          NULL as start_otp,
          NULL as end_otp
        FROM recurring_booking rb
        LEFT JOIN pets p ON rb.pet_id = p.id
        LEFT JOIN services s ON rb.service_id = s.id
        LEFT JOIN sitters sit ON rb.sitter_id = sit.id
        LEFT JOIN users u ON sit.user_id = u.id
        WHERE rb.id = ${bookingId} AND rb.user_id = ${userId}
        LIMIT 1
      `;
      if (recurringResult.length) {
        booking = recurringResult[0];
        recurring = true;
      }
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Fetch address if address_id exists
    let address = null;
    if (booking.address_id) {
      const addresses = await sql`SELECT id, user_id as "userId", line1, line2, city, state, postal_code as "postalCode", country, latitude, longitude, landmark, is_default as "isDefault", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt" FROM addresses WHERE id = ${booking.address_id} LIMIT 1`;
      address = addresses[0] || null;
    }

    const formattedBooking = {
      id: booking.id,
      userId: booking.user_id,
      petId: booking.pet_id,
      serviceId: booking.service_id,
      sitterId: booking.sitter_id,
      addressId: booking.address_id,
      address, // full address object or null
      date: booking.date,
      time: booking.time,
      duration: booking.duration,
      status: booking.status,
      totalPrice: Number.parseFloat(booking.total_price || "0"),
      paymentStatus: booking.payment_status,
      paymentId: booking.payment_id,
      notes: booking.notes,
      recurring,
      recurringPattern: booking.recurring_pattern,
      recurringEndDate: booking.recurring_end_date,
      recurringStartDate,
      serviceOtp: booking.service_otp,
      otpExpiry: booking.otp_expiry,
      otpVerified: booking.otp_verified,
      actualStartTime: booking.actual_start_time,
      actualEndTime: booking.actual_end_time,
      actualDuration: booking.actual_duration,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      petName: booking.pet_name,
      petType: booking.pet_type,
      petBreed: booking.pet_breed,
      serviceName: booking.service_name,
      serviceDescription: booking.service_description,
      servicePrice: Number.parseFloat(booking.service_price || "0"),
      serviceDuration: booking.service_duration,
      sitter_name: booking.sitter_name,
      sitter_phone: booking.sitter_phone,
      sitter_email: booking.sitter_email,
      sitterName: booking.sitter_name,
      caretakerName: booking.sitter_name,
      sitterRating: Number.parseFloat(booking.sitter_rating || "0"),
      sitterImage: booking.sitter_profile_picture,
      startOtp: booking.start_otp,
      endOtp: booking.end_otp,
      couponCode: booking.coupon_code || null
    };

    return NextResponse.json(formattedBooking);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
