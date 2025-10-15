import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Initialize the SQL client
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    console.log("🐾 GET /api/pets - Fetching pets for user:", userId)

    if (!userId) {
      console.error("❌ User ID is required")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const pets = await sql`
      SELECT 
        id,
        user_id as "userId",
        name,
        type,
        breed,
        age,
        weight,
        gender,
        description,
        medical_info as "medicalInfo",
        allergies,
        behavioral_notes as "behavioralNotes",
        image,
        is_active as "isActive",
        adoption_or_birthday as "adoptionOrBirthday",
        microchipped,
        spayed_neutered as "spayedNeutered",
        potty_trained as "pottyTrained",
        friendly_with_children as "friendlyWithChildren",
        friendly_with_dogs as "friendlyWithDogs",
        friendly_with_animals as "friendlyWithAnimals",
        vet_name as "vetName",
        vet_address as "vetAddress",
        vet_phone as "vetPhone",
        current_medications as "currentMedications",
        other_medical_info as "otherMedicalInfo",
        rabies_vaccination as "rabiesVaccination",
        flea_tick_prevention as "fleaTickPrevention",
        walking_behavior as "walkingBehavior",
        chip_number as "chipNumber",
        chip_brand as "chipBrand",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM pets 
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY created_at DESC
    `

    console.log(`✅ Found ${pets.length} pets for user ${userId}`)
    return NextResponse.json(pets)
  } catch (error) {
    console.error("❌ Database error in GET /api/pets:", error)

    // Always return valid JSON, even for errors
    return NextResponse.json(
      {
        error: "Failed to fetch pets",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = body.userId

    console.log("🐾 POST /api/pets - Adding new pet:", body)
    console.log("🐾 POST /api/pets - User ID:", userId)

    if (!userId) {
      console.error("❌ User ID is required")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Validate required fields
    if (!body.name || !body.type) {
      console.error("❌ Missing required fields")
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const [newPet] = await sql`
      INSERT INTO pets (
        id,
        user_id, 
        name, 
        type, 
        breed, 
        age, 
        weight, 
        gender,
        description, 
        medical_info, 
        allergies, 
        behavioral_notes, 
        image,
        adoption_or_birthday,
        microchipped,
        spayed_neutered,
        potty_trained,
        friendly_with_children,
        friendly_with_dogs,
        friendly_with_animals,
        vet_name,
        vet_address,
        vet_phone,
        current_medications,
        other_medical_info,
        rabies_vaccination,
        flea_tick_prevention,
        walking_behavior,
        chip_number,
        chip_brand,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid()::text,
        ${userId}, 
        ${body.name}, 
        ${body.type}, 
        ${body.breed || ""}, 
        ${Number.parseInt(body.age) || 0}, 
        ${Number.parseFloat(body.weight) || 0}, 
        ${body.gender || "unknown"},
        ${body.description || ""}, 
        ${body.medicalInfo || ""}, 
        ${body.allergies || ""}, 
        ${body.behavioralNotes || ""}, 
        ${body.image || "/placeholder.svg?height=200&width=200"},
        ${body.adoptionOrBirthday || null},
        ${body.microchipped || "not_sure"},
        ${body.spayedNeutered || "not_sure"},
        ${body.pottyTrained || "not_sure"},
        ${body.friendlyWithChildren || "not_sure"},
        ${body.friendlyWithDogs || "not_sure"},
        ${body.friendlyWithAnimals || "not_sure"},
        ${body.vetName || ""},
        ${body.vetAddress || ""},
        ${body.vetPhone || ""},
        ${body.currentMedications || ""},
        ${body.otherMedicalInfo || ""},
        ${body.rabiesVaccination || null},
        ${body.fleaTickPrevention || "not_sure"},
        ${body.walkingBehavior || null},
        ${body.chipNumber || ""},
        ${body.chipBrand || ""},
        true,
        NOW(),
        NOW()
      )
      RETURNING 
        id,
        user_id as "userId",
        name,
        type,
        breed,
        age,
        weight,
        gender,
        description,
        medical_info as "medicalInfo",
        allergies,
        behavioral_notes as "behavioralNotes",
        image,
        adoption_or_birthday as "adoptionOrBirthday",
        microchipped,
        spayed_neutered as "spayedNeutered",
        potty_trained as "pottyTrained",
        friendly_with_children as "friendlyWithChildren",
        friendly_with_dogs as "friendlyWithDogs",
        friendly_with_animals as "friendlyWithAnimals",
        vet_name as "vetName",
        vet_address as "vetAddress",
        vet_phone as "vetPhone",
        current_medications as "currentMedications",
        other_medical_info as "otherMedicalInfo",
        rabies_vaccination as "rabiesVaccination",
        flea_tick_prevention as "fleaTickPrevention",
        walking_behavior as "walkingBehavior",
        chip_number as "chipNumber",
        chip_brand as "chipBrand",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    console.log("✅ Pet added successfully:", newPet)
    return NextResponse.json(newPet, { status: 201 })
  } catch (error) {
    console.error("❌ Database error in POST /api/pets:", error)

    // Always return valid JSON, even for errors
    return NextResponse.json(
      {
        error: "Failed to create pet",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}
