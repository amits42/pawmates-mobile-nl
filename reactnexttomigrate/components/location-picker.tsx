"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, MapPin, Navigation } from "lucide-react"
import { toast } from "sonner"

interface LocationPickerProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: {
    latitude: number
    longitude: number
    address: string
  }) => void
}

export default function LocationPicker({ isOpen, onClose, onLocationSelect }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`

        setSelectedLocation({ lat, lng, address })
        toast.success("Current location captured!")
      },
      (error) => {
        console.error("Error getting location:", error)
        toast.error("Could not get your location")
      },
    )
  }

  const searchLocation = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // For now, just create a mock location based on search
      // In production, you'd use a geocoding service
      const mockLat = 28.6139 + (Math.random() - 0.5) * 0.1
      const mockLng = 77.209 + (Math.random() - 0.5) * 0.1

      setSelectedLocation({
        lat: mockLat,
        lng: mockLng,
        address: searchQuery,
      })

      toast.success("Location found!")
    } catch (error) {
      console.error("Error searching location:", error)
      toast.error("Error searching location")
    } finally {
      setIsSearching(false)
    }
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedLocation.address,
      })
      onClose()
      setSelectedLocation(null)
      setSearchQuery("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchLocation()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Share Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter address or place name..."
              className="flex-1"
            />
            <Button onClick={searchLocation} disabled={isSearching} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Location Button */}
          <Button onClick={getCurrentLocation} variant="outline" className="w-full">
            <Navigation className="h-4 w-4 mr-2" />
            Use My Current Location
          </Button>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-blue-500" />
                <div>
                  <p className="font-medium">Selected Location:</p>
                  <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                  <p className="text-xs text-gray-500">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500">Enter an address or use your current location to share with others.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedLocation}>
            Share This Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
