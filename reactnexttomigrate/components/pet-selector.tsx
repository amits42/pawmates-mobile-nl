"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PetImageUpload } from "@/components/pet-image-upload"
import { useState } from "react"
import { addPet, fetchUserPets } from "@/lib/api"
import { Plus, HeartPulse, AlertTriangle, Brain, Calendar, Stethoscope, Users, Dog, Heart } from "lucide-react"
import type { Pet } from "@/types/api"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet"

interface PetSelectorProps {
  pets: Pet[]
  selectedPetId: string | null
  onSelectPet: (id: string) => void
  onPetsUpdate?: (pets: Pet[]) => void
}

export function PetSelector({ pets, selectedPetId, onSelectPet, onPetsUpdate }: PetSelectorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newPet, setNewPet] = useState({
    name: "",
    type: "dog",
    breed: "",
    age: "",
    weight: "",
    gender: "unknown",
    behavioralNotes: "",
    image: "",
    adoptionOrBirthday: "",
    microchipped: "not_sure",
    chipNumber: "",
    chipBrand: "",
    spayedNeutered: "not_sure",
    pottyTrained: "not_sure",
    friendlyWithChildren: "not_sure",
    friendlyWithDogs: "not_sure",
    friendlyWithAnimals: "not_sure",
    walkingBehavior: "",
    vetName: "",
    vetAddress: "",
    vetPhone: "",
    currentMedications: "",
    otherMedicalInfo: "",
    rabiesVaccination: "",
    fleaTickPrevention: "not_sure",
  })

  const isFormValid = (pet: any) => {
    return (
      pet.name &&
      pet.breed &&
      pet.age &&
      pet.rabiesVaccination &&
      pet.vetName &&
      pet.vetAddress &&
      pet.vetPhone
    )
  }

  const hasIncompleteProfileFields = (pet: any) => {
    return !pet.name || !pet.breed || !pet.age
  }

  const hasIncompleteMedicalFields = (pet: any) => {
    return !pet.rabiesVaccination || !pet.vetName || !pet.vetAddress || !pet.vetPhone
  }

  const handleAddPet = async () => {
    if (loading) return

    if (!isFormValid(newPet)) {
      alert("Please complete all required fields (marked with *)")
      return
    }

    setLoading(true)
    try {
      console.log("🐾 Adding new pet from PetSelector:", newPet)

      const addedPet = await addPet({
        ...newPet,
        age: Number.parseInt(newPet.age) || 0,
        weight: Number.parseFloat(newPet.weight) || 0,
        userId: "user_1749099951828",
        isActive: true,
      })

      console.log("✅ Pet added successfully:", addedPet)

      if (onPetsUpdate) {
        const updatedPets = await fetchUserPets()
        onPetsUpdate(updatedPets)
      }

      onSelectPet(addedPet.id)

      setIsAddDialogOpen(false)
      setNewPet({
        name: "",
        type: "dog",
        breed: "",
        age: "",
        weight: "",
        gender: "unknown",
        behavioralNotes: "",
        image: "",
        adoptionOrBirthday: "",
        microchipped: "not_sure",
        chipNumber: "",
        chipBrand: "",
        spayedNeutered: "not_sure",
        pottyTrained: "not_sure",
        friendlyWithChildren: "not_sure",
        friendlyWithDogs: "not_sure",
        friendlyWithAnimals: "not_sure",
        walkingBehavior: "",
        vetName: "",
        vetAddress: "",
        vetPhone: "",
        currentMedications: "",
        otherMedicalInfo: "",
        rabiesVaccination: "",
        fleaTickPrevention: "not_sure",
      })
    } catch (error) {
      console.error("❌ Error adding pet:", error)
      alert("Failed to add pet. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleNewPetChange = (field: string, value: string) => {
    setNewPet((prev) => ({ ...prev, [field]: value }))
  }

  const getPetTypeEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case "dog":
        return "🐕"
      case "cat":
        return "🐱"
      case "bird":
        return "🐦"
      default:
        return "🐾"
    }
  }

  const renderPetForm = (pet: any) => (
    <Tabs defaultValue="profile" className="w-full pb-24">
      <TabsList className="grid grid-cols-3 mb-4 bg-zubo-background-100">
        <TabsTrigger
          value="profile"
          className="data-[state=active]:bg-zubo-background-50 data-[state=active]:text-zubo-primary-700 text-zubo-text-600 hover:text-zubo-primary-700"
        >
          Profile{hasIncompleteProfileFields(pet) && <span className="text-zubo-highlight-1-600 ml-1">*</span>}
        </TabsTrigger>
        <TabsTrigger
          value="training"
          className="data-[state=active]:bg-zubo-background-50 data-[state=active]:text-zubo-primary-700 text-zubo-text-600 hover:text-zubo-primary-700"
        >
          Training
        </TabsTrigger>
        <TabsTrigger
          value="medical"
          className="data-[state=active]:bg-zubo-background-50 data-[state=active]:text-zubo-primary-700 text-zubo-text-600 hover:text-zubo-primary-700"
        >
          Medical{hasIncompleteMedicalFields(pet) && <span className="text-zubo-highlight-1-600 ml-1">*</span>}
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-4">
        <PetImageUpload
          currentImage={pet.image}
          onImageChange={(imageUrl) => handleNewPetChange("image", imageUrl)}
          petName={pet.name}
        />

        <div className="space-y-2">
          <Label htmlFor="pet-name" className="text-sm font-medium text-zubo-text-700">
            Pet Name *
          </Label>
          <Input
            id="pet-name"
            value={pet.name}
            onChange={(e) => handleNewPetChange("name", e.target.value)}
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
            placeholder="Enter pet name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-breed" className="text-sm font-medium text-zubo-text-700">
            Breed *
          </Label>
          <Input
            id="pet-breed"
            value={pet.breed}
            onChange={(e) => handleNewPetChange("breed", e.target.value)}
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
            placeholder="Enter breed (e.g., Golden Retriever, Labrador)"
            list="breed-suggestions"
          />
          <datalist id="breed-suggestions">
            <option value="Golden Retriever" />
            <option value="Labrador Retriever" />
            <option value="German Shepherd" />
            <option value="Beagle" />
            <option value="Poodle" />
            <option value="Bulldog" />
            <option value="Rottweiler" />
            <option value="Yorkshire Terrier" />
            <option value="Boxer" />
            <option value="Dachshund" />
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-gender" className="text-sm font-medium text-zubo-text-700">
            Gender
          </Label>
          <Select value={pet.gender} onValueChange={(value) => handleNewPetChange("gender", value)}>
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="male" className="hover:bg-zubo-background-100">
                Male
              </SelectItem>
              <SelectItem value="female" className="hover:bg-zubo-background-100">
                Female
              </SelectItem>
              <SelectItem value="unknown" className="hover:bg-zubo-background-100">
                Unknown
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700">
            {pet.gender === "female" ? "Spayed" : "Neutered or Spayed"}
          </Label>
          <Select value={pet.spayedNeutered} onValueChange={(value) => handleNewPetChange("spayedNeutered", value)}>
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="yes" className="hover:bg-zubo-background-100">
                Yes
              </SelectItem>
              <SelectItem value="no" className="hover:bg-zubo-background-100">
                No
              </SelectItem>
              <SelectItem value="not_sure" className="hover:bg-zubo-background-100">
                Not Sure
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pet-age" className="text-sm font-medium text-zubo-text-700">
              Age (years) *
            </Label>
            <Input
              id="pet-age"
              value={pet.age}
              onChange={(e) => handleNewPetChange("age", e.target.value)}
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Age in years"
              type="number"
              min="0"
              step="0.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pet-weight" className="text-sm font-medium text-zubo-text-700">
              Weight (kg)
            </Label>
            <Input
              id="pet-weight"
              value={pet.weight}
              onChange={(e) => handleNewPetChange("weight", e.target.value)}
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Weight in kg"
              type="number"
              step="0.1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700">Microchipped</Label>
          <Select value={pet.microchipped} onValueChange={(value) => handleNewPetChange("microchipped", value)}>
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="yes" className="hover:bg-zubo-background-100">
                Yes
              </SelectItem>
              <SelectItem value="no" className="hover:bg-zubo-background-100">
                No
              </SelectItem>
              <SelectItem value="not_sure" className="hover:bg-zubo-background-100">
                Not Sure
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {pet.microchipped === "yes" && (
          <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-zubo-primary-200">
            <div className="space-y-2">
              <Label htmlFor="chip-number" className="text-sm font-medium text-zubo-text-700">
                Chip Number
              </Label>
              <Input
                id="chip-number"
                value={pet.chipNumber || ""}
                onChange={(e) => handleNewPetChange("chipNumber", e.target.value)}
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Microchip number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chip-brand" className="text-sm font-medium text-zubo-text-700">
                Chip Brand/Model
              </Label>
              <Input
                id="chip-brand"
                value={pet.chipBrand || ""}
                onChange={(e) => handleNewPetChange("chipBrand", e.target.value)}
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Brand or model"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="pet-birthday" className="text-sm font-medium text-zubo-text-700 flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-zubo-primary-600" />
            Birthday or Adoption Date
          </Label>
          <Input
            id="pet-birthday"
            type="date"
            value={pet.adoptionOrBirthday ? new Date(pet.adoptionOrBirthday).toISOString().slice(0, 10) : ""}
            onChange={(e) => handleNewPetChange("adoptionOrBirthday", e.target.value)}
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
          />
        </div>
      </TabsContent>

      {/* Training Tab */}
      <TabsContent value="training" className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700">Potty Trained</Label>
          <Select value={pet.pottyTrained} onValueChange={(value) => handleNewPetChange("pottyTrained", value)}>
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="yes" className="hover:bg-zubo-background-100">
                Yes
              </SelectItem>
              <SelectItem value="no" className="hover:bg-zubo-background-100">
                No
              </SelectItem>
              <SelectItem value="not_sure" className="hover:bg-zubo-background-100">
                Not Sure
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700 flex items-center">
            <Users className="h-4 w-4 mr-1 text-zubo-accent-600" />
            Friendly with Children
          </Label>
          <Select
            value={pet.friendlyWithChildren}
            onValueChange={(value) => handleNewPetChange("friendlyWithChildren", value)}
          >
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="yes" className="hover:bg-zubo-background-100">
                Yes
              </SelectItem>
              <SelectItem value="no" className="hover:bg-zubo-background-100">
                No
              </SelectItem>
              <SelectItem value="not_sure" className="hover:bg-zubo-background-100">
                Not Sure
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700 flex items-center">
            <Dog className="h-4 w-4 mr-1 text-zubo-primary-600" />
            Friendly with Other Dogs
          </Label>
          <Select value={pet.friendlyWithDogs} onValueChange={(value) => handleNewPetChange("friendlyWithDogs", value)}>
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="yes" className="hover:bg-zubo-background-100">
                Yes
              </SelectItem>
              <SelectItem value="no" className="hover:bg-zubo-background-100">
                No
              </SelectItem>
              <SelectItem value="not_sure" className="hover:bg-zubo-background-100">
                Not Sure
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700 flex items-center">
            <Heart className="h-4 w-4 mr-1 text-zubo-highlight-2-600" />
            Friendly with Other Animals
          </Label>
          <Select
            value={pet.friendlyWithAnimals}
            onValueChange={(value) => handleNewPetChange("friendlyWithAnimals", value)}
          >
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="yes" className="hover:bg-zubo-background-100">
                Yes
              </SelectItem>
              <SelectItem value="no" className="hover:bg-zubo-background-100">
                No
              </SelectItem>
              <SelectItem value="not_sure" className="hover:bg-zubo-background-100">
                Not Sure
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700">Walking Behavior</Label>
          <Select
            value={pet.walkingBehavior || ""}
            onValueChange={(value) => handleNewPetChange("walkingBehavior", value)}
          >
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue placeholder="Select walking behavior" />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="pulls_hard" className="hover:bg-zubo-background-100">
                Pulls Hard
              </SelectItem>
              <SelectItem value="moderate" className="hover:bg-zubo-background-100">
                Moderate
              </SelectItem>
              <SelectItem value="loose_leash" className="hover:bg-zubo-background-100">
                Loose Leash
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-behavior" className="text-sm font-medium text-zubo-text-700 flex items-center">
            <Brain className="h-4 w-4 mr-1 text-zubo-primary-600" />
            Behavioral Notes
          </Label>
          <Textarea
            id="pet-behavior"
            value={pet.behavioralNotes || ""}
            onChange={(e) => handleNewPetChange("behavioralNotes", e.target.value)}
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[100px]"
            placeholder="Temperament, training level, special behaviors, likes/dislikes, etc."
          />
        </div>
      </TabsContent>

      {/* Medical Tab */}
      <TabsContent value="medical" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pet-medications" className="text-sm font-medium text-zubo-text-700 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 text-zubo-highlight-2-600" />
            Current Medications
          </Label>
          <Textarea
            id="pet-medications"
            value={pet.currentMedications || ""}
            onChange={(e) => handleNewPetChange("currentMedications", e.target.value)}
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[100px]"
            placeholder="Name, dosage, frequency (e.g., Heartgard Plus, 1 tablet, monthly)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-other-medical" className="text-sm font-medium text-zubo-text-700 flex items-center">
            <HeartPulse className="h-4 w-4 mr-1 text-zubo-highlight-1-600" />
            Medical Conditions or Allergies
          </Label>
          <Textarea
            id="pet-other-medical"
            value={pet.otherMedicalInfo || ""}
            onChange={(e) => handleNewPetChange("otherMedicalInfo", e.target.value)}
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[120px]"
            placeholder="Condition name, severity, other related info (e.g., Arthritis - mild, requires joint supplements)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-rabies" className="text-sm font-medium text-zubo-text-700 flex items-center">
            <HeartPulse className="h-4 w-4 mr-1 text-zubo-highlight-1-600" />
            Rabies Vaccination *
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="rabies-has-date"
                name="rabies-option"
                checked={pet.rabiesVaccination !== "not_sure"}
                onChange={() => {
                  const newValue = ""
                  handleNewPetChange("rabiesVaccination", newValue)
                }}
                className="h-4 w-4 text-zubo-primary-600 focus:ring-zubo-primary-500 border-zubo-background-300"
              />
              <Label htmlFor="rabies-has-date" className="text-sm font-normal text-zubo-text-700 cursor-pointer">
                I have the vaccination date
              </Label>
            </div>
            {pet.rabiesVaccination !== "not_sure" && (
              <Input
                id="pet-rabies"
                type="date"
                value={
                  pet.rabiesVaccination && pet.rabiesVaccination !== "not_sure"
                    ? new Date(pet.rabiesVaccination).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) => handleNewPetChange("rabiesVaccination", e.target.value)}
                className="ml-6 border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              />
            )}
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="rabies-not-sure"
                name="rabies-option"
                checked={pet.rabiesVaccination === "not_sure"}
                onChange={() => {
                  const newValue = "not_sure"
                  handleNewPetChange("rabiesVaccination", newValue)
                }}
                className="h-4 w-4 text-zubo-primary-600 focus:ring-zubo-primary-500 border-zubo-background-300"
              />
              <Label htmlFor="rabies-not-sure" className="text-sm font-normal text-zubo-text-700 cursor-pointer">
                Not sure
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700">Flea/Tick Prevention</Label>
          <Select
            value={pet.fleaTickPrevention || "not_sure"}
            onValueChange={(value) => handleNewPetChange("fleaTickPrevention", value)}
          >
            <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200">
              <SelectItem value="yes" className="hover:bg-zubo-background-100">
                Yes
              </SelectItem>
              <SelectItem value="no" className="hover:bg-zubo-background-100">
                No
              </SelectItem>
              <SelectItem value="not_sure" className="hover:bg-zubo-background-100">
                Not Sure
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 pt-6 border-t border-zubo-background-200">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zubo-text-800 flex items-center">
              <Stethoscope className="h-4 w-4 mr-2 text-zubo-primary-600" />
              Vet Information *
            </h3>
            <p className="text-xs text-zubo-text-600 mt-1">Please provide your veterinarian's contact details</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vet-name" className="text-sm font-medium text-zubo-text-700">
                Doctor's Name *
              </Label>
              <Input
                id="vet-name"
                value={pet.vetName || ""}
                onChange={(e) => handleNewPetChange("vetName", e.target.value)}
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Veterinarian's name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vet-address" className="text-sm font-medium text-zubo-text-700">
                Clinic Address *
              </Label>
              <Textarea
                id="vet-address"
                value={pet.vetAddress || ""}
                onChange={(e) => handleNewPetChange("vetAddress", e.target.value)}
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[80px]"
                placeholder="Veterinary clinic address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vet-phone" className="text-sm font-medium text-zubo-text-700">
                Clinic Phone Number *
              </Label>
              <Input
                id="vet-phone"
                value={pet.vetPhone || ""}
                onChange={(e) => handleNewPetChange("vetPhone", e.target.value)}
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Veterinary clinic phone number"
                type="tel"
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )

  return (
    <div className="space-y-4">
      {pets.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-zubo-text-neutral-600 font-medium mb-2">No pets added yet</p>
          <p className="text-zubo-text-neutral-500 text-sm mb-4">Add your first pet to get started</p>

          <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <SheetTrigger asChild>
              <Button className="bg-zubo-primary hover:bg-zubo-primary-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Pet
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-screen h-full overflow-y-auto bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200 rounded-t-2xl"
            >
              <SheetHeader>
                <SheetTitle className="text-zubo-text-900">Add New Pet</SheetTitle>
                <SheetDescription className="text-zubo-text-600">Enter your pet's information below.</SheetDescription>
              </SheetHeader>
              {renderPetForm(newPet)}
              <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-zubo-background-50 border-t border-zubo-background-200 flex gap-2">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={loading}
                    className="flex-1 border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-100 bg-transparent"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  onClick={handleAddPet}
                  disabled={loading || !isFormValid(newPet)}
                  className="flex-1 bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Pet"}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pets.map((pet) => (
            <Card
              key={pet.id}
              className={`cursor-pointer transition-all border-zubo-text-neutral-200 hover:border-zubo-primary-300 ${selectedPetId === pet.id ? "ring-2 ring-zubo-primary-500 border-zubo-primary-500" : ""
                }`}
              onClick={() => onSelectPet(pet.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    {pet.image ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-zubo-text-neutral-200 bg-white relative">
                        <img
                          src={pet.image || "/placeholder.svg"}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl">${getPetTypeEmoji(pet.type)}</div>`
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border-2 border-zubo-text-neutral-200 bg-white flex items-center justify-center text-2xl">
                        {getPetTypeEmoji(pet.type)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-zubo-text-neutral-800 truncate">{pet.name}</h4>
                    <p className="text-sm text-zubo-text-neutral-600">
                      {pet.type} • {pet.breed || "Mixed"}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-zubo-text-neutral-500">
                      <span>Age: {pet.age || "Unknown"}</span>
                      <span>Weight: {pet.weight || "Unknown"} kg</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Card
              className="cursor-pointer border-dashed border-zubo-text-neutral-300 hover:border-zubo-primary-300 transition-colors"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="rounded-full w-10 h-10 bg-zubo-background-100 flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5 text-zubo-text-neutral-600" />
                </div>
                <p className="font-medium text-zubo-text-neutral-700 text-sm">Add New Pet</p>
              </CardContent>
            </Card>

            <SheetContent
              side="bottom"
              className="max-h-screen h-full overflow-y-auto bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200 rounded-t-2xl"
            >
              <SheetHeader>
                <SheetTitle className="text-zubo-text-900">Add New Pet</SheetTitle>
                <SheetDescription className="text-zubo-text-600">Enter your pet's information below.</SheetDescription>
              </SheetHeader>
              {renderPetForm(newPet)}
              <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-zubo-background-50 border-t border-zubo-background-200 flex gap-2">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={loading}
                    className="flex-1 border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-100 bg-transparent"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  onClick={handleAddPet}
                  disabled={loading || !isFormValid(newPet)}
                  className="flex-1 bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Pet"}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  )
}
