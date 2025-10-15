"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MapPin, Navigation, Search, Loader2 } from "lucide-react"

const libraries: "places"[] = ["places"]

const mapContainerStyle = {
  width: "100%",
  height: "400px",
}

const defaultCenter = {
  lat: 28.6139, // Delhi, India
  lng: 77.209,
}

interface GoogleMapsPickerProps {
  onLocationSelect: (location: {
    lat: number
    lng: number
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }) => void
  initialLocation?: { lat: number; lng: number }
}

export function GoogleMapsPicker({ onLocationSelect, initialLocation }: GoogleMapsPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [center, setCenter] = useState(initialLocation || defaultCenter)
  const [markerPosition, setMarkerPosition] = useState(initialLocation || defaultCenter)
  const [searchQuery, setSearchQuery] = useState("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)

  // Initialize services when map loads
  useEffect(() => {
    if (isLoaded && map) {
      autocompleteService.current = new google.maps.places.AutocompleteService()
      placesService.current = new google.maps.places.PlacesService(map)
    }
  }, [isLoaded, map])

  // Get current location on mount if no initial location
  useEffect(() => {
    if (isLoaded && !initialLocation) {
      getCurrentLocation()
    }
  }, [isLoaded, initialLocation])

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCenter(pos)
        setMarkerPosition(pos)
        if (map) {
          map.panTo(pos)
          map.setZoom(15)
        }
        reverseGeocode(pos)
        setIsGettingLocation(false)
      },
      (error) => {
        console.error("Error getting current location:", error)
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const reverseGeocode = (position: { lat: number; lng: number }) => {
    if (!isLoaded) return

    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const result = results[0]
        const addressComponents = result.address_components
        const originalAddress = result.formatted_address

        let city = ""
        let state = ""
        let postalCode = ""
        let country = ""
        let toRemove: string[] = []

        addressComponents?.forEach((component) => {
          const types = component.types
          if (types.includes("locality")) {
            city = component.long_name
            toRemove.push(component.long_name)
          } else if (types.includes("administrative_area_level_1")) {
            state = component.long_name
            toRemove.push(component.long_name)
          } else if (types.includes("postal_code")) {
            postalCode = component.long_name
            toRemove.push(component.long_name)
          } else if (types.includes("country")) {
            country = component.long_name
            toRemove.push(component.long_name)
          }
        })


        // Remove found components from address string
        let cleanedAddress = originalAddress
        toRemove.forEach((val) => {
          // Remove with comma and optional space before/after
          const regex = new RegExp(`,?\s*${val}\s*`, "gi")
          cleanedAddress = cleanedAddress.replace(regex, "")
        })
        // Remove any leftover consecutive commas and spaces
        cleanedAddress = cleanedAddress
          .split(",")
          .map((part) => part.trim())
          .filter((part) => part.length > 0)
          .join(", ")
          .replace(/^,|,$/g, "")
          .trim()

        setSearchQuery(originalAddress)
        onLocationSelect({
          lat: position.lat,
          lng: position.lng,
          address: cleanedAddress,
          city,
          state,
          postalCode,
          country,
        })
      }
    })
  }

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const position = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      }
      setMarkerPosition(position)
      reverseGeocode(position)
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    if (value.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: "in" }, // Restrict to India, change as needed
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions)
            setShowSuggestions(true)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        },
      )
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (placeId: string, description: string) => {
    if (!placesService.current) return

    placesService.current.getDetails(
      {
        placeId: placeId,
        fields: ["geometry", "formatted_address", "address_components"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          const position = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }

          setMarkerPosition(position)
          setCenter(position)
          setSearchQuery(description)
          setShowSuggestions(false)

          if (map) {
            map.panTo(position)
            map.setZoom(15)
          }

          // Parse address components
          const addressComponents = place.address_components
          let city = ""
          let state = ""
          let postalCode = ""
          let country = ""

          addressComponents?.forEach((component) => {
            const types = component.types
            if (types.includes("locality")) {
              city = component.long_name
            } else if (types.includes("administrative_area_level_1")) {
              state = component.long_name
            } else if (types.includes("postal_code")) {
              postalCode = component.long_name
            } else if (types.includes("country")) {
              country = component.long_name
            }
          })

          onLocationSelect({
            lat: position.lat,
            lng: position.lng,
            address: place.formatted_address || description,
            city,
            state,
            postalCode,
            country,
          })
        }
      },
    )
  }

  if (loadError) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-2">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Failed to load Google Maps</p>
          <p className="text-sm text-gray-600 mt-1">Please check your API key configuration</p>
        </div>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-zubo-primary-600" />
          <span className="text-zubo-text-600">Loading Google Maps...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zubo-text-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="pl-10 border-zubo-background-300 focus:border-zubo-primary-500 focus:ring-zubo-primary-500 bg-zubo-background-100"
          />
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-zubo-background-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-zubo-background-50 border-b border-zubo-background-100 last:border-b-0 focus:bg-zubo-background-50 focus:outline-none"
                onClick={() => handleSuggestionClick(suggestion.place_id, suggestion.description)}
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-zubo-text-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zubo-text-800 truncate">
                      {suggestion.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-zubo-text-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Use My Current Location Button - Made more prominent */}
      <Button
        type="button"
        onClick={getCurrentLocation}
        disabled={isGettingLocation}
        variant="outline"
        className="w-full border-zubo-primary-300 text-zubo-primary-700 hover:bg-zubo-primary-50 bg-transparent py-3"
      >
        {isGettingLocation ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Getting your location...
          </>
        ) : (
          <>
            <Navigation className="mr-2 h-4 w-4" />
            Use My Current Location
          </>
        )}
      </Button>

      {/* Google Map */}
      <div className="rounded-lg overflow-hidden border border-zubo-background-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          <Marker position={markerPosition} draggable={true} onDragEnd={handleMapClick} />
        </GoogleMap>
      </div>

      {/* Instructions */}
      <div className="text-xs text-zubo-text-500 space-y-1">
        <p>• Search for a location using the search box above</p>
        <p>• Click "Use My Current Location" to get your GPS position</p>
        <p>• Click on the map to select a location</p>
        <p>• Drag the marker to fine-tune the position</p>
      </div>
    </div>
  )
}
