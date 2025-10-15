"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import {
  Calendar,
  Repeat,
  User,
  Heart,
  Info,
  AlertTriangle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react"
import { PetSelector } from "@/components/pet-selector"
import { ServiceSelector } from "@/components/service-selector"
import { TimeSelector } from "@/components/time-selector"
import { RecurringOptions } from "@/components/recurring-options"
import { Badge } from "@/components/ui/badge"
import type { Pet, Service, Address } from "@/types/api"
import { fetchUserPets, fetchServices } from "@/lib/api"
import { fetchUserAddresses } from "@/lib/address-api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, SheetTrigger } from "@/components/ui/sheet"

type BookingStep = "setup" | "details" | "review"
type SubStep = "pet" | "service" | "address" | "schedule" | "review"

export default function BookServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pets, setPets] = useState<Pet[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedPet, setSelectedPet] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringPattern, setRecurringPattern] = useState<string | null>(null)
  const [recurringEndDate, setRecurringEndDate] = useState<string>("")

  // UI state
  const [currentStep, setCurrentStep] = useState<BookingStep>("setup")
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>("pet")
  const [bookingType, setBookingType] = useState<"one-time" | "recurring">("one-time")
  const [showSessionDatesSheet, setShowSessionDatesSheet] = useState(false)

  // Check if this is a rebook
  const isRebook = searchParams?.get("rebook") === "true"
  const originalBookingId = searchParams?.get("originalBookingId")

  const allSubSteps: SubStep[] = ["pet", "service", "address", "schedule", "review"]

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("📋 Loading initial data for booking...")
        const [petsData, servicesData, addressesData] = await Promise.all([
          fetchUserPets(),
          fetchServices(),
          fetchUserAddresses(),
        ])

        console.log("✅ Data loaded:", { pets: petsData, services: servicesData, addresses: addressesData })
        setPets(petsData)
        setServices(servicesData)
        setAddresses(addressesData || [])

        // Set default address
        const defaultAddress = addressesData?.find((addr) => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id)
        }

        // Pre-fill form if this is a rebook
        if (isRebook && searchParams) {
          const petId = searchParams.get("pet")
          const serviceId = searchParams.get("service")
          const time = searchParams.get("time")
          const recurring = searchParams.get("recurring") === "true"
          const pattern = searchParams.get("pattern")

          if (petId) setSelectedPet(petId)
          if (serviceId) setSelectedService(serviceId)
          if (time) setSelectedTime(time)
          if (recurring) {
            setBookingType("recurring")
            setIsRecurring(true)
            if (pattern) setRecurringPattern(pattern)
          }
        }
      } catch (error) {
        console.error("❌ Error loading initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  const handlePetsUpdate = (updatedPets: Pet[]) => {
    console.log("🔄 Updating pets list:", updatedPets)
    setPets(updatedPets)
  }

  function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay()
    const offset = (7 + weekday - firstDayOfWeek) % 7
    const date = 1 + offset + (nth - 1) * 7
    const result = new Date(year, month, date)
    return result.getMonth() === month ? result : null
  }

  const calculateRecurringSessions = () => {
    if (bookingType !== "recurring" || !recurringPattern || !selectedDate || !recurringEndDate) {
      return []
    }

    const startDate = new Date(selectedDate)
    const endDate = new Date(recurringEndDate)

    if (endDate <= startDate) return []

    const daysOfWeekMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    const sessionDates: Date[] = []

    if (recurringPattern.startsWith("weekly_")) {
      const [, intervalStr, daysStr] = recurringPattern.split("_")
      const weekInterval = Number.parseInt(intervalStr, 10)
      const days = daysStr.split(",").map((d) => daysOfWeekMap[d.toLowerCase()])

      const currentWeekStart = new Date(startDate)

      while (currentWeekStart <= endDate) {
        for (const day of days) {
          const sessionDate = new Date(currentWeekStart)
          sessionDate.setDate(currentWeekStart.getDate() + ((day - currentWeekStart.getDay() + 7) % 7))

          if (sessionDate >= startDate && sessionDate <= endDate) {
            sessionDates.push(new Date(sessionDate)) // clone to avoid mutation
          }
        }
        currentWeekStart.setDate(currentWeekStart.getDate() + weekInterval * 7)
      }
    } else if (recurringPattern.startsWith("monthly_")) {
      const [, intervalStr, nthStr, daysStr] = recurringPattern.split("_")
      const monthInterval = Number.parseInt(intervalStr, 10)
      const nth = Number.parseInt(nthStr, 10)
      const weekdays = daysStr.split(",").map((d) => daysOfWeekMap[d.toLowerCase()])

      const current = new Date(startDate)

      while (current <= endDate) {
        const year = current.getFullYear()
        const month = current.getMonth()

        for (const weekday of weekdays) {
          const date = getNthWeekdayOfMonth(year, month, weekday, nth)
          if (date && date >= startDate && date <= endDate) {
            sessionDates.push(new Date(date))
          }
        }

        current.setMonth(current.getMonth() + monthInterval)
        current.setDate(1)
      }
    }

    return sessionDates
  }


  const getRecurringSessionsInfo = () => {
    const sessionDates = calculateRecurringSessions();
    const sessions = sessionDates.length;
    const selectedServiceData = services.find((s) => s.id === selectedService)
    const servicePrice = selectedServiceData?.price || 0
    const totalPrice = sessions * servicePrice

    return {
      sessions,
      servicePrice,
      totalPrice,
      sessionDates
    }
  }

  const handleSubmit = () => {
    const params = new URLSearchParams({
      pet: selectedPet || "",
      service: selectedService || "",
      date: selectedDate,
      time: selectedTime || "",
      address: selectedAddress || "",
      recurring: (bookingType === "recurring").toString(),
    })

    if (bookingType === "recurring") {
      params.append("pattern", recurringPattern || "")
      params.append("endDate", recurringEndDate)

      // Add session and pricing info for recurring bookings
      const { sessions, totalPrice } = getRecurringSessionsInfo()
      params.append("sessions", sessions.toString())
      params.append("totalPrice", totalPrice.toString())
    }

    if (isRebook && originalBookingId) {
      params.append("rebook", "true")
      params.append("originalBookingId", originalBookingId)
    }

    router.push(`/book-service/payment?${params.toString()}`)
  }

  const isSubStepCompleted = (subStep: SubStep) => {
    switch (subStep) {
      case "pet":
        return !!selectedPet
      case "service":
        return !!selectedService
      case "address":
        return !!selectedAddress
      case "schedule":
        if (bookingType === "recurring") {
          return selectedDate && selectedTime && recurringPattern && recurringEndDate
        }
        return selectedDate && selectedTime
      case "review":
        return true
      default:
        return false
    }
  }

  const getCurrentSubStepIndex = () => {
    return allSubSteps.findIndex((step) => step === currentSubStep)
  }

  const getProgressPercentage = () => {
    const currentIndex = getCurrentSubStepIndex()
    let completedSteps = 0

    // Count completed steps up to current
    for (let i = 0; i < currentIndex; i++) {
      if (isSubStepCompleted(allSubSteps[i])) {
        completedSteps++
      }
    }

    // Add current step if it's completed
    if (isSubStepCompleted(currentSubStep)) {
      completedSteps++
    }

    return (completedSteps / allSubSteps.length) * 100
  }

  const canProceedToNext = () => {
    return isSubStepCompleted(currentSubStep)
  }

  const handleNext = () => {
    if (currentStep === "setup") {
      if (currentSubStep === "pet" && selectedPet) {
        setCurrentSubStep("service")
      } else if (currentSubStep === "service" && selectedService) {
        setCurrentStep("details")
        setCurrentSubStep("address")
      }
    } else if (currentStep === "details") {
      if (currentSubStep === "address" && selectedAddress) {
        setCurrentSubStep("schedule")
      } else if (currentSubStep === "schedule" && isSubStepCompleted("schedule")) {
        setCurrentStep("review")
        setCurrentSubStep("review")
      }
    }
  }

  const handlePrev = () => {
    if (currentStep === "setup") {
      if (currentSubStep === "service") {
        setCurrentSubStep("pet")
      }
    } else if (currentStep === "details") {
      if (currentSubStep === "address") {
        setCurrentStep("setup")
        setCurrentSubStep("service")
      } else if (currentSubStep === "schedule") {
        setCurrentSubStep("address")
      }
    } else if (currentStep === "review") {
      setCurrentStep("details")
      setCurrentSubStep("schedule")
    }
  }

  const getSelectedPetName = () => {
    const pet = pets.find((p) => p.id === selectedPet)
    return pet?.name || ""
  }

  const getSelectedServiceName = () => {
    const service = services.find((s) => s.id === selectedService)
    return service?.name || ""
  }

  const getSelectedAddressName = () => {
    const address = addresses.find((a) => a.id === selectedAddress)
    return address ? `${address.line1}, ${address.city}` : ""
  }

  const formatAddressForDisplay = (address: Address) => {
    const parts = [address.line1, address.city, address.state].filter(Boolean)
    return parts.join(", ")
  }

  const formatRecurringText = () => {
    if (bookingType !== "recurring" || !recurringPattern) return ""

    // Handle new detailed patterns
    if (recurringPattern.startsWith("daily_")) {
      const day = recurringPattern.split("_")[1]
      return `Every ${day.charAt(0).toUpperCase() + day.slice(1)}`
    }

    if (recurringPattern.startsWith("weekly_")) {
      const [, interval, day] = recurringPattern.split("_")
      const intervalText = interval === "1" ? "" : `${interval} weeks`
      return `Every ${intervalText ? intervalText + " on" : ""} ${day.charAt(0).toUpperCase() + day.slice(1)}`
    }

    if (recurringPattern.startsWith("monthly_")) {
      const [, interval, week, day] = recurringPattern.split("_")
      const weekLabels = { "1": "1st", "2": "2nd", "3": "3rd", "4": "4th", last: "Last" }
      const weekLabel = weekLabels[week as keyof typeof weekLabels] || week
      const intervalText = interval === "1" ? "month" : `${interval} months`
      return `Every ${intervalText} on the ${weekLabel} ${day.charAt(0).toUpperCase() + day.slice(1)}`
    }

    // Fallback for old patterns
    const patterns: Record<string, string> = {
      daily: "Every day",
      weekdays: "Monday to Friday",
      weekly: "Every week",
      biweekly: "Every 2 weeks",
      monthly: "Every month",
    }

    return patterns[recurringPattern] || recurringPattern
  }

  const getStepTitle = () => {
    if (currentStep === "setup") {
      return currentSubStep === "pet" ? "Select Your Pet" : "Choose Service Type"
    }
    if (currentStep === "details") {
      return currentSubStep === "address" ? "Select Service Address" : "Schedule Your Service"
    }
    return "Review & Confirm"
  }

  const getStepDescription = () => {
    if (currentStep === "setup") {
      return currentSubStep === "pet" ? "Choose which pet needs care" : "What kind of care do you need?"
    }
    if (currentStep === "details") {
      return currentSubStep === "address" ? "Where should the service be provided?" : "When do you need the service?"
    }
    return "Review your booking details before proceeding"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary-600" />

            <h3 className="text-lg font-semibold text-zubo-text-800 mb-2">Loading booking options</h3>
            <p className="text-sm text-zubo-text-600">Please wait...</p>

          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Error loading booking page:</strong> {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button onClick={() => window.location.reload()} className="bg-zubo-primary hover:bg-zubo-primary-700">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zubo-background">
      {/* Main Content */}
      <div className="mx-auto px-4 py-6 max-w-2xl">
        {/* Compact Header with Progress */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zubo-text-neutral-800 mb-2">
            {isRebook ? "Rebook Service" : "Book a Service"}
          </h1>

          {/* Inline Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <div className="w-full h-1.5 bg-zubo-text-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-zubo-primary to-zubo-accent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-zubo-text-neutral-500">
                Step {getCurrentSubStepIndex() + 1} of {allSubSteps.length}
              </span>
              <span className="text-xs text-zubo-text-neutral-500">
                {Math.round(getProgressPercentage())}% Complete
              </span>
            </div>
          </div>
        </div>

        {/* Rebook Alert */}
        {isRebook && (
          <Alert className="mb-6 border-zubo-accent-200 bg-zubo-accent-50">
            <Repeat className="h-4 w-4" />
            <AlertDescription className="text-zubo-accent-800">
              <strong>Rebooking in progress!</strong> Your previous service details have been pre-filled.
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="mb-6 border-zubo-text-neutral-200 shadow-sm">
          <CardHeader className="pb-6 bg-gradient-to-r from-zubo-primary/5 to-zubo-accent/5 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-zubo-text-neutral-800 text-xl">
              {(() => {
                if (currentStep === "setup") {
                  const Icon = currentSubStep === "pet" ? Heart : User
                  return <Icon className="h-6 w-6 text-zubo-primary" />
                } else if (currentStep === "details") {
                  const Icon = currentSubStep === "address" ? MapPin : Calendar
                  return <Icon className="h-6 w-6 text-zubo-primary" />
                } else {
                  return <Check className="h-6 w-6 text-zubo-primary" />
                }
              })()}
              {getStepTitle()}
            </CardTitle>
            <CardDescription className="text-zubo-text-neutral-600 text-base mt-2">
              {getStepDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Pet Selection */}
            {currentStep === "setup" && currentSubStep === "pet" && (
              <PetSelector
                pets={pets}
                selectedPetId={selectedPet}
                onSelectPet={setSelectedPet}
                onPetsUpdate={handlePetsUpdate}
              />
            )}

            {/* Service Selection */}
            {currentStep === "setup" && currentSubStep === "service" && (
              <ServiceSelector
                services={services}
                selectedServiceId={selectedService}
                onSelectService={setSelectedService}
              />
            )}

            {/* Address Selection */}
            {currentStep === "details" && currentSubStep === "address" && (
              <div>
                {addresses.length === 0 ? (
                  <div className="text-center py-12 text-zubo-text-neutral-500">
                    <MapPin className="h-16 w-16 mx-auto mb-4 text-zubo-text-neutral-300" />
                    <p className="text-lg mb-2">No addresses found</p>
                    <p className="text-zubo-text-neutral-400">Please add an address in your profile first</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-5 rounded-lg border cursor-pointer transition-all duration-200 ${selectedAddress === address.id
                          ? "border-zubo-primary bg-gradient-to-r from-zubo-primary/10 to-zubo-accent/10 ring-1 ring-zubo-primary/20"
                          : "border-zubo-text-neutral-200 bg-white hover:border-zubo-primary/50 hover:bg-gradient-to-r hover:from-zubo-primary/5 hover:to-zubo-accent/5"
                          }`}
                        onClick={() => setSelectedAddress(address.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${selectedAddress === address.id
                                  ? "border-zubo-primary bg-zubo-primary shadow-md"
                                  : "border-zubo-text-neutral-300"
                                  }`}
                              >
                                {selectedAddress === address.id && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                )}
                              </div>
                              <span className="font-semibold text-zubo-text-neutral-800">{address.line1}</span>
                              {address.isDefault && (
                                <Badge className="bg-zubo-accent-100 text-zubo-accent-700 text-xs px-2 py-1">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-zubo-text-neutral-600 ml-8">{formatAddressForDisplay(address)}</p>
                            {address.landmark && (
                              <p className="text-zubo-text-neutral-500 text-sm mt-1 ml-8">📍 {address.landmark}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Schedule Selection */}
            {currentStep === "details" && currentSubStep === "schedule" && (
              <div className="space-y-6">
                {/* Booking Type Tabs */}
                <Tabs value={bookingType} onValueChange={(value) => setBookingType(value as "one-time" | "recurring")}>
                  <TabsList className="grid w-full grid-cols-2 bg-zubo-background-100 h-12">
                    <TabsTrigger
                      value="one-time"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-zubo-primary text-sm font-medium"
                    >
                      <Calendar className="h-4 w-4" />
                      One-time
                    </TabsTrigger>
                    <TabsTrigger
                      value="recurring"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-zubo-primary text-sm font-medium"
                    >
                      <Repeat className="h-4 w-4" />
                      Recurring
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="one-time" className="space-y-6 mt-6">
                    <Alert className="border-zubo-primary-200 bg-gradient-to-r from-zubo-primary/10 to-zubo-accent/10">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-zubo-primary-800">
                        Schedule a single service appointment for your pet.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="date" className="text-sm font-semibold text-zubo-text-neutral-700">
                          Select Date
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="border-zubo-text-neutral-300 focus:border-zubo-primary focus:ring-zubo-primary/20 h-12 rounded-lg"
                        />
                      </div>

                      <div className="space-y-3">
                        <TimeSelector selectedTime={selectedTime} onSelectTime={setSelectedTime} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="recurring" className="space-y-6 mt-6">
                    <Alert className="border-zubo-primary-200 bg-gradient-to-r from-zubo-primary/10 to-zubo-accent/10">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-zubo-primary-800">
                        Set up regular appointments for ongoing pet care.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="start-date" className="text-sm font-semibold text-zubo-text-neutral-700">
                            Start Date
                          </Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="border-zubo-text-neutral-300 focus:border-zubo-primary focus:ring-zubo-primary/20 h-12 rounded-lg"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="end-date" className="text-sm font-semibold text-zubo-text-neutral-700">
                            End Date
                          </Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={recurringEndDate}
                            onChange={(e) => setRecurringEndDate(e.target.value)}
                            min={selectedDate || new Date().toISOString().split("T")[0]}
                            className="border-zubo-text-neutral-300 focus:border-zubo-primary focus:ring-zubo-primary/20 h-12 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <TimeSelector selectedTime={selectedTime} onSelectTime={setSelectedTime} />
                      </div>

                      <RecurringOptions
                        selectedPattern={recurringPattern}
                        onSelectPattern={setRecurringPattern}
                        endDate={recurringEndDate ? new Date(recurringEndDate) : undefined}
                        onSelectEndDate={(date) => setRecurringEndDate(date ? date.toISOString().split("T")[0] : "")}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Review Step */}
            {currentStep === "review" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-zubo-background-50 to-zubo-primary/5 rounded-xl p-6 space-y-5 border border-zubo-primary/20">
                  <h3 className="text-lg font-semibold text-zubo-text-neutral-900 mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-zubo-primary" />
                    Booking Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-zubo-text-neutral-200">
                      <span className="text-zubo-text-neutral-600 font-medium">Pet:</span>
                      <span className="font-semibold text-zubo-text-neutral-800">{getSelectedPetName()}</span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-zubo-text-neutral-200">
                      <span className="text-zubo-text-neutral-600 font-medium">Service:</span>
                      <span className="font-semibold text-zubo-text-neutral-800">{getSelectedServiceName()}</span>
                    </div>

                    <div className="flex justify-between items-start py-3 border-b border-zubo-text-neutral-200">
                      <span className="text-zubo-text-neutral-600 font-medium">Address:</span>
                      <span className="font-semibold text-right text-zubo-text-neutral-800 max-w-xs">
                        {getSelectedAddressName()}
                      </span>
                    </div>

                    {selectedDate && (
                      <div className="flex justify-between items-center py-3 border-b border-zubo-text-neutral-200">
                        <span className="text-zubo-text-neutral-600 font-medium">Date:</span>
                        <span className="font-semibold text-zubo-text-neutral-800">
                          {format(new Date(selectedDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                    )}

                    {selectedTime && (
                      <div className="flex justify-between items-center py-3 border-b border-zubo-text-neutral-200">
                        <span className="text-zubo-text-neutral-600 font-medium">Time:</span>
                        <span className="font-semibold text-zubo-text-neutral-800">{selectedTime}</span>
                      </div>
                    )}

                    {bookingType === "recurring" && recurringPattern && (
                      <>
                        <div className="flex justify-between items-center py-3 border-b border-zubo-text-neutral-200">
                          <span className="text-zubo-text-neutral-600 font-medium">Sessions:</span>
                          <button
                            type="button"
                            className="font-semibold text-zubo-primary underline hover:text-zubo-accent transition-colors text-right"
                            onClick={() => setShowSessionDatesSheet(true)}
                          >
                            View Dates
                          </button>
                        </div>
                        <Sheet open={showSessionDatesSheet} onOpenChange={setShowSessionDatesSheet}>
                          <SheetContent side="bottom" className="h-full max-h-screen flex flex-col bg-zubo-background-50 text-zubo-text-800 border-zubo-background-200 rounded-t-2xl p-0">
                            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
                              <SheetHeader>
                                <SheetTitle className="text-zubo-text-neutral-800 flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-zubo-primary" />
                                  Session Dates
                                </SheetTitle>
                                <SheetDescription className="text-zubo-text-neutral-600">
                                  Here are all the dates your recurring booking will cover.
                                </SheetDescription>
                              </SheetHeader>
                              <div className="mt-6 space-y-2">
                                {getRecurringSessionsInfo().sessionDates.length === 0 ? (
                                  <div className="text-center text-zubo-text-neutral-500 py-8">
                                    No sessions found for the selected pattern and dates.
                                  </div>
                                ) : (
                                  <ul className="divide-y divide-zubo-background-200">
                                    {getRecurringSessionsInfo().sessionDates.map((date, idx) => (
                                      <li key={idx} className="flex items-center gap-3 py-3 px-2">
                                        <Calendar className="h-4 w-4 text-zubo-primary-600" />
                                        <span className="font-medium text-zubo-text-neutral-800">
                                          {format(new Date(date), "EEE, MMM dd, yyyy")}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <div className="sticky bottom-0 w-full bg-zubo-background-50 px-6 pb-6 pt-2 border-t border-zubo-background-200">
                              <SheetFooter className="w-full">
                                <SheetClose asChild>
                                  <Button className="w-full h-12 rounded-xl bg-zubo-primary text-white font-semibold text-base shadow-md hover:bg-zubo-primary-700 transition-colors">
                                    Close
                                  </Button>
                                </SheetClose>
                              </SheetFooter>
                            </div>
                          </SheetContent>
                        </Sheet>
                        {(() => {
                          const { sessions, servicePrice, totalPrice } = getRecurringSessionsInfo()
                          return sessions > 0 ? (
                            <>
                              <div className="pt-4 mt-4 bg-gradient-to-r from-zubo-accent/10 to-zubo-highlight-1/10 rounded-lg p-4 -mx-2">
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-zubo-text-neutral-600 font-medium">Total Sessions:</span>
                                  <span className="font-bold text-lg text-zubo-text-neutral-800">{sessions}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-zubo-text-neutral-600 font-medium">Price per Session:</span>
                                  <span className="font-semibold text-zubo-text-neutral-800">₹{servicePrice}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 bg-gradient-to-r from-zubo-primary/20 to-zubo-accent/20 rounded-lg px-4 mt-3">
                                  <span className="text-lg font-bold text-zubo-primary">Total Amount:</span>
                                  <span className="text-xl font-bold text-zubo-primary">₹{totalPrice}</span>
                                </div>
                              </div>
                            </>
                          ) : null
                        })()}
                      </>
                    )}
                  </div>
                </div>

                <Alert className="border-zubo-primary-200 bg-gradient-to-r from-zubo-primary/10 to-zubo-accent/10">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-zubo-primary-800">
                    💡 A caretaker will be assigned by our admin team after booking confirmation
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === "setup" && currentSubStep === "pet"}
            className="flex items-center gap-2 border-zubo-text-neutral-300 text-zubo-text-neutral-700 hover:bg-zubo-background-100 bg-white h-12 px-6 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep === "review" ? (
            <Button
              onClick={handleSubmit}
              className="flex items-center gap-2 h-12 rounded-lg bg-zubo-primary text-white font-semibold text-base shadow-md hover:bg-zubo-primary-700 transition-colors px-8"
            >
              Proceed to Payment
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="flex items-center gap-2 h-12 rounded-lg bg-zubo-primary text-white font-semibold text-base shadow-md hover:bg-zubo-primary-700 transition-colors px-8 disabled:bg-zubo-text-neutral-300 disabled:text-zubo-text-neutral-500"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
