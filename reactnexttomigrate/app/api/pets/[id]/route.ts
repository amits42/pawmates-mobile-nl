import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Initialize the SQL client
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log(`🐾 GET /api/pets/${id} - Fetching pet details`)

    // Get pet by ID with raw SQL
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
      FROM pets
      WHERE id = ${id}
    `

    if (pets.length === 0) {
      console.error("❌ Pet not found:", id)
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    console.log("✅ Pet found:", pets[0])
    return NextResponse.json(pets[0])
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json({ error: "Failed to fetch pet" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    console.log(`🐾 PUT /api/pets/${id} - Updating pet:`, body)

    // Update pet with raw SQL
    const updatedPets = await sql`
      UPDATE pets
      SET 
        name = ${body.name},
        type = ${body.type},
        breed = ${body.breed || ""},
        age = ${Number.parseInt(body.age) || 0},
        weight = ${Number.parseFloat(body.weight) || 0},
        gender = ${body.gender || "unknown"},
        description = ${body.description || ""},
        medical_info = ${body.medicalInfo || ""},
        allergies = ${body.allergies || ""},
        behavioral_notes = ${body.specialNeeds || body.behavioralNotes || ""},
        image = ${body.image || "/placeholder.svg?height=200&width=200"},
        adoption_or_birthday = ${body.adoptionOrBirthday || null},
        microchipped = ${body.microchipped || "not_sure"},
        spayed_neutered = ${body.spayedNeutered || "not_sure"},
        potty_trained = ${body.pottyTrained || "not_sure"},
        friendly_with_children = ${body.friendlyWithChildren || "not_sure"},
        friendly_with_dogs = ${body.friendlyWithDogs || "not_sure"},
        friendly_with_animals = ${body.friendlyWithAnimals || "not_sure"},
        vet_name = ${body.vetName || ""},
        vet_address = ${body.vetAddress || ""},
        vet_phone = ${body.vetPhone || ""},
        current_medications = ${body.currentMedications || ""},
        other_medical_info = ${body.otherMedicalInfo || ""},
        rabies_vaccination = ${body.rabiesVaccination || null},
        flea_tick_prevention = ${body.fleaTickPrevention || "not_sure"},
        walking_behavior = ${body.walkingBehavior || null},
        chip_number = ${body.chipNumber || ""},
        chip_brand = ${body.chipBrand || ""},
        updated_at = NOW()
      WHERE id = ${id}
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

    if (updatedPets.length === 0) {
      console.error("❌ Pet not found for update:", id)
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    console.log("✅ Pet updated successfully:", updatedPets[0])
    return NextResponse.json(updatedPets[0])
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json({ error: "Failed to update pet" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log(`🐾 DELETE /api/pets/${id} - Deleting pet`)

    // Soft delete by setting is_active to false
    await sql`
      UPDATE pets
      SET 
        is_active = false,
        updated_at = NOW()
      WHERE id = ${id}
    `

    console.log("✅ Pet deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json({ error: "Failed to delete pet" }, { status: 500 })
  }
}
