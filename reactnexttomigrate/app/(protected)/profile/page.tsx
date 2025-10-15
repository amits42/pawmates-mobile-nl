"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchUserProfile, updateUserProfile, fetchUserPets } from "@/lib/api"
import PetList from "@/components/pet-list"
import { AddressForm } from "@/components/address-form"
import { User, PawPrint, MapPin, CheckCircle, Save, XCircle, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import type { UserProfile, Pet } from "@/types/api"
import { useAuth } from "@/contexts/auth-context"

type MobileView = "menu" | "personal" | "pets" | "address"


export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  // Default to "menu" for mobile, but "personal" for desktop
  const [mobileView, setMobileView] = useState<MobileView>(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      return "personal"
    }
    return "menu"
  })
  const { logout } = useAuth()

  // Keep mobileView in sync with screen size changes (optional, for SPA navigation)
  useEffect(() => {
    const handleResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setMobileView("personal")
      } else {
        setMobileView((prev) => (prev === "personal" ? "menu" : prev))
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const loadPets = async () => {
    try {
      console.log("🐾 Loading pets...")
      const petsData = await fetchUserPets()
      console.log("✅ Pets loaded:", petsData)
      setPets(petsData)
    } catch (error) {
      console.error("❌ Error loading pets:", error)
    }
  }

  useEffect(() => {
    const loadProfileAndPets = async () => {
      try {
        setError(null)
        console.log("🔍 Loading profile...")
        const data = await fetchUserProfile()
        console.log("✅ Profile loaded:", data)
        setProfile(data)

        await loadPets()
      } catch (error) {
        console.error("❌ Error loading profile:", error)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfileAndPets()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      console.log("📝 Updating profile with:", {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      })

      const updatedProfile = await updateUserProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      })

      setProfile({ ...profile, ...updatedProfile })
      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("❌ Error updating profile:", error)
      setError("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return
    const { name, value } = e.target
    console.log(`🔄 Input changed: ${name} = ${value}`)
    setProfile({ ...profile, [name]: value })
  }

  const handlePetAdded = async (newPet: Pet) => {
    console.log("🐾 Pet added, refreshing pets list:", newPet)
    await loadPets()
    setSuccessMessage("Pet added successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handlePetUpdated = async (updatedPet: Pet) => {
    console.log("🐾 Pet updated, refreshing pets list:", updatedPet)
    await loadPets()
    setSuccessMessage("Pet updated successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handlePetDeleted = async (petId: string) => {
    console.log("🐾 Pet deleted, refreshing pets list:", petId)
    await loadPets()
    setSuccessMessage("Pet deleted successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleLogout = () => {
    console.log("🚪 Logout clicked from profile")
    logout()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] bg-zubo-background-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zubo-primary-600"></div>
        <p className="mt-4 text-zubo-text-600">Loading profile...</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] bg-zubo-background-100 p-4">
        <Card className="w-full max-w-md border-zubo-highlight-1-200 bg-zubo-highlight-1-50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-zubo-highlight-1-800 text-lg">
              <XCircle className="mr-2 h-5 w-5 text-zubo-highlight-1-600" />
              Error Loading Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-zubo-highlight-1-600">
            <p>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 border-zubo-primary-500 text-zubo-primary-700 hover:bg-zubo-primary-50 bg-transparent"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const petCount = pets.length

  const menuItems = [
    {
      id: "personal" as const,
      title: "Personal Information",
      description: "Update your personal details",
      icon: User,
      color: "zubo-primary",
    },
    {
      id: "pets" as const,
      title: `My Pets (${petCount})`,
      description: "Manage your pet profiles",
      icon: PawPrint,
      color: "zubo-accent",
    },
    {
      id: "address" as const,
      title: "Address",
      description: "Update your location details",
      icon: MapPin,
      color: "zubo-highlight-2",
    },
  ]

  const PersonalInfoContent = () => (
    <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-zubo-text-800 text-lg">
          <User className="mr-2 h-5 w-5 text-zubo-primary-600" />
          Personal Information
        </CardTitle>
        <CardDescription className="text-zubo-text-600 text-sm">Update your personal details</CardDescription>
      </CardHeader>
      <form onSubmit={handleProfileUpdate}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-zubo-text-700">
              Full Name *
            </Label>
            <Input
              id="name"
              name="name"
              value={profile?.name || ""}
              onChange={handleInputChange}
              required
              className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-zubo-text-700">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="border-zubo-background-300 bg-zubo-background-200 text-zubo-text-500 cursor-not-allowed"
            />
            <p className="text-xs text-zubo-text-500">Contact support to update email.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-zubo-text-700">
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={profile?.phone || ""}
              disabled
              className="border-zubo-background-300 bg-zubo-background-200 text-zubo-text-500 cursor-not-allowed"
            />
            <p className="text-xs text-zubo-text-500">Contact support to update phone.</p>
          </div>
        </CardContent>
        <CardContent className="pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </form>
    </Card>
  )

  return (
    <div className="min-h-[calc(100vh-100px)] bg-zubo-background-100">
      <div className="hidden md:block p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zubo-text-800">My Profile</h1>
            <p className="text-zubo-text-600">Manage your personal information, pets, and address.</p>
            {profile?.name && <p className="text-zubo-primary-600 mt-1">Welcome, {profile.name}!</p>}
          </div>

          {successMessage && (
            <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3 flex items-center mb-6">
              <CheckCircle className="h-4 w-4 text-zubo-accent-600 mr-2" />
              <span className="text-zubo-accent-800 text-sm">{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50 sticky top-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-zubo-text-800 text-lg">Profile Menu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isSelected = item.id === mobileView
                    return (
                      <button
                        key={item.id}
                        onClick={() => setMobileView(item.id)}
                        className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${isSelected
                            ? `bg-${item.color}-100 text-${item.color}-700 border border-${item.color}-200`
                            : "hover:bg-zubo-background-100 text-zubo-text-600 hover:text-zubo-text-800"
                          }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs opacity-75">{item.description}</div>
                        </div>
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </button>
                    )
                  })}
                  <div className="pt-4 border-t border-zubo-background-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center p-3 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      <div>
                        <div className="font-medium">Logout</div>
                        <div className="text-xs opacity-75">Sign out of your account</div>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-9">
              {mobileView === "personal" && <PersonalInfoContent />}
              {mobileView === "pets" && (
                <PetList
                  pets={pets}
                  onPetAdded={handlePetAdded}
                  onPetUpdated={handlePetUpdated}
                  onPetDeleted={handlePetDeleted}
                />
              )}
              {mobileView === "address" && <AddressForm initialAddress={profile?.address} />}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        {mobileView === "menu" ? (
          <div className="p-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-zubo-text-800">My Profile</h1>
              {profile?.name && <p className="text-zubo-primary-600 mt-1">Welcome, {profile.name}!</p>}
            </div>

            {successMessage && (
              <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3 flex items-center mb-6">
                <CheckCircle className="h-4 w-4 text-zubo-accent-600 mr-2" />
                <span className="text-zubo-accent-800 text-sm">{successMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Card
                    key={item.id}
                    className="border-zubo-background-200 shadow-sm bg-zubo-background-50 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setMobileView(item.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg bg-${item.color}-100 mr-4`}>
                          <Icon className={`h-5 w-5 text-${item.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-zubo-text-800">{item.title}</h3>
                          <p className="text-sm text-zubo-text-600">{item.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zubo-text-400" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              <Card
                className="border-red-200 shadow-sm bg-red-50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleLogout}
              >
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-red-100 mr-4">
                      <LogOut className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-red-800">Logout</h3>
                      <p className="text-sm text-red-600">Sign out of your account</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setMobileView("menu")}
                className="mr-3 p-2 rounded-lg hover:bg-zubo-background-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-zubo-text-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-zubo-text-800">
                  {menuItems.find((item) => item.id === mobileView)?.title}
                </h1>
                <p className="text-sm text-zubo-text-600">
                  {menuItems.find((item) => item.id === mobileView)?.description}
                </p>
              </div>
            </div>

            {successMessage && (
              <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3 flex items-center mb-6">
                <CheckCircle className="h-4 w-4 text-zubo-accent-600 mr-2" />
                <span className="text-zubo-accent-800 text-sm">{successMessage}</span>
              </div>
            )}

            {mobileView === "personal" && <PersonalInfoContent />}
            {mobileView === "pets" && (
              <PetList
                pets={pets}
                onPetAdded={handlePetAdded}
                onPetUpdated={handlePetUpdated}
                onPetDeleted={handlePetDeleted}
              />
            )}
            {mobileView === "address" && <AddressForm initialAddress={profile?.address} />}
          </div>
        )}
      </div>
    </div>
  )
}
