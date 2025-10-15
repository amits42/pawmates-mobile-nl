"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PetImageUpload } from "@/components/pet-image-upload"
import { addPet, updatePet, deletePet } from "@/lib/api"
import {
  Plus,
  Edit,
  Trash2,
  PawPrint,
  HeartPulse,
  AlertTriangle,
  Brain,
  Calendar,
  Stethoscope,
  Users,
  Dog,
  Heart,
} from "lucide-react"
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

interface PetListProps {
  pets?: Pet[]
  onPetAdded?: (pet: Pet) => void
  onPetUpdated?: (pet: Pet) => void
  onPetDeleted?: (petId: string) => void
}

export function PetList({ pets: initialPets = [], onPetAdded, onPetUpdated, onPetDeleted }: PetListProps) {
  const [pets, setPets] = useState<Pet[]>(Array.isArray(initialPets) ? initialPets : [])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentPet, setCurrentPet] = useState<Pet | null>(null)
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

  // Sync with parent pets prop
  useEffect(() => {
    console.log("🔄 PetList: Syncing with parent pets:", initialPets)
    setPets(Array.isArray(initialPets) ? initialPets : [])
  }, [initialPets])

  const handleAddPet = async () => {
    if (!newPet.name.trim()) {
      alert("Please enter a pet name")
      return
    }

    setLoading(true)
    try {
      console.log("🐾 Adding new pet:", newPet)
      const addedPet = await addPet(newPet)
      console.log("✅ Pet added successfully:", addedPet)

      // Update local state immediately
      setPets((prevPets) => [addedPet, ...prevPets])

      // Call parent callback if provided
      if (onPetAdded) {
        console.log("📞 Calling parent onPetAdded callback")
        onPetAdded(addedPet)
      }

      // Close dialog and reset form
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

  const handleUpdatePet = async () => {
    if (!currentPet) return

    setLoading(true)
    try {
      console.log("📝 Updating pet:", currentPet)
      const updatedPet = await updatePet(currentPet)
      console.log("✅ Pet updated successfully:", updatedPet)

      // Update local state immediately
      setPets((prevPets) => prevPets.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)))

      // Call parent callback if provided
      if (onPetUpdated) {
        console.log("📞 Calling parent onPetUpdated callback")
        onPetUpdated(updatedPet)
      }

      setIsEditDialogOpen(false)
      setCurrentPet(null)
    } catch (error) {
      console.error("❌ Error updating pet:", error)
      alert("Failed to update pet. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePet = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pet?")) {
      return
    }

    setLoading(true)
    try {
      console.log("🗑️ Deleting pet:", id)
      await deletePet(id)
      console.log("✅ Pet deleted successfully")

      // Update local state immediately
      setPets((prevPets) => prevPets.filter((pet) => pet.id !== id))

      // Call parent callback if provided
      if (onPetDeleted) {
        console.log("📞 Calling parent onPetDeleted callback")
        onPetDeleted(id)
      }
    } catch (error) {
      console.error("❌ Error deleting pet:", error)
      alert("Failed to delete pet. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleNewPetChange = (field: string, value: string) => {
    console.log(`🔄 New pet field changed: ${field} = ${value}`)
    setNewPet((prev) => ({ ...prev, [field]: value }))
  }

  const handleCurrentPetChange = (field: string, value: string) => {
    if (!currentPet) return
    console.log(`🔄 Current pet field changed: ${field} = ${value}`)
    setCurrentPet((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const openEditDialog = (pet: Pet) => {
    console.log("✏️ Opening edit dialog for pet:", pet)
    setCurrentPet(pet)
    setIsEditDialogOpen(true)
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

  const formatYesNoNotSure = (value?: string) => {
    switch (value) {
      case "yes":
        return "Yes"
      case "no":
        return "No"
      case "not_sure":
      default:
        return "Not Sure"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "Invalid date"
    }
  }

  const safePets = pets || []

  console.log("🐾 PetList render:", {
    petsCount: safePets.length,
    isAddDialogOpen,
    isEditDialogOpen,
    loading,
    pets: safePets.map((p) => ({
      id: p.id,
      name: p.name,
      hasImage: !!p.image,
      otherMedicalInfo: !!p.otherMedicalInfo,
      behavioralNotes: !!p.behavioralNotes,
    })),
  })

  const hasIncompleteProfileFields = (pet: any) => {
    return !pet.name || !pet.breed || !pet.age
  }

  const hasIncompleteMedicalFields = (pet: any) => {
    return !pet.rabiesVaccination || !pet.vetName || !pet.vetAddress || !pet.vetPhone
  }

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

  const renderPetForm = (pet: any, isEdit = false) => (
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

      <TabsContent value="profile" className="space-y-4">
        <PetImageUpload
          currentImage={pet.image}
          onImageChange={(imageUrl) =>
            isEdit ? handleCurrentPetChange("image", imageUrl) : handleNewPetChange("image", imageUrl)
          }
          petName={pet.name}
        />

        <div className="space-y-2">
          <Label htmlFor={`pet-name-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-zubo-text-700">
            Pet Name *
          </Label>
          <Input
            id={`pet-name-${isEdit ? "edit" : "add"}`}
            value={pet.name}
            onChange={(e) =>
              isEdit ? handleCurrentPetChange("name", e.target.value) : handleNewPetChange("name", e.target.value)
            }
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
            placeholder="Enter pet name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`pet-breed-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-zubo-text-700">
            Breed *
          </Label>
          <Input
            id={`pet-breed-${isEdit ? "edit" : "add"}`}
            value={pet.breed}
            onChange={(e) =>
              isEdit ? handleCurrentPetChange("breed", e.target.value) : handleNewPetChange("breed", e.target.value)
            }
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
          <Label htmlFor={`pet-gender-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-zubo-text-700">
            Gender
          </Label>
          <Select
            value={pet.gender}
            onValueChange={(value) =>
              isEdit ? handleCurrentPetChange("gender", value) : handleNewPetChange("gender", value)
            }
          >
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
          <Select
            value={pet.spayedNeutered}
            onValueChange={(value) =>
              isEdit ? handleCurrentPetChange("spayedNeutered", value) : handleNewPetChange("spayedNeutered", value)
            }
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`pet-age-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-zubo-text-700">
              Age (years) *
            </Label>
            <Input
              id={`pet-age-${isEdit ? "edit" : "add"}`}
              value={pet.age}
              onChange={(e) =>
                isEdit ? handleCurrentPetChange("age", e.target.value) : handleNewPetChange("age", e.target.value)
              }
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Age in years"
              type="number"
              min="0"
              step="0.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`pet-weight-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-zubo-text-700">
              Weight (kg)
            </Label>
            <Input
              id={`pet-weight-${isEdit ? "edit" : "add"}`}
              value={pet.weight}
              onChange={(e) =>
                isEdit ? handleCurrentPetChange("weight", e.target.value) : handleNewPetChange("weight", e.target.value)
              }
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="Weight in kg"
              type="number"
              step="0.1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700">Microchipped</Label>
          <Select
            value={pet.microchipped}
            onValueChange={(value) =>
              isEdit ? handleCurrentPetChange("microchipped", value) : handleNewPetChange("microchipped", value)
            }
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

        {pet.microchipped === "yes" && (
          <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-zubo-primary-200">
            <div className="space-y-2">
              <Label
                htmlFor={`chip-number-${isEdit ? "edit" : "add"}`}
                className="text-sm font-medium text-zubo-text-700"
              >
                Chip Number
              </Label>
              <Input
                id={`chip-number-${isEdit ? "edit" : "add"}`}
                value={pet.chipNumber || ""}
                onChange={(e) =>
                  isEdit
                    ? handleCurrentPetChange("chipNumber", e.target.value)
                    : handleNewPetChange("chipNumber", e.target.value)
                }
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Microchip number"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={`chip-brand-${isEdit ? "edit" : "add"}`}
                className="text-sm font-medium text-zubo-text-700"
              >
                Chip Brand/Model
              </Label>
              <Input
                id={`chip-brand-${isEdit ? "edit" : "add"}`}
                value={pet.chipBrand || ""}
                onChange={(e) =>
                  isEdit
                    ? handleCurrentPetChange("chipBrand", e.target.value)
                    : handleNewPetChange("chipBrand", e.target.value)
                }
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Brand or model"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label
            htmlFor={`pet-birthday-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-zubo-text-700 flex items-center"
          >
            <Calendar className="h-4 w-4 mr-1 text-zubo-primary-600" />
            Birthday or Adoption Date
          </Label>
          <Input
            id={`pet-birthday-${isEdit ? "edit" : "add"}`}
            type="date"
            value={pet.adoptionOrBirthday ? new Date(pet.adoptionOrBirthday).toISOString().slice(0, 10) : ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("adoptionOrBirthday", e.target.value)
                : handleNewPetChange("adoptionOrBirthday", e.target.value)
            }
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
          />
        </div>
      </TabsContent>

      <TabsContent value="training" className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700">Potty Trained</Label>
          <Select
            value={pet.pottyTrained}
            onValueChange={(value) =>
              isEdit ? handleCurrentPetChange("pottyTrained", value) : handleNewPetChange("pottyTrained", value)
            }
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
            <Users className="h-4 w-4 mr-1 text-zubo-accent-600" />
            Friendly with Children
          </Label>
          <Select
            value={pet.friendlyWithChildren}
            onValueChange={(value) =>
              isEdit
                ? handleCurrentPetChange("friendlyWithChildren", value)
                : handleNewPetChange("friendlyWithChildren", value)
            }
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
          <Select
            value={pet.friendlyWithDogs}
            onValueChange={(value) =>
              isEdit ? handleCurrentPetChange("friendlyWithDogs", value) : handleNewPetChange("friendlyWithDogs", value)
            }
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
            <Heart className="h-4 w-4 mr-1 text-zubo-highlight-2-600" />
            Friendly with Other Animals
          </Label>
          <Select
            value={pet.friendlyWithAnimals}
            onValueChange={(value) =>
              isEdit
                ? handleCurrentPetChange("friendlyWithAnimals", value)
                : handleNewPetChange("friendlyWithAnimals", value)
            }
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
            onValueChange={(value) =>
              isEdit ? handleCurrentPetChange("walkingBehavior", value) : handleNewPetChange("walkingBehavior", value)
            }
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
          <Label
            htmlFor={`pet-behavior-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-zubo-text-700 flex items-center"
          >
            <Brain className="h-4 w-4 mr-1 text-zubo-primary-600" />
            Behavioral Notes
          </Label>
          <Textarea
            id={`pet-behavior-${isEdit ? "edit" : "add"}`}
            value={pet.behavioralNotes || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("behavioralNotes", e.target.value)
                : handleNewPetChange("behavioralNotes", e.target.value)
            }
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[100px]"
            placeholder="Temperament, training level, special behaviors, likes/dislikes, etc."
          />
        </div>
      </TabsContent>

      <TabsContent value="medical" className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor={`pet-medications-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-zubo-text-700 flex items-center"
          >
            <AlertTriangle className="h-4 w-4 mr-1 text-zubo-highlight-2-600" />
            Current Medications
          </Label>
          <Textarea
            id={`pet-medications-${isEdit ? "edit" : "add"}`}
            value={pet.currentMedications || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("currentMedications", e.target.value)
                : handleNewPetChange("currentMedications", e.target.value)
            }
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[100px]"
            placeholder="Name, dosage, frequency (e.g., Heartgard Plus, 1 tablet, monthly)"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`pet-other-medical-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-zubo-text-700 flex items-center"
          >
            <HeartPulse className="h-4 w-4 mr-1 text-zubo-highlight-1-600" />
            Medical Conditions or Allergies
          </Label>
          <Textarea
            id={`pet-other-medical-${isEdit ? "edit" : "add"}`}
            value={pet.otherMedicalInfo || ""}
            onChange={(e) =>
              isEdit
                ? handleCurrentPetChange("otherMedicalInfo", e.target.value)
                : handleNewPetChange("otherMedicalInfo", e.target.value)
            }
            className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[120px]"
            placeholder="Condition name, severity, other related info (e.g., Arthritis - mild, requires joint supplements)"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`pet-rabies-${isEdit ? "edit" : "add"}`}
            className="text-sm font-medium text-zubo-text-700 flex items-center"
          >
            <HeartPulse className="h-4 w-4 mr-1 text-zubo-highlight-1-600" />
            Rabies Vaccination *
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`rabies-has-date-${isEdit ? "edit" : "add"}`}
                name={`rabies-option-${isEdit ? "edit" : "add"}`}
                checked={pet.rabiesVaccination !== "not_sure"}
                onChange={() => {
                  const newValue = ""
                  isEdit
                    ? handleCurrentPetChange("rabiesVaccination", newValue)
                    : handleNewPetChange("rabiesVaccination", newValue)
                }}
                className="h-4 w-4 text-zubo-primary-600 focus:ring-zubo-primary-500 border-zubo-background-300"
              />
              <Label
                htmlFor={`rabies-has-date-${isEdit ? "edit" : "add"}`}
                className="text-sm font-normal text-zubo-text-700 cursor-pointer"
              >
                I have the vaccination date
              </Label>
            </div>
            {pet.rabiesVaccination !== "not_sure" && (
              <Input
                id={`pet-rabies-${isEdit ? "edit" : "add"}`}
                type="date"
                value={
                  pet.rabiesVaccination && pet.rabiesVaccination !== "not_sure"
                    ? new Date(pet.rabiesVaccination).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) =>
                  isEdit
                    ? handleCurrentPetChange("rabiesVaccination", e.target.value)
                    : handleNewPetChange("rabiesVaccination", e.target.value)
                }
                className="ml-6 border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              />
            )}
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`rabies-not-sure-${isEdit ? "edit" : "add"}`}
                name={`rabies-option-${isEdit ? "edit" : "add"}`}
                checked={pet.rabiesVaccination === "not_sure"}
                onChange={() => {
                  const newValue = "not_sure"
                  isEdit
                    ? handleCurrentPetChange("rabiesVaccination", newValue)
                    : handleNewPetChange("rabiesVaccination", newValue)
                }}
                className="h-4 w-4 text-zubo-primary-600 focus:ring-zubo-primary-500 border-zubo-background-300"
              />
              <Label
                htmlFor={`rabies-not-sure-${isEdit ? "edit" : "add"}`}
                className="text-sm font-normal text-zubo-text-700 cursor-pointer"
              >
                Not sure
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-zubo-text-700">Flea/Tick Prevention</Label>
          <Select
            value={pet.fleaTickPrevention || "not_sure"}
            onValueChange={(value) =>
              isEdit
                ? handleCurrentPetChange("fleaTickPrevention", value)
                : handleNewPetChange("fleaTickPrevention", value)
            }
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
              <Label htmlFor={`vet-name-${isEdit ? "edit" : "add"}`} className="text-sm font-medium text-zubo-text-700">
                Doctor's Name *
              </Label>
              <Input
                id={`vet-name-${isEdit ? "edit" : "add"}`}
                value={pet.vetName || ""}
                onChange={(e) =>
                  isEdit
                    ? handleCurrentPetChange("vetName", e.target.value)
                    : handleNewPetChange("vetName", e.target.value)
                }
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                placeholder="Veterinarian's name"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`vet-address-${isEdit ? "edit" : "add"}`}
                className="text-sm font-medium text-zubo-text-700"
              >
                Clinic Address *
              </Label>
              <Textarea
                id={`vet-address-${isEdit ? "edit" : "add"}`}
                value={pet.vetAddress || ""}
                onChange={(e) =>
                  isEdit
                    ? handleCurrentPetChange("vetAddress", e.target.value)
                    : handleNewPetChange("vetAddress", e.target.value)
                }
                className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[80px]"
                placeholder="Veterinary clinic address"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`vet-phone-${isEdit ? "edit" : "add"}`}
                className="text-sm font-medium text-zubo-text-700"
              >
                Clinic Phone Number *
              </Label>
              <Input
                id={`vet-phone-${isEdit ? "edit" : "add"}`}
                value={pet.vetPhone || ""}
                onChange={(e) =>
                  isEdit
                    ? handleCurrentPetChange("vetPhone", e.target.value)
                    : handleNewPetChange("vetPhone", e.target.value)
                }
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
    <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-zubo-text-800 text-lg">
          <PawPrint className="mr-2 h-5 w-5 text-zubo-primary-600" />
          My Pets
          {safePets.length > 0 && (
            <span className="ml-2 text-sm bg-zubo-primary-100 text-zubo-primary-700 px-2 py-1 rounded-full">
              {safePets.length}
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-zubo-text-600 text-sm">Manage your pets' information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {safePets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3 text-zubo-text-400">🐾</div>
            <p className="text-zubo-text-600 font-medium">No pets added yet</p>
            <p className="text-zubo-text-500 text-sm mt-1">Add your first pet to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safePets.map((pet) => (
              <Card key={pet.id} className="border-zubo-background-200 bg-zubo-background-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Pet Image or Emoji */}
                      <div className="relative">
                        {pet.image ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-zubo-primary-200 bg-zubo-background-50 relative">
                            <img
                              src={pet.image || "/placeholder.svg"}
                              alt={pet.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error("❌ Error loading pet image:", pet.image)
                                // Fallback to emoji if image fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = "none"
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl text-zubo-primary-600">${getPetTypeEmoji(pet.type)}</div>`
                                }
                              }}
                            />
                            {/* Small type icon overlay */}
                            {/* <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-zubo-background-50 rounded-full border border-zubo-background-200 flex items-center justify-center text-xs shadow-sm text-zubo-primary-600">
                              {getPetTypeEmoji(pet.type)}
                            </div> */}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border-2 border-zubo-primary-200 bg-zubo-background-50 flex items-center justify-center text-2xl text-zubo-primary-600">
                            {getPetTypeEmoji(pet.type)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-zubo-text-800 truncate">{pet.name || "Unnamed Pet"}</h4>
                        <p className="text-sm text-zubo-text-600">
                          {pet.type} • {pet.breed || "Mixed"} • {pet.gender || "Unknown"}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-zubo-text-500">
                          <span>Age: {pet.age || "Unknown"}</span>
                          <span>Weight: {pet.weight || "Unknown"} kg</span>
                          {pet.adoptionOrBirthday && <span>Birthday: {formatDate(pet.adoptionOrBirthday)}</span>}
                        </div>
                        {pet.description && (
                          <p className="text-xs text-zubo-text-600 mt-2 line-clamp-2">{pet.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pet.otherMedicalInfo && pet.otherMedicalInfo.trim() && (
                            <span className="text-xs bg-zubo-highlight-1-50 text-zubo-highlight-1-700 px-2 py-0.5 rounded-full flex items-center">
                              <HeartPulse className="h-3 w-3 mr-1" />
                              Medical
                            </span>
                          )}
                          {pet.currentMedications && pet.currentMedications.trim() && (
                            <span className="text-xs bg-zubo-highlight-2-50 text-zubo-highlight-2-700 px-2 py-0.5 rounded-full flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Medications
                            </span>
                          )}
                          {pet.behavioralNotes && pet.behavioralNotes.trim() && (
                            <span className="text-xs bg-zubo-primary-50 text-zubo-primary-700 px-2 py-0.5 rounded-full flex items-center">
                              <Brain className="h-3 w-3 mr-1" />
                              Behavior
                            </span>
                          )}
                          {pet.vetName && pet.vetName.trim() && (
                            <span className="text-xs bg-zubo-accent-50 text-zubo-accent-700 px-2 py-0.5 rounded-full flex items-center">
                              <Stethoscope className="h-3 w-3 mr-1" />
                              Vet Info
                            </span>
                          )}
                        </div>

                        {/* Enhanced Profile Info */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-zubo-text-600">
                          <div>Microchipped: {formatYesNoNotSure(pet.microchipped)}</div>
                          <div>
                            {pet.gender === "female" ? "Spayed" : "Neutered"}: {formatYesNoNotSure(pet.spayedNeutered)}
                          </div>
                          <div>Potty Trained: {formatYesNoNotSure(pet.pottyTrained)}</div>
                          <div>Child Friendly: {formatYesNoNotSure(pet.friendlyWithChildren)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(pet)}
                        className="h-8 w-8 p-0 hover:bg-zubo-primary-50 hover:text-zubo-primary-700"
                        disabled={loading}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePet(pet.id)}
                        className="h-8 w-8 p-0 hover:bg-zubo-highlight-1-50 hover:text-zubo-highlight-1-700"
                        disabled={loading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        {/* Add Pet Sheet (replaces Dialog) */}
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetTrigger asChild>
            <Button
              className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50"
              onClick={() => {
                console.log("🐾 Add Pet button clicked!")
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Pet
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
            {renderPetForm(newPet, false)}
            <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-zubo-background-50 border-t border-zubo-background-200 flex gap-2">
              <SheetClose asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("🐾 Cancel button clicked")
                    setIsAddDialogOpen(false)
                  }}
                  disabled={loading}
                  className="flex-1 border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-100 bg-transparent"
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button
                onClick={() => {
                  console.log("🐾 Add Pet submit button clicked")
                  handleAddPet()
                }}
                disabled={loading || !isFormValid(newPet)}
                className="flex-1 bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add Pet"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Edit Pet Sheet (replaces Dialog) */}
        <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <SheetContent
            side="bottom"
            className="max-h-screen h-full overflow-y-auto bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200 rounded-t-2xl"
          >
            <SheetHeader>
              <SheetTitle className="text-zubo-text-900">Edit Pet</SheetTitle>
              <SheetDescription className="text-zubo-text-600">Update your pet's information.</SheetDescription>
            </SheetHeader>
            {currentPet && renderPetForm(currentPet, true)}
            <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-zubo-background-50 border-t border-zubo-background-200 flex gap-2">
              <SheetClose asChild>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={loading}
                  className="flex-1 border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-100 bg-transparent"
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button
                onClick={handleUpdatePet}
                disabled={loading || !isFormValid(currentPet || {})}
                className="flex-1 bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardFooter>
    </Card>
  )
}

export default PetList
