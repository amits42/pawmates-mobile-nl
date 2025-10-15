import { NextResponse } from "next/server"
import type { Caretaker } from "@/types/api"

// Real database implementation with Neon (commented out for v0 preview)
/*
import { neon } from '@neondatabase/serverless'

// Initialize the SQL client
const sql = neon(process.env.DATABASE_URL)

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return Math.round(d * 10) / 10
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get("serviceId")
    const date = searchParams.get("date")
    const time = searchParams.get("time")
    const userLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null
    const userLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null
    const isRecurring = searchParams.get("isRecurring") === "true"
    const recurringPattern = searchParams.get("recurringPattern")
    
    // Build base query to get caretakers
    let caretakersQuery = `
      SELECT 
        c.id, 
        u.name, 
        u.profile_picture as image,
        c.bio, 
        c.base_rate as price,
        cl.latitude, 
        cl.longitude, 
        cl.formatted_address as address
      FROM caretakers c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN caretaker_locations cl ON c.id = cl.caretaker_id
      WHERE c.is_active = true
    `
    
    // Add service filter if provided
    let params: any[] = []
    let paramIndex = 1
    
    if (serviceId) {
      caretakersQuery += `
        AND c.id IN (
          SELECT caretaker_id 
          FROM caretaker_services 
          WHERE service_id = $${paramIndex} AND is_active = true
        )
      `
      params.push(serviceId)
      paramIndex++
    }
    
    // Add availability filter if date and time provided
    if (date && time) {
      const dayOfWeek = new Date(date).getDay()
      const timeHour = parseInt(time.split(':')[0])
      
      caretakersQuery += `
        AND c.id IN (
          SELECT caretaker_id 
          FROM caretaker_availability 
          WHERE day_of_week = $${paramIndex} 
          AND start_hour <= $${paramIndex + 1} 
          AND end_hour > $${paramIndex + 1}
          AND is_active = true
        )
      `
      params.push(dayOfWeek, timeHour)
      paramIndex += 2
    }
    
    // Execute the query
    const caretakers = await sql.unsafe(caretakersQuery, params)
    
    // Get specialties for each caretaker
    const caretakersWithSpecialties = await Promise.all(
      caretakers.map(async (caretaker: any) => {
        // Get services offered by this caretaker
        const services = await sql`
          SELECT s.name
          FROM caretaker_services cs
          JOIN services s ON cs.service_id = s.id
          WHERE cs.caretaker_id = ${caretaker.id}
          AND cs.is_active = true
        `
        
        // Get availability periods
        const availability = await sql`
          SELECT day_of_week, start_hour, end_hour
          FROM caretaker_availability
          WHERE caretaker_id = ${caretaker.id}
          AND is_active = true
        `
        
        // Get reviews count and average
        const reviewsResult = await sql`
          SELECT 
            COUNT(*) as review_count,
            AVG(rating) as avg_rating
          FROM reviews
          WHERE caretaker_id = ${caretaker.id}
          AND is_active = true
        `
        
        const reviewCount = parseInt(reviewsResult[0].review_count) || 0
        const avgRating = parseFloat(reviewsResult[0].avg_rating) || 0
        
        // Format availability into periods
        const availabilityPeriods = availability.map((slot: any) => {
          if (slot.start_hour < 12) return "Morning"
          if (slot.start_hour < 17) return "Afternoon"
          return "Evening"
        }).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) // Remove duplicates
        
        // Calculate distance if user location provided
        let distance = null
        if (userLat && userLng && caretaker.latitude && caretaker.longitude) {
          distance = calculateDistance(
            userLat, 
            userLng, 
            caretaker.latitude, 
            caretaker.longitude
          )
        }
        
        // Format the caretaker object
        return {
          id: caretaker.id,
          name: caretaker.name,
          rating: parseFloat(avgRating.toFixed(1)),
          reviews: reviewCount,
          specialties: services.map((s: any) => s.name),
          bio: caretaker.bio,
          location: {
            lat: caretaker.latitude || 0,
            lng: caretaker.longitude || 0,
            address: caretaker.address || "",
            distance: distance,
          },
          availability: availabilityPeriods,
          price: caretaker.price,
          image: caretaker.image || "/placeholder.svg?height=100&width=100",
        }
      })
    )
    
    // Sort by distance if user location provided, otherwise by rating
    if (userLat && userLng) {
      caretakersWithSpecialties.sort((a: any, b: any) => 
        (a.location.distance || Number.POSITIVE_INFINITY) - 
        (b.location.distance || Number.POSITIVE_INFINITY)
      )
    } else {
      caretakersWithSpecialties.sort((a: any, b: any) => b.rating - a.rating)
    }
    
    return NextResponse.json(caretakersWithSpecialties)
  } catch (error) {
    console.error("Error fetching caretakers:", error)
    return NextResponse.json(
      { error: "Failed to fetch caretakers" },
      { status: 500 }
    )
  }
}

// Create a new caretaker (for admin or onboarding)
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { userId, bio, services, availability, location, baseRate } = data
    
    // Validate required fields
    if (!userId || !bio || !services || !availability) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const users = await sql`
      SELECT * FROM users
      WHERE id = ${userId}
    `
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // Create caretaker
    const caretakers = await sql`
      INSERT INTO caretakers (
        user_id,
        bio,
        base_rate,
        is_active,
        is_verified
      ) VALUES (
        ${userId},
        ${bio},
        ${baseRate || 25},
        true,
        false
      )
      RETURNING *
    `
    
    const caretakerId = caretakers[0].id
    
    // Create services
    for (const service of services) {
      await sql`
        INSERT INTO caretaker_services (
          caretaker_id,
          service_id,
          price,
          is_active
        ) VALUES (
          ${caretakerId},
          ${service.id},
          ${service.price},
          true
        )
      `
    }
    
    // Create availability slots
    for (const slot of availability) {
      await sql`
        INSERT INTO caretaker_availability (
          caretaker_id,
          day_of_week,
          start_hour,
          end_hour,
          is_active
        ) VALUES (
          ${caretakerId},
          ${slot.dayOfWeek},
          ${slot.startHour},
          ${slot.endHour},
          true
        )
      `
    }
    
    // Create location if provided
    if (location) {
      await sql`
        INSERT INTO caretaker_locations (
          caretaker_id,
          latitude,
          longitude,
          formatted_address,
          city,
          state,
          country,
          postal_code,
          is_active
        ) VALUES (
          ${caretakerId},
          ${location.lat},
          ${location.lng},
          ${location.address},
          ${location.city},
          ${location.state},
          ${location.country},
          ${location.postalCode},
          true
        )
      `
    }
    
    // Get the created caretaker with all relations
    const createdCaretaker = {
      id: caretakerId,
      userId: userId,
      bio: bio,
      baseRate: baseRate || 25,
      isActive: true,
      isVerified: false,
      services: services,
      availability: availability,
      location: location
    }
    
    return NextResponse.json({
      success: true,
      message: "Caretaker created successfully",
      caretaker: createdCaretaker,
    })
  } catch (error) {
    console.error("Error creating caretaker:", error)
    return NextResponse.json(
      { error: "Failed to create caretaker" },
      { status: 500 }
    )
  }
}
*/

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return Math.round(d * 10) / 10
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Mock caretakers data
const mockCaretakers: Caretaker[] = [
  {
    id: "caretaker1",
    name: "Sarah Johnson",
    rating: 4.8,
    reviews: 124,
    specialties: ["Dog Walking", "Pet Sitting"],
    bio: "Professional pet caretaker with 5 years of experience. Certified in pet first aid.",
    location: {
      lat: 40.7128,
      lng: -74.006,
      address: "Brooklyn, NY",
    },
    availability: ["Morning", "Afternoon"],
    price: 25,
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "caretaker2",
    name: "Michael Brown",
    rating: 4.9,
    reviews: 89,
    specialties: ["Grooming", "Training"],
    bio: "Former veterinary assistant with a passion for animal care. Specialized in dog training.",
    location: {
      lat: 40.7282,
      lng: -73.994,
      address: "Manhattan, NY",
    },
    availability: ["Afternoon", "Evening"],
    price: 30,
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "caretaker3",
    name: "Emily Davis",
    rating: 4.7,
    reviews: 56,
    specialties: ["Cat Care", "Pet Sitting"],
    bio: "Cat specialist with experience in caring for all breeds. Calm and patient approach.",
    location: {
      lat: 40.7053,
      lng: -74.0088,
      address: "Queens, NY",
    },
    availability: ["Morning", "Evening"],
    price: 28,
    image: "/placeholder.svg?height=100&width=100",
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get("serviceId")
  const date = searchParams.get("date")
  const time = searchParams.get("time")
  const userLat = searchParams.get("lat")
  const userLng = searchParams.get("lng")
  const isRecurring = searchParams.get("isRecurring") === "true"
  const recurringPattern = searchParams.get("recurringPattern")
  const recurringEndDate = searchParams.get("recurringEndDate")

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  let availableCaretakers = [...mockCaretakers]

  // If user location is provided, calculate distances and sort by proximity
  if (userLat && userLng) {
    const lat = Number.parseFloat(userLat)
    const lng = Number.parseFloat(userLng)

    availableCaretakers = availableCaretakers.map((caretaker) => {
      const distance = calculateDistance(lat, lng, caretaker.location.lat, caretaker.location.lng)

      return {
        ...caretaker,
        location: {
          ...caretaker.location,
          distance,
        },
      }
    })

    // Sort by distance
    availableCaretakers.sort(
      (a, b) => (a.location.distance || Number.POSITIVE_INFINITY) - (b.location.distance || Number.POSITIVE_INFINITY),
    )
  }

  return NextResponse.json(availableCaretakers)
}
