"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Home,
  Building2,
  MapIcon,
  Star,
  MoreVertical,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"
import {
  fetchUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
} from "@/lib/address-api"
import type { Address } from "@/types/api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GoogleMapsPicker } from "./google-maps-picker"
import type { AddressFormProps } from "@/types/components"
import { APPROVED_SOCIETIES, type Society } from "@/lib/societies"

export function AddressForm({ initialAddress }: AddressFormProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null)
  const [mapKey, setMapKey] = useState(0)

  const loadAddresses = async () => {
    try {
      setError(null)
      const fetchedAddresses = await fetchUserAddresses()
      setAddresses(fetchedAddresses || []) // Ensure it's always an array
    } catch (err) {
      console.error("Failed to fetch addresses:", err)
      setError("Failed to load addresses. Please try again.")
      setAddresses([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  const handleAddNew = () => {
    setEditingAddress({
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      landmark: "",
      isDefault: addresses.length === 0, // First address is default
      isActive: true,
    })
    setSelectedSociety(null)
    setIsAddingNew(true)
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    const matchedSociety = APPROVED_SOCIETIES.find((s) => address.line1?.includes(s.name))
    setSelectedSociety(matchedSociety || null)
    setIsAddingNew(false)
  }

  const handleCancel = () => {
    setEditingAddress(null)
    setSelectedSociety(null)
    setIsAddingNew(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingAddress) return
    const { name, value } = e.target
    setEditingAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (!editingAddress) return
    setEditingAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSocietySelect = (societyName: string) => {
    const society = APPROVED_SOCIETIES.find((s) => s.name === societyName)
    if (!society || !editingAddress) return

    setSelectedSociety(society)
    setEditingAddress((prev) => ({
      ...prev,
      line1: society.name,
      city: society.city,
      state: society.state,
      postalCode: society.pincode,
      country: "India",
      latitude: society.coordinates?.lat,
      longitude: society.coordinates?.lng,
    }))
    setMapKey((prev) => prev + 1)
  }

  const handleLocationSelect = (location: {
    lat: number
    lng: number
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }) => {
    if (!editingAddress) return

    setEditingAddress((prev) => ({
      ...prev,
      line2: location.address,
      city: location.city,
      state: location.state,
      postalCode: location.postalCode,
      country: location.country,
      latitude: location.lat,
      longitude: location.lng,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAddress) return

    if (!selectedSociety) {
      toast.error("Society Required", {
        description: "Please select your society from the approved list.",
        duration: 5000,
      })
      return
    }

    if (!editingAddress.postalCode) {
      toast.error("Invalid Address", {
        description: "Please ensure all required fields are filled.",
        duration: 5000,
      })
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (isAddingNew) {
        await createUserAddress(editingAddress)
        setSuccessMessage("Address added successfully!")
      } else {
        await updateUserAddress(editingAddress)
        setSuccessMessage("Address updated successfully!")
      }

      await loadAddresses()
      setEditingAddress(null)
      setSelectedSociety(null)
      setIsAddingNew(false)
    } catch (err) {
      console.error("Failed to save address:", err)
      setError("Failed to save address. Please try again.")
    } finally {
      setSaving(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return

    try {
      await deleteUserAddress(addressId)
      setSuccessMessage("Address deleted successfully!")
      await loadAddresses()
    } catch (err) {
      console.error("Failed to delete address:", err)
      setError("Failed to delete address. Please try again.")
    }
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId)
      setSuccessMessage("Default address updated!")
      await loadAddresses()
    } catch (err) {
      console.error("Failed to set default address:", err)
      setError("Failed to set default address. Please try again.")
    }
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const getAddressIcon = (address: Address) => {
    if (address.line1?.toLowerCase().includes("office") || address.line1?.toLowerCase().includes("work")) {
      return <Building2 className="h-4 w-4" />
    }
    return <Home className="h-4 w-4" />
  }

  const formatAddress = (address: Address) => {
    const parts = [address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean)
    return parts.join(", ")
  }

  if (loading) {
    return (
      <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-zubo-text-800 text-lg">
            <MapPin className="mr-2 h-5 w-5 text-zubo-primary-600" />
            My Addresses
          </CardTitle>
          <CardDescription className="text-zubo-text-600 text-sm">Loading your addresses...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[150px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zubo-primary-600"></div>
        </CardContent>
      </Card>
    )
  }

  if (error && addresses.length === 0) {
    return (
      <Card className="border-zubo-highlight-1-200 bg-zubo-highlight-1-50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-zubo-highlight-1-800 text-lg">
            <XCircle className="mr-2 h-5 w-5 text-zubo-highlight-1-600" />
            Error Loading Addresses
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
    )
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3 flex items-center">
          <CheckCircle className="h-4 w-4 text-zubo-accent-600 mr-2" />
          <span className="text-zubo-accent-800 text-sm">{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="text-zubo-highlight-1-600 text-sm bg-zubo-highlight-1-50 border border-zubo-highlight-1-200 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Show Form when editing/adding, otherwise show Address List */}
      {editingAddress ? (
        /* Address Form - Replaces the list on mobile */
        <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="p-2 hover:bg-zubo-background-100 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className="flex items-center text-zubo-text-800 text-lg">
                  {isAddingNew ? (
                    <Plus className="mr-2 h-5 w-5 text-zubo-primary-600" />
                  ) : (
                    <Edit3 className="mr-2 h-5 w-5 text-zubo-primary-600" />
                  )}
                  {isAddingNew ? "Add New Address" : "Edit Address"}
                </CardTitle>
                <CardDescription className="text-zubo-text-600 text-sm">
                  {isAddingNew ? "Select your society and provide details" : "Update your address information"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="bg-zubo-primary-50 border border-zubo-primary-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-zubo-primary-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zubo-primary-800 mb-1">Society-Based Service</p>
                  <p className="text-xs text-zubo-primary-700">
                    We currently serve only approved societies. Please select your society from the list below.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="society" className="text-sm font-medium text-zubo-text-700">
                  Select Your Society *
                </Label>
                <Select value={selectedSociety?.name || ""} onValueChange={handleSocietySelect}>
                  <SelectTrigger className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800">
                    <SelectValue placeholder="Choose your society..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200 max-h-[300px]">
                    {APPROVED_SOCIETIES.map((society) => (
                      <SelectItem
                        key={society.name}
                        value={society.name}
                        className="hover:bg-zubo-background-100 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{society.name}</span>
                          <span className="text-xs text-zubo-text-500">
                            {society.city} - {society.pincode}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-zubo-text-500">
                  Don't see your society? We're expanding soon! Contact support for updates.
                </p>
              </div>

              {selectedSociety && (
                <>
                  {/* Google Maps Integration */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-zubo-text-700">Pin Your Exact Location (Optional)</Label>
                    <p className="text-xs text-zubo-text-500 mb-2">
                      Help us find your exact building/tower within {selectedSociety.name}
                    </p>
                    <GoogleMapsPicker
                      key={mapKey}
                      onLocationSelect={handleLocationSelect}
                      initialLocation={
                        editingAddress.latitude && editingAddress.longitude
                          ? { lat: Number(editingAddress.latitude), lng: Number(editingAddress.longitude) }
                          : selectedSociety.coordinates
                      }
                    />
                  </div>

                  {/* Additional Address Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-zubo-background-300 flex-1"></div>
                      <span className="text-xs text-zubo-text-500 px-2">Additional Details</span>
                      <div className="h-px bg-zubo-background-300 flex-1"></div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="line2" className="text-sm font-medium text-zubo-text-700">
                        Door Number / Building / Tower *
                      </Label>
                      <Input
                        id="line2"
                        name="line2"
                        value={editingAddress.line2 || ""}
                        onChange={handleChange}
                        required
                        className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400"
                        placeholder="e.g., Flat 402, Tower A / #305, Block B"
                      />
                      <p className="text-xs text-zubo-text-500">
                        Include your flat/unit number, building, tower, or block details
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="landmark" className="text-sm font-medium text-zubo-text-700">
                        Landmarks (Optional)
                      </Label>
                      <Textarea
                        id="landmark"
                        name="landmark"
                        value={editingAddress.landmark || ""}
                        onChange={handleChange}
                        className="border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100 text-zubo-text-800 placeholder:text-zubo-text-400 min-h-[80px]"
                        placeholder="e.g., Near main gate, Blue building, Ground floor, Next to clubhouse"
                      />
                      <p className="text-xs text-zubo-text-500">
                        Add any landmarks to help our service providers find you easily
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardContent className="pt-0 flex gap-3">
              <Button
                type="submit"
                disabled={saving || !selectedSociety}
                className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50 disabled:opacity-50"
              >
                {saving ? "Saving..." : isAddingNew ? "Add Address" : "Update Address"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-100 bg-transparent"
              >
                Cancel
              </Button>
            </CardContent>
          </form>
        </Card>
      ) : (
        /* Address List - Only shown when not editing/adding */
        <Card className="border-zubo-background-200 shadow-sm bg-zubo-background-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-zubo-text-800 text-lg">
                  <MapPin className="mr-2 h-5 w-5 text-zubo-primary-600" />
                  My Addresses ({addresses.length})
                </CardTitle>
                <CardDescription className="text-zubo-text-600 text-sm">
                  Manage your saved addresses for service bookings
                </CardDescription>
              </div>
              <Button
                onClick={handleAddNew}
                className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-zubo-text-500">
                <MapIcon className="h-12 w-12 mx-auto mb-3 text-zubo-text-300" />
                <p className="text-sm">No addresses saved yet</p>
                <p className="text-xs text-zubo-text-400 mt-1">Add your first address to get started</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    address.isDefault
                      ? "border-zubo-primary-200 bg-zubo-primary-50"
                      : "border-zubo-background-200 bg-zubo-background-100 hover:bg-zubo-background-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getAddressIcon(address)}
                        <span className="font-medium text-zubo-text-800 text-sm">{address.line1}</span>
                        {address.isDefault && (
                          <Badge variant="secondary" className="bg-zubo-primary-100 text-zubo-primary-700 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-zubo-text-600 text-sm leading-relaxed">{formatAddress(address)}</p>
                      {address.landmark && (
                        <p className="text-zubo-text-500 text-xs mt-1">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {address.landmark}
                        </p>
                      )}
                      {address.latitude &&
                        address.longitude &&
                        !isNaN(Number(address.latitude)) &&
                        !isNaN(Number(address.longitude)) && (
                          <p className="text-zubo-text-400 text-xs mt-1">
                            📍 {Number(address.latitude).toFixed(6)}, {Number(address.longitude).toFixed(6)}
                          </p>
                        )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zubo-background-50 border-zubo-background-200">
                        <DropdownMenuItem onClick={() => handleEdit(address)} className="hover:bg-zubo-background-100">
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {!address.isDefault && (
                          <DropdownMenuItem
                            onClick={() => handleSetDefault(address.id)}
                            className="hover:bg-zubo-background-100"
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        {addresses.length > 1 && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(address.id)}
                            className="hover:bg-zubo-highlight-1-50 text-zubo-highlight-1-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
