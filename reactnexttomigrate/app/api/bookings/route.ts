import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { isTimeSlotBookable } from "@/lib/booking-time-validator"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

// Helper function to get the authenticated user ID from the request
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("x-user-id")
  return userId ?? null
}

// Helper function to calculate recurring session dates
function calculateRecurringDates(
  startDate: string,
  endDate: string,
  pattern: string,
  times: string[], // Changed from single time to array of times
): Array<{ date: string; time: string; sequenceNumber: number }> {
  const sessions: Array<{ date: string; time: string; sequenceNumber: number }> = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  let sequenceNumber = 1

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  // First, collect all dates based on pattern
  const dates: string[] = []

  if (pattern.startsWith("weekly")) {
    const [, intervalStr, daysStr] = pattern.split("_")
    const interval = Number.parseInt(intervalStr, 10)
    const weekdays = daysStr.split(",").map((d) => dayMap[d.toLowerCase()])

    const current = new Date(start)

    while (current <= end) {
      const currentWeekStart = new Date(current)

      for (const weekday of weekdays) {
        const sessionDate = new Date(currentWeekStart)
        sessionDate.setDate(sessionDate.getDate() + ((7 + weekday - sessionDate.getDay()) % 7))

        if (sessionDate >= start && sessionDate <= end) {
          const isoDate = sessionDate.toISOString().split("T")[0]
          if (!dates.includes(isoDate)) {
            dates.push(isoDate)
          }
        }
      }

      current.setDate(current.getDate() + interval * 7)
    }
  } else if (pattern.startsWith("monthly")) {
    const [, monthIntervalStr, nthStr, weekdaysStr] = pattern.split("_")
    const monthInterval = Number.parseInt(monthIntervalStr, 10)
    const nth = Number.parseInt(nthStr, 10)
    const weekdays = weekdaysStr.split(",").map((d) => dayMap[d.toLowerCase()])

    const current = new Date(start)

    while (current <= end) {
      const year = current.getFullYear()
      const month = current.getMonth()

      for (const weekday of weekdays) {
        const date = getNthWeekdayOfMonth(year, month, weekday, nth)
        if (date && date >= start && date <= end) {
          const isoDate = date.toISOString().split("T")[0]
          if (!dates.includes(isoDate)) {
            dates.push(isoDate)
          }
        }
      }

      current.setMonth(current.getMonth() + monthInterval)
      current.setDate(1)
    }
  }

  dates.sort()
  for (const date of dates) {
    for (const time of times) {
      sessions.push({
        date,
        time,
        sequenceNumber: sequenceNumber++,
      })
    }
  }

  return sessions
}

// Helper to get Nth weekday of a given month
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const offset = (7 + weekday - firstDayOfWeek) % 7
  const day = 1 + offset + (nth - 1) * 7
  const result = new Date(year, month, day)
  return result.getMonth() === month ? result : null
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching bookings from database...")

    // Get user ID from authentication
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      console.error("❌ No authenticated user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("👤 Fetching bookings for user:", userId)

    // Query bookings from database with proper joins to get sitter details and OTPs
    const bookings = await sql`
      SELECT 
        b.id,
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
        -- Get START and END OTPs from service_otps table
        start_otp.otp as start_otp,
        end_otp.otp as end_otp
      FROM bookings b
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN sitters sit ON b.sitter_id = sit.id
      LEFT JOIN users u ON sit.user_id = u.id
      LEFT JOIN service_otps start_otp ON b.id = start_otp.booking_id AND start_otp.type = 'START'
      LEFT JOIN service_otps end_otp ON b.id = end_otp.booking_id AND end_otp.type = 'END'
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
    `

    console.log(`✅ Found ${bookings.length} bookings`)

    // Log OTP data for debugging
    bookings.slice(0, 3).forEach((booking, index) => {
      console.log(`🔐 Booking ${index + 1} OTP data:`, {
        id: booking.id,
        service_otp: booking.service_otp,
        start_otp: booking.start_otp,
        end_otp: booking.end_otp,
      })
    })

    // Transform the data to match the expected format
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      userId: booking.user_id,
      petId: booking.pet_id,
      serviceId: booking.service_id,
      sitterId: booking.sitter_id,
      addressId: booking.address_id,
      date: booking.date,
      time: booking.time,
      duration: booking.duration,
      status: booking.status,
      totalPrice: Number.parseFloat(booking.total_price || "0"),
      paymentStatus: booking.payment_status,
      paymentId: booking.payment_id,
      notes: booking.notes,
      recurring: booking.is_recurring,
      recurringPattern: booking.recurring_pattern,
      recurringEndDate: booking.recurring_end_date,
      serviceOtp: booking.service_otp, // Legacy field
      otpExpiry: booking.otp_expiry,
      otpVerified: booking.otp_verified,
      actualStartTime: booking.actual_start_time,
      actualEndTime: booking.actual_end_time,
      actualDuration: booking.actual_duration,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      // Related data
      petName: booking.pet_name,
      petType: booking.pet_type,
      petBreed: booking.pet_breed,
      serviceName: booking.service_name,
      serviceDescription: booking.service_description,
      servicePrice: Number.parseFloat(booking.service_price || "0"),
      serviceDuration: booking.service_duration,
      // Sitter data from proper joins
      sitter_name: booking.sitter_name,
      sitter_phone: booking.sitter_phone,
      sitter_email: booking.sitter_email,
      sitterName: booking.sitter_name,
      caretakerName: booking.sitter_name,
      sitterRating: Number.parseFloat(booking.sitter_rating || "0"),
      sitterImage: booking.sitter_profile_picture,
      // NEW: START and END OTPs
      startOtp: booking.start_otp,
      endOtp: booking.end_otp,
    }))

    console.log("✅ Bookings formatted and ready to send")
    return NextResponse.json(formattedBookings)
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Creating new booking...")
    const bookingData = await request.json()
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    if (!bookingData.petId || !bookingData.serviceId || !bookingData.date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (
      bookingData.recurring &&
      (!bookingData.times || !Array.isArray(bookingData.times) || bookingData.times.length === 0)
    ) {
      return NextResponse.json({ error: "Recurring bookings require at least one time slot" }, { status: 400 })
    }
    if (!bookingData.recurring && !bookingData.time) {
      return NextResponse.json({ error: "One-time bookings require a time" }, { status: 400 })
    }

    const timesToValidate = bookingData.recurring ? bookingData.times : [bookingData.time]
    for (const time of timesToValidate) {
      const validation = isTimeSlotBookable(bookingData.date, time)
      if (!validation.isBookable) {
        return NextResponse.json(
          {
            error: "Invalid booking time",
            details: validation.reason,
          },
          { status: 400 },
        )
      }
    }

    // Fetch service price
    const services = await sql`SELECT id, price FROM services WHERE id = ${bookingData.serviceId}`
    if (services.length === 0) return NextResponse.json({ error: "Service not found" }, { status: 404 })
    const servicePrice = Number.parseFloat(services[0].price || "0")
    const paymentStatus = bookingData.paymentOption === "pay-now" ? "PAID" : "PENDING"

    // Start transaction
    await sql`BEGIN`

    const bookingTime = bookingData.recurring ? bookingData.times[0] : bookingData.time

    // Insert main booking
    const bookingResult = await sql`
      INSERT INTO bookings (
        user_id, pet_id, service_id, address_id,
        date, time, duration, status, total_price, payment_status,
        payment_id, notes, is_recurring, recurring_pattern, 
        recurring_end_date, service_otp, otp_expiry, created_at, updated_at
      ) VALUES (
        ${userId}, ${bookingData.petId}, ${bookingData.serviceId}, ${bookingData.addressId || null},
        ${bookingData.date}, ${bookingTime}, ${bookingData.duration || 60}, 'PENDING',
        ${bookingData.totalPrice || servicePrice}, ${paymentStatus},
        ${bookingData.paymentId || null}, ${bookingData.notes || "Booking created via payment flow"},
        ${bookingData.recurring || false}, ${bookingData.recurringPattern || null},
        ${bookingData.recurringEndDate || null}, ${null}, ${null}, NOW(), NOW()
      ) RETURNING *`

    const newBooking = bookingResult[0]

    // If recurring booking
    if (bookingData.recurring && bookingData.recurringPattern && bookingData.recurringEndDate) {
      const sessions = calculateRecurringDates(
        bookingData.date,
        bookingData.recurringEndDate,
        bookingData.recurringPattern,
        bookingData.times,
      )
      const sessionPrice = +(bookingData.totalPrice / sessions.length).toFixed(2)

      // Prepare bulk insert values for recurring_booking
      const recurringValues = sessions.map((s) => [
        userId,
        bookingData.petId,
        bookingData.serviceId,
        null, // sitter_id
        newBooking.id, // booking_id
        s.sequenceNumber,
        s.date,
        s.time,
        bookingData.duration || 60,
        sessionPrice,
        "PENDING",
        "PENDING",
        `Session ${s.sequenceNumber} of recurring booking`,
        new Date(),
        new Date(),
      ])
      const recurringPlaceholders = recurringValues
        .map(
          (_, i) =>
            `(${Array(15)
              .fill(0)
              .map((__, j) => `$${i * 15 + j + 1}`)
              .join(",")})`,
        )
        .join(",")
      const flatRecurring = recurringValues.flat()

      const recurringResult = await sql.query(
        `INSERT INTO recurring_booking (
          user_id, pet_id, service_id, sitter_id, booking_id,
          sequence_number, session_date, session_time, duration,
          session_price, status, payment_status, notes, created_at, updated_at
        ) VALUES ${recurringPlaceholders} RETURNING *`,
        flatRecurring,
      )

      // Prepare bulk insert for service_otps
      const otpValues = recurringResult.flatMap((r) => {
        const startOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const endOtp = Math.floor(100000 + Math.random() * 900000).toString()
        return [
          [null, r.id, "START", startOtp, false, new Date()],
          [null, r.id, "END", endOtp, false, new Date()],
        ]
      })
      const otpPlaceholders = otpValues
        .map(
          (_, i) =>
            `(${Array(6)
              .fill(0)
              .map((__, j) => `$${i * 6 + j + 1}`)
              .join(",")})`,
        )
        .join(",")
      const flatOtp = otpValues.flat()

      await sql.query(
        `INSERT INTO service_otps (booking_id, recurring_booking_id, type, otp, is_used, created_at)
         VALUES ${otpPlaceholders}`,
        flatOtp,
      )
    } else {
      // Single booking OTPs
      const serviceOtp = Math.floor(100000 + Math.random() * 900000).toString()
      const startOtp = Math.floor(100000 + Math.random() * 900000).toString()
      const endOtp = Math.floor(100000 + Math.random() * 900000).toString()

      await sql`
        UPDATE bookings
        SET service_otp = ${serviceOtp}, otp_expiry = ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
        WHERE id = ${newBooking.id}`
      await sql`
        INSERT INTO service_otps (booking_id, recurring_booking_id, type, otp, is_used, created_at)
        VALUES (${newBooking.id}, ${null}, 'START', ${startOtp}, false, NOW()),
               (${newBooking.id}, ${null}, 'END', ${endOtp}, false, NOW())
      `
    }

    await sql`COMMIT`

    return NextResponse.json({ success: true, bookingId: newBooking.id })
  } catch (err) {
    await sql`ROLLBACK`
    console.error("❌ Error creating booking transaction:", err)
    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
