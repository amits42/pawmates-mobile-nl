import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const userId = request.headers.get("X-User-ID")

    if (!bookingId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get existing review for this booking
    const reviews = await sql`
      SELECT * FROM service_reviews 
      WHERE booking_id = ${bookingId} AND user_id = ${userId}
      LIMIT 1
    `

    return NextResponse.json({
      review: reviews.length > 0 ? reviews[0] : null,
    })
  } catch (error) {
    console.error("Error fetching review:", error)
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-ID")
    const { bookingId, serviceId, sitterId, rating, reviewText } = await request.json()

    if (!userId || !bookingId || !serviceId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Check if review already exists
    const existingReview = await sql`
      SELECT id FROM service_reviews 
      WHERE booking_id = ${bookingId} AND user_id = ${userId}
      LIMIT 1
    `

    if (existingReview.length > 0) {
      return NextResponse.json({ error: "Review already exists for this booking" }, { status: 400 })
    }

    // Verify booking belongs to user and is completed
    const booking = await sql`
      SELECT id, status FROM bookings 
      WHERE id = ${bookingId} AND user_id = ${userId} AND status = 'completed'
      LIMIT 1
    `

    if (booking.length === 0) {
      return NextResponse.json({ error: "Booking not found or not completed" }, { status: 404 })
    }

    // Create review
    const review = await sql`
      INSERT INTO service_reviews (booking_id, user_id, service_id, sitter_id, rating, review_text)
      VALUES (${bookingId}, ${userId}, ${serviceId}, ${sitterId}, ${rating}, ${reviewText || null})
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      review: review[0],
    })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-ID")
    const { bookingId, rating, reviewText } = await request.json()

    if (!userId || !bookingId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Update existing review
    const review = await sql`
      UPDATE service_reviews 
      SET rating = ${rating}, review_text = ${reviewText || null}, updated_at = NOW()
      WHERE booking_id = ${bookingId} AND user_id = ${userId}
      RETURNING *
    `

    if (review.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      review: review[0],
    })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}
