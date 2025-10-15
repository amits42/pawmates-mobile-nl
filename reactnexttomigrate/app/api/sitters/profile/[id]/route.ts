import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sitterId = params.id
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    if (!sitterId) {
      return NextResponse.json({ error: "Sitter ID is required" }, { status: 400 })
    }

    // Fetch sitter profile
    const sitterResult = await sql/*sql*/`
      SELECT 
        s.id,
        s.user_id as "userId",
        u.name as "name",
        u.email as "email",
        u.phone as "phone",
        s.bio,
        s.experience,
        s.rating,
        s.total_bookings as "totalBookings",
        s.is_verified as "isVerified",
        s.services,
        s.hourly_rate as "hourlyRate",
        s.years_of_experience as "yearsOfExperience",
        s.specialties,
        s.training,
        s.profile_picture as "profilePicture",
        s.photo_url as "photoUrl",
        s.video_url as "videoUrl", 
        s.availability,
        s.location,
        s.is_active as "isActive",
        s.created_at as "createdAt"
      FROM sitters s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sitterId} AND s.is_active = true
    `

    if (sitterResult.length === 0) {
      return NextResponse.json({ error: "Zubo Walkers not found" }, { status: 404 })
    }

    const sitter = sitterResult[0]

    const formattedSitter = {
      ...sitter,
      specialties: sitter.specialties || [],
      services: sitter.services || [],
      availability: sitter.availability || {},
      location: sitter.location || null,
      totalBookings: sitter.totalBookings || 0,
      isVerified: sitter.isVerified || false,
      rating: sitter.rating || 0.0,
      videoUrl: sitter.videoUrl || null,
    }

    // Fetch reviews
    // const reviewsResult = await sql/*sql*/`
    //   SELECT 
    //     r.id,
    //     u.name as "userName",
    //     r.rating,
    //     r.comment,
    //     r.created_at as "date",
    //     p.name as "petName",
    //     srv.name as "serviceName"
    //   FROM reviews r
    //   JOIN users u ON r.user_id = u.id
    //   JOIN bookings b ON r.booking_id = b.id
    //   JOIN pets p ON b.pet_id = p.id
    //   JOIN services srv ON b.service_id = srv.id
    //   WHERE r.sitter_id = ${sitterId}
    //   ORDER BY r.created_at DESC
    //   LIMIT 10
    // `

    return NextResponse.json({
      sitter: formattedSitter,
      reviews: [],
    })
  } catch (error) {
    console.error("❌ Error fetching Zubo Walkers profile:", error)
    return NextResponse.json({ error: "Failed to fetch Zubo Walkers profile" }, { status: 500 })
  }
}
