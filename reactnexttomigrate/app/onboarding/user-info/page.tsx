"use client"

import type React from "react"
import { GoogleMapsPicker } from "@/components/google-maps-picker"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { AlertTriangle, CheckCircle, User, Mail, MapPin, ArrowRight, Building2 } from "lucide-react"
import { toast } from "sonner"
import { SOCIETIES } from "@/lib/societies"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const SUPPORTED_PINCODES = ["560029", "560076", "560068", "560102", "560034"]

export default function UserInfoPage() {
  const router = useRouter()
  const { user, updateUserProfile, isNewUser } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [selectedSociety, setSelectedSociety] = useState<string>("")
  const [address, setAddress] = useState({
    line1: "",
    doorNumber: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    landmark: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // If user is not logged in or not a new user, redirect
    if (!user) {
      router.push("/login")
      return
    }

    if (!isNewUser && user.name) {
      router.push("/")
      return
    }

    // Pre-fill form if user data exists
    if (user.name) setName(user.name)
    if (user.email) setEmail(user.email)
  }, [user, isNewUser, router])

  const handleSocietyChange = (societyName: string) => {
    setSelectedSociety(societyName)
    const society = SOCIETIES.find((s) => s.name === societyName)

    if (society) {
      setAddress((prev) => ({
        ...prev,
        line1: society.name,
        city: society.city,
        state: society.state,
        postalCode: society.pincode,
        country: "India",
        latitude: society.coordinates.lat,
        longitude: society.coordinates.lng,
      }))
      toast.success("Society selected", {
        description: `${society.name} - ${society.pincode}`,
      })
    }
  }

  const handleAddressChange = (field: string, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      // Basic validation
      if (!name.trim()) {
        setError("Please enter your name")
        setIsLoading(false)
        return
      }

      if (!selectedSociety) {
        setError("Please select your society")
        setIsLoading(false)
        return
      }

      if (!address.line1.trim() || !address.city.trim() || !address.state.trim() || !address.postalCode.trim()) {
        setError("Please fill in all required address fields")
        setIsLoading(false)
        return
      }

      if (!validatePincode(address.postalCode)) {
        toast.error("Service Area Not Available", {
          description: `Sorry, we don't serve this area yet. We currently serve these pincodes: ${SUPPORTED_PINCODES.join(", ")}`,
          duration: 5000,
        })
        setIsLoading(false)
        return
      }

      if (email && !isValidEmail(email)) {
        setError("Please enter a valid email address")
        setIsLoading(false)
        return
      }

      console.log("🚀 Starting profile update process...")
      console.log("👤 Current user:", user)

      // Update profile on server
      console.log("📝 Updating user profile...")
      const profileResponse = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name,
          email: email || undefined,
          phone: user.phone,
        }),
      })

      const profileData = await profileResponse.json()
      console.log("📥 Profile response:", profileData)

      if (!profileResponse.ok) {
        console.error("❌ Profile update failed:", profileData)
        throw new Error(profileData.message || profileData.error || "Failed to update profile")
      }

      console.log("✅ Profile updated successfully")

      // Save address
      console.log("📍 Saving address with location:", {
        latitude: address.latitude,
        longitude: address.longitude,
      })

      const addressResponse = await fetch("/api/user/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          phone: user.phone,
          line1: address.line1,
          line2: address.doorNumber,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          landmark: address.landmark,
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: true,
        }),
      })

      const addressData = await addressResponse.json()
      console.log("📥 Address response:", addressData)

      if (!addressResponse.ok) {
        console.error("❌ Address save failed:", addressData)
        throw new Error(addressData.message || addressData.error || "Failed to save address")
      }

      console.log("✅ Address saved successfully")

      // Update user profile in auth context
      await updateUserProfile({
        name,
        email: email || undefined,
      })
      await fetch("/api/notifications/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      setSuccess("Profile and address updated successfully!")

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/landing")
      }, 0)
    } catch (error) {
      console.error("❌ Error updating profile:", error)
      setError(error instanceof Error ? error.message : "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePincode = (pincode: string): boolean => {
    return SUPPORTED_PINCODES.includes(pincode.trim())
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-zubo-background-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zubo-text-800">Complete Your Profile</h1>
          <p className="text-zubo-text-600 mt-2">Tell us about yourself and where you're located</p>
        </div>

        <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-zubo-text-800">Your Information</CardTitle>
            <CardDescription className="text-zubo-text-600">Please provide your details and address</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zubo-text-800 flex items-center">
                  <User className="mr-2 h-5 w-5 text-zubo-primary-600" />
                  Personal Details
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-zubo-text-700">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-zubo-text-400" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-zubo-text-700">
                    Email Address (Optional)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zubo-text-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                    />
                  </div>
                  <p className="text-xs text-zubo-text-500">We'll use this for booking confirmations and updates</p>
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zubo-text-800 flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-zubo-primary-600" />
                    Your Address
                  </h3>

                  <div className="bg-zubo-primary-50 border border-zubo-primary-200 rounded-lg p-3">
                    <p className="text-sm text-zubo-primary-800">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      We currently serve select societies in Bangalore. Please choose your society from the list below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="society" className="text-sm font-medium text-zubo-text-700">
                      Select Your Society *
                    </Label>
                    <Select value={selectedSociety} onValueChange={handleSocietyChange}>
                      <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800">
                        <SelectValue placeholder="Choose your society..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIETIES.map((society) => (
                          <SelectItem key={society.name} value={society.name}>
                            {society.name} - {society.pincode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSociety && (
                    <GoogleMapsPicker
                      key={selectedSociety}
                      onLocationSelect={(location) => {
                        setAddress((prev) => ({
                          ...prev,
                          latitude: location.lat,
                          longitude: location.lng,
                        }))
                        setSuccess(`Location pinpointed on map`)
                        setTimeout(() => setSuccess(""), 3000)
                      }}
                      initialLocation={
                        address.latitude && address.longitude
                          ? {
                              lat: address.latitude,
                              lng: address.longitude,
                            }
                          : undefined
                      }
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doorNumber" className="text-sm font-medium text-zubo-text-700">
                      Door Number / Building / Tower
                    </Label>
                    <Input
                      id="doorNumber"
                      placeholder="e.g., Tower A, Flat 301 or Building 5, #402"
                      value={address.doorNumber}
                      onChange={(e) => handleAddressChange("doorNumber", e.target.value)}
                      className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                    />
                    <p className="text-xs text-zubo-text-500">
                      Enter your complete door number including building/tower details
                    </p>
                  </div>
                </div>

                {/* Location captured */}
                {address.latitude && address.longitude && (
                  <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3">
                    <p className="text-sm text-zubo-accent-800">
                      📍 Location captured: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-zubo-highlight-1-50 border border-zubo-highlight-1-200 rounded-lg p-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-zubo-highlight-1-600 mr-2" />
                  <span className="text-zubo-highlight-1-800 text-sm">{error}</span>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3 flex items-center">
                  <CheckCircle className="h-4 w-4 text-zubo-accent-600 mr-2" />
                  <span className="text-zubo-accent-800 text-sm">{success}</span>
                </div>
              )}
            </CardContent>

            {/* Form footer */}
            <CardFooter className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Saving Profile & Address...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Complete Setup</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Footer text */}
        <div className="mt-6 text-center text-sm text-zubo-text-600">
          <p>You can update your profile and address information anytime from your account settings</p>
        </div>
      </div>
    </div>
  )
}
