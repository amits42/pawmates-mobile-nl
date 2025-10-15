"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import type { ElementType } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, addDays } from "date-fns"
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  MapPin,
  PawPrint,
  Repeat,
  User,
  Loader2,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { PetSelector } from "@/components/pet-selector"
import { ServiceSelector } from "@/components/service-selector"
import { MarketTimePicker } from "@/components/market-time-picker"
import { RecurringOptions } from "@/components/recurring-options"
import { MultiTimeSelector } from "@/components/multi-time-selector"

import { fetchUserPets, fetchServices } from "@/lib/api"
import { fetchUserAddresses } from "@/lib/address-api"

import type { Pet, Service, Address } from "@/types/api"

type BookingStep = "pet" | "service" | "address" | "schedule" | "review"

export default function BookServiceNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Data state
  const [pets, setPets] = useState<Pet[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])

  // Selection state
  const [selectedPet, setSelectedPet] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)

  // Schedule state
  const [bookingType, setBookingType] = useState<"one-time" | "recurring">("one-time")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]) // For recurring bookings
  const [recurringPattern, setRecurringPattern] = useState<string | null>(null)
  const [recurringEndDate, setRecurringEndDate] = useState<string>("")

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<BookingStep>("pet")
  const [showSessionDates, setShowSessionDates] = useState(false)

  const isRebook = searchParams?.get("rebook") === "true"
  const originalBookingId = searchParams?.get("originalBookingId")

  const minRecurringDate = useMemo(() => {
    return addDays(new Date(), 2).toISOString().split("T")[0]
  }, [])

  const minOneTimeDate = useMemo(() => {
    return new Date().toISOString().split("T")[0]
  }, [])

  useEffect(() => {
    if (bookingType === "one-time" && selectedDate) {
      const fetchAvailableSlots = async () => {
        setLoadingSlots(true)
        try {
          const response = await fetch(`/api/available-slots?date=${selectedDate}`)
          if (response.ok) {
            const data = await response.json()
            setAvailableSlots(data.availableSlots || [])
            console.log("[v0] Fetched available slots:", data.availableSlots)
          } else {
            console.error("[v0] Failed to fetch available slots")
            setAvailableSlots([])
          }
        } catch (error) {
          console.error("[v0] Error fetching available slots:", error)
          setAvailableSlots([])
        } finally {
          setLoadingSlots(false)
        }
      }
      fetchAvailableSlots()
    } else {
      setAvailableSlots([])
    }
  }, [selectedDate, bookingType])

  // Load initial data and defaults
  useEffect(() => {
    const load = async () => {
      try {
        const [petsData, servicesData, addressesData] = await Promise.all([
          fetchUserPets(),
          fetchServices(),
          fetchUserAddresses(),
        ])
        setPets(petsData)
        setServices(servicesData)
        setAddresses(addressesData || [])

        const def = addressesData?.find((a) => a.isDefault)
        if (def) setSelectedAddress(def.id)

        const hasBookingParams = searchParams?.get("pet") && searchParams?.get("service") && searchParams?.get("date")
        const isExistingBooking = searchParams?.get("bookingId") || searchParams?.get("recurringBookingId")

        if (hasBookingParams && !isExistingBooking) {
          // User is returning from payment page - restore their booking details
          console.log("🔄 Restoring booking details from URL params")

          const pet = searchParams.get("pet")
          const service = searchParams.get("service")
          const dateStr = searchParams.get("date")
          const address = searchParams.get("address")
          const recurring = searchParams.get("recurring") === "true"
          const time = searchParams.get("time")
          const pattern = searchParams.get("pattern")
          const endDateStr = searchParams.get("endDate")
          const timesStr = searchParams.get("times")

          // Restore selections
          if (pet) setSelectedPet(pet)
          if (service) setSelectedService(service)
          if (dateStr) setSelectedDate(dateStr)
          if (address) setSelectedAddress(address)

          // Restore booking type and schedule details
          if (recurring) {
            setBookingType("recurring")
            if (pattern) setRecurringPattern(pattern)
            if (endDateStr) setRecurringEndDate(endDateStr)

            // Restore multiple times for recurring
            if (timesStr) {
              try {
                const times = JSON.parse(timesStr)
                setSelectedTimes(times)
              } catch (e) {
                console.error("Failed to parse times:", e)
              }
            }

            // Navigate to review step since all details are filled
            setCurrentStep("review")
          } else {
            setBookingType("one-time")
            if (time) setSelectedTime(time)

            // Navigate to review step since all details are filled
            setCurrentStep("review")
          }

          console.log("✅ Booking details restored successfully")
        }
        // Rebook shortcut: fetch original booking and pre-fill ONLY from API
        else if (isRebook && originalBookingId) {
          try {
            const res = await fetch(`/api/bookings/${originalBookingId}`)
            if (res.ok) {
              const booking = await res.json()
              if (booking) {
                // Set pet, service, address from booking
                if (booking.petId) setSelectedPet(booking.petId.toString())
                if (booking.serviceId) setSelectedService(booking.serviceId.toString())
                if (booking.addressId) setSelectedAddress(booking.addressId.toString())
                // Set booking type (recurring or one-time)
                if (booking.recurring) {
                  setBookingType("recurring")
                  if (booking.recurringPattern) setRecurringPattern(booking.recurringPattern)
                  if (booking.recurringEndDate) setRecurringEndDate(booking.recurringEndDate)
                  // Set multiple times for recurring bookings
                  if (booking.times) setSelectedTimes(JSON.parse(booking.times))
                } else {
                  setBookingType("one-time")
                  // Set single time for one-time bookings
                  if (booking.time) setSelectedTime(booking.time)
                }
                // Skip to schedule step
                setCurrentStep("schedule")
              }
            }
          } catch (err) {
            // fallback: do nothing, let user proceed manually
            console.error("Failed to fetch original booking for rebook", err)
          }
        }
      } catch (e: any) {
        console.error(e)
        setError("Something went wrong while loading booking data.")
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helpers
  const steps: Array<{ key: BookingStep; label: string; icon: ElementType }> = useMemo(
    () => [
      { key: "pet", label: "Pet", icon: Heart },
      { key: "service", label: "Service", icon: User },
      { key: "address", label: "Address", icon: MapPin },
      { key: "schedule", label: "Schedule", icon: Calendar },
      { key: "review", label: "Review", icon: Check },
    ],
    [],
  )

  const isCompleted = (step: BookingStep) => {
    switch (step) {
      case "pet":
        return !!selectedPet
      case "service":
        return !!selectedService
      case "address":
        return !!selectedAddress
      case "schedule":
        if (bookingType === "recurring") {
          return Boolean(selectedDate && selectedTimes.length > 0 && recurringPattern && recurringEndDate)
        }
        return Boolean(selectedDate && selectedTime)
      case "review":
        return false
      default:
        return false
    }
  }

  const canProceed = () => isCompleted(currentStep)

  const nextStep = () => {
    const order: BookingStep[] = ["pet", "service", "address", "schedule", "review"]
    const idx = order.indexOf(currentStep)
    if (idx < order.length - 1 && canProceed()) {
      setCurrentStep(order[idx + 1])
    }
  }

  const prevStep = () => {
    const order: BookingStep[] = ["pet", "service", "address", "schedule", "review"]
    const idx = order.indexOf(currentStep)
    if (idx > 0) {
      setCurrentStep(order[idx - 1])
    }
  }

  // Address display
  const formatAddress = (a: Address) => [a.line1, a.city, a.state].filter(Boolean).join(", ")
  const selectedPetName = pets.find((p) => p.id === selectedPet)?.name || ""
  const selectedServiceData = services.find((s) => s.id === selectedService)
  const selectedServiceName = selectedServiceData?.name || ""
  const selectedServicePrice = selectedServiceData?.price || 0
  const selectedAddressLabel =
    addresses.find((a) => a.id === selectedAddress)?.line1 ||
    addresses.find((a) => a.id === selectedAddress)?.city ||
    ""

  // Recurring calculation helpers
  function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay()
    const offset = (7 + weekday - firstDayOfWeek) % 7
    const date = 1 + offset + (nth - 1) * 7
    const result = new Date(year, month, date)
    return result.getMonth() === month ? result : null
  }

  const calculateRecurringSessions = (): Date[] => {
    if (bookingType !== "recurring" || !recurringPattern || !selectedDate || !recurringEndDate) return []
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

    const dates: Date[] = []

    // weekly: "weekly_<interval>_<monday,tuesday,...>"
    if (recurringPattern.startsWith("weekly_")) {
      const [, intervalStr, daysStr] = recurringPattern.split("_")
      const interval = Number.parseInt(intervalStr, 10) || 1
      const weekdays = (daysStr || "")
        .split(",")
        .filter(Boolean)
        .map((d) => daysOfWeekMap[d])

      const cursor = new Date(startDate)
      // normalize cursor to beginning of the week of startDate
      while (cursor <= endDate) {
        for (const weekday of weekdays) {
          if (weekday === undefined) continue
          const d = new Date(cursor)
          d.setDate(cursor.getDate() + ((weekday - cursor.getDay() + 7) % 7))
          if (d >= startDate && d <= endDate) dates.push(new Date(d))
        }
        cursor.setDate(cursor.getDate() + interval * 7)
      }
    }
    // monthly: "monthly_<interval>_<nth>_<monday,...>"
    else if (recurringPattern.startsWith("monthly_")) {
      const [, intervalStr, nthStr, daysStr] = recurringPattern.split("_")
      const interval = Number.parseInt(intervalStr, 10) || 1
      const nth = Number.parseInt(nthStr, 10) || 1
      const weekdays = (daysStr || "")
        .split(",")
        .filter(Boolean)
        .map((d) => daysOfWeekMap[d])

      const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      while (cursor <= endDate) {
        const y = cursor.getFullYear()
        const m = cursor.getMonth()
        for (const weekday of weekdays) {
          if (weekday === undefined) continue
          const d = getNthWeekdayOfMonth(y, m, weekday, nth)
          if (d && d >= startDate && d <= endDate) dates.push(new Date(d))
        }
        cursor.setMonth(cursor.getMonth() + interval)
        cursor.setDate(1)
      }
    }
    // fallback: no matching pattern -> return empty
    return dates.sort((a, b) => a.getTime() - b.getTime())
  }

  const sessionsInfo = useMemo(() => {
    const sessionDates = calculateRecurringSessions()
    const timesPerDay = bookingType === "recurring" ? selectedTimes.length : 1
    const sessions = sessionDates.length * timesPerDay
    const totalPrice = sessions * selectedServicePrice
    return { sessionDates, sessions, totalPrice, pricePerSession: selectedServicePrice, timesPerDay }
  }, [recurringPattern, recurringEndDate, selectedDate, selectedServicePrice, bookingType, selectedTimes])

  const formatRecurringText = () => {
    if (bookingType !== "recurring" || !recurringPattern) return ""
    if (recurringPattern.startsWith("daily_")) {
      const [, day] = recurringPattern.split("_")
      return `Every ${day}`
    }
    if (recurringPattern.startsWith("weekly_")) {
      const [, interval, days] = recurringPattern.split("_")
      const prettyDays = (days || "")
        .split(",")
        .filter(Boolean)
        .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
        .join(", ")
      return interval === "1" ? `Every week on ${prettyDays}` : `Every ${interval} weeks on ${prettyDays}`
    }
    if (recurringPattern.startsWith("monthly_")) {
      const [, interval, nth, days] = recurringPattern.split("_")
      const nthMap: Record<string, string> = { "1": "1st", "2": "2nd", "3": "3rd", "4": "4th", last: "Last" }
      const prettyDays = (days || "")
        .split(",")
        .filter(Boolean)
        .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
        .join(", ")
      return interval === "1"
        ? `Every month on the ${nthMap[nth] || nth} ${prettyDays}`
        : `Every ${interval} months on the ${nthMap[nth] || nth} ${prettyDays}`
    }
    return recurringPattern
  }

  const progressPercent = useMemo(() => {
    const order: BookingStep[] = ["pet", "service", "address", "schedule", "review"]
    const idx = order.indexOf(currentStep)
    const completedBefore = order.slice(0, idx).filter(isCompleted).length
    const current = isCompleted(currentStep) ? 1 : 0
    return ((completedBefore + current) / order.length) * 100
  }, [
    currentStep,
    selectedPet,
    selectedService,
    selectedAddress,
    bookingType,
    selectedDate,
    selectedTime,
    recurringPattern,
    recurringEndDate,
  ])

  const submit = () => {
    const params = new URLSearchParams({
      pet: selectedPet || "",
      service: selectedService || "",
      date: selectedDate,
      address: selectedAddress || "",
      recurring: (bookingType === "recurring").toString(),
    })

    if (bookingType === "recurring") {
      params.append("times", JSON.stringify(selectedTimes))
      params.append("pattern", recurringPattern || "")
      params.append("endDate", recurringEndDate)
      params.append("sessions", String(sessionsInfo.sessions))
      params.append("totalPrice", String(sessionsInfo.totalPrice))
    } else {
      params.append("time", selectedTime || "")
    }

    if (isRebook && originalBookingId) {
      params.append("rebook", "true")
      params.append("originalBookingId", originalBookingId)
    }
    router.push(`/book-service/payment?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-content-center bg-zubo-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary-600" />
          <p className="text-zubo-text-700">Getting things ready for your booking…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-content-center bg-zubo-background">
        <div className="max-w-md mx-auto p-6 rounded-xl border bg-white">
          <Alert className="border-zubo-highlight-1-300 bg-zubo-highlight-1-50">
            <AlertDescription className="text-zubo-text-800">{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-right">
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zubo-background">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-zubo-accent-200/40 blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-zubo-highlight-1-200/40 blur-[80px]" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pt-10">
          <div className="rounded-2xl border border-zubo-highlight-2-100 bg-gradient-to-br from-zubo-primary-50 to-zubo-accent-50 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute right-4 top-4 hidden md:block">
              <PawPrint className="h-10 w-10 text-zubo-primary-300 opacity-60" />
            </div>
            <div className="flex items-start gap-4 md:gap-6">
              <div className="flex-1">
                <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-zubo-primary-700 tracking-tight">
                  Almost there – your pet’s walk is loading up
                </h1>
                <p className="mt-1 md:mt-2 text-sm md:text-base text-zubo-text-600">
                  Pick your pet, location, and a schedule. We’ll handle the rest.
                </p>
              </div>
            </div>

            {/* Step progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-zubo-text-700 font-medium">
                  {(() => {
                    const order = ["pet", "service", "address", "schedule", "review"]
                    const idx = order.indexOf(currentStep)
                    let completed = 0
                    for (let i = 0; i <= idx; i++) {
                      if (isCompleted(order[i])) completed++
                    }
                    return `${completed} completed of ${order.length} steps`
                  })()}
                </div>
                <div className="text-xs text-zubo-text-500">
                  Step {(() => {
                    const order = ["pet", "service", "address", "schedule", "review"]
                    return order.indexOf(currentStep) + 1
                  })()} of 5
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-zubo-background-300 overflow-hidden">
                <div
                  className="h-full rounded-full bg-zubo-accent-600 transition-all duration-700 ease-out"
                  style={{
                    width: `${(() => {
                      const order = ["pet", "service", "address", "schedule", "review"]
                      const idx = order.indexOf(currentStep)
                      let completed = 0
                      for (let i = 0; i <= idx; i++) {
                        if (isCompleted(order[i])) completed++
                      }
                      return (completed / order.length) * 100
                    })()}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[320px_1fr] pb-24 md:pb-15">
        {/* Sidebar steps */}
        <aside className="hidden md:block">
          <Card className="sticky top-6 border-zubo-highlight-2-100 bg-white/90 backdrop-blur-sm shadow-sm">
            <CardContent>
              <div className="mb-3 flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium text-zubo-text-700">Booking Progress</div>
                  <div className="text-xs text-zubo-text-500">Complete steps to continue</div>
                </div>
                <div className="text-xs font-semibold text-zubo-primary-700">{Math.round(progressPercent)}%</div>
              </div>

              <div className="space-y-2">
                {steps.map(({ key, label, icon: Icon }) => {
                  const active = currentStep === key
                  const complete = isCompleted(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCurrentStep(key)}
                      className={[
                        "w-full flex items-center gap-3 rounded-xl border p-2 text-left transition",
                        active
                          ? "bg-zubo-primary-50 border-zubo-primary-200"
                          : complete
                            ? "bg-zubo-accent-50 border-zubo-accent-100"
                            : "bg-white border-zubo-background-300 hover:bg-zubo-background-100 focus-visible:ring-2 focus-visible:ring-zubo-accent-600",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "grid h-8 w-8 place-content-center rounded-full border",
                          active
                            ? "bg-zubo-primary-600 text-white border-zubo-primary-600"
                            : "bg-white text-zubo-text-500",
                        ].join(" ")}
                      >
                        {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-zubo-text-800">{label}</div>
                        <div className="text-xs text-zubo-text-500 capitalize">{key}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <Separator className="my-3 bg-zubo-highlight-2-100" />
              <div className="rounded-lg border border-zubo-accent-200 bg-zubo-accent-50 p-3">
                <div className="text-xs text-zubo-text-700">
                  Pro tip: Use Recurring to lock in consistent care and save time each week.
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Flow content */}
        <section className="space-y-6">
          <Card className="border-zubo-highlight-2-100 bg-white/90 backdrop-blur-sm shadow-sm">
            <CardHeader className="bg-gradient-to-r from-zubo-primary-50 to-zubo-accent-50 rounded-t-xl p-4">
              <div className="flex items-start gap-3">
                <div>
                  <CardTitle className="text-xl text-zubo-text-900">
                    {currentStep === "pet" && "Select Your Pet"}
                    {currentStep === "service" && "Choose a Service"}
                    {currentStep === "address" && "Confirm Your Address"}
                    {currentStep === "schedule" && "Set Your Schedule"}
                    {currentStep === "review" && "Review and Confirm Booking"}
                  </CardTitle>
                  <CardDescription className="text-zubo-text-600">{/* optional description */}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {currentStep === "pet" && (
                <PetSelector
                  pets={pets}
                  selectedPetId={selectedPet}
                  onSelectPet={setSelectedPet}
                  onPetsUpdate={setPets}
                />
              )}

              {currentStep === "service" && (
                <ServiceSelector
                  services={services}
                  selectedServiceId={selectedService}
                  onSelectService={setSelectedService}
                />
              )}

              {currentStep === "address" && (
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-12 text-zubo-text-500">
                      <MapPin className="h-14 w-14 mx-auto mb-4 text-zubo-text-300" />
                      <p className="font-medium">No addresses found</p>
                      <p className="text-sm">Please add an address in your profile first.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {addresses.map((a) => {
                        const selected = a.id === selectedAddress
                        return (
                          <Card
                            key={a.id}
                            className={[
                              "cursor-pointer transition-all",
                              selected
                                ? "ring-2 ring-zubo-primary-500 border-zubo-primary-500"
                                : "border-zubo-text-neutral-200 hover:border-zubo-primary-300",
                            ].join(" ")}
                            onClick={() => setSelectedAddress(a.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-zubo-text-900">{formatAddress(a)}</div>
                                  {/* <div className="text-sm text-zubo-text-600">{formatAddress(a)}</div> */}
                                  {a.landmark && (
                                    <div className="text-xs text-zubo-text-500 mt-1">
                                      {"📍"} {a.landmark}
                                    </div>
                                  )}
                                </div>
                                {a.isDefault && (
                                  <Badge className="bg-zubo-accent-100 text-zubo-accent-800 border border-zubo-accent-200">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentStep === "schedule" && (
                <div className="space-y-6">
                  <Tabs value={bookingType} onValueChange={(v) => setBookingType(v as "one-time" | "recurring")}>
                    <TabsList className="grid w-full grid-cols-2 bg-zubo-background-100 h-12 rounded-lg">
                      <TabsTrigger
                        value="one-time"
                        className="data-[state=active]:bg-white data-[state=active]:text-zubo-primary-700 text-sm font-medium"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        One-time
                      </TabsTrigger>
                      <TabsTrigger
                        value="recurring"
                        className="data-[state=active]:bg-white data-[state=active]:text-zubo-primary-700 text-sm font-medium"
                      >
                        <Repeat className="h-4 w-4 mr-2" />
                        Recurring
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="one-time" className="mt-6 space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            min={minOneTimeDate}
                            value={selectedDate}
                            onChange={(e) => {
                              setSelectedDate(e.target.value)
                              setSelectedTime(null)
                            }}
                            className="h-12 rounded-lg border-zubo-background-300 focus-visible:ring-2 focus-visible:ring-zubo-accent-600"
                          />
                        </div>
                        <MarketTimePicker
                          value={selectedTime}
                          onChange={setSelectedTime}
                          step={15}
                          min="05:00"
                          max="22:00"
                          label="Time"
                          serviceDate={selectedDate}
                          availableSlots={availableSlots}
                          disabled={!selectedDate || loadingSlots}
                        />
                      </div>
                      {loadingSlots && (
                        <div className="flex items-center gap-2 text-sm text-zubo-text-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Checking available time slots...</span>
                        </div>
                      )}
                      {!loadingSlots && selectedDate && availableSlots.length === 0 && (
                        <Alert className="border-amber-300 bg-amber-50">
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-amber-800">
                            No available time slots for this date. Please select a different date.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="recurring" className="mt-6 space-y-6">
                      <Alert className="border-zubo-primary-200 bg-zubo-primary-50">
                        <Info className="h-4 w-4 text-zubo-primary-700" />
                        <AlertDescription className="text-zubo-text-800">
                          <span className="font-medium">Need a walk sooner?</span> Recurring bookings require at least 2
                          days advance notice to ensure consistent walker availability. For immediate walks (within 2
                          days), please use the <span className="font-semibold">One-time</span> booking option above.
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            min={minRecurringDate}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="h-12 rounded-lg border-zubo-background-300 focus-visible:ring-2 focus-visible:ring-zubo-accent-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-date">End Date</Label>
                          <Input
                            id="end-date"
                            type="date"
                            min={selectedDate && selectedDate >= minRecurringDate ? selectedDate : minRecurringDate}
                            value={recurringEndDate}
                            onChange={(e) => setRecurringEndDate(e.target.value)}
                            className="h-12 rounded-lg border-zubo-background-300 focus-visible:ring-2 focus-visible:ring-zubo-accent-600"
                          />
                        </div>
                      </div>

                      <MultiTimeSelector
                        value={selectedTimes}
                        onChange={setSelectedTimes}
                        maxTimes={4}
                        step={15}
                        min="05:00"
                        max="22:00"
                        label="Walk Times (up to four per day)"
                        serviceDate={selectedDate}
                      />

                      <div className="pt-2">
                        <RecurringOptions
                          selectedPattern={recurringPattern}
                          onSelectPattern={setRecurringPattern}
                          endDate={recurringEndDate ? new Date(recurringEndDate) : undefined}
                          onSelectEndDate={(d) => setRecurringEndDate(d ? d.toISOString().split("T")[0] : "")}
                        />
                      </div>

                      {bookingType === "recurring" && recurringPattern && (
                        <div className="rounded-xl border border-zubo-primary-100 bg-gradient-to-r from-zubo-accent-50 to-zubo-highlight-1-50 p-4">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium text-zubo-text-800">Pattern:</span>
                            <span className="text-zubo-primary-700">{formatRecurringText()}</span>
                            <Separator className="h-4 w-px bg-zubo-background-300" />
                            <button
                              type="button"
                              className="text-zubo-primary-700 underline underline-offset-2 hover:text-zubo-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zubo-accent-600 rounded"
                              onClick={() => setShowSessionDates(true)}
                            >
                              View session dates
                            </button>
                          </div>
                          {sessionsInfo.sessions > 0 && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <div className="rounded-lg bg-white border border-zubo-background-300 p-3">
                                <div className="text-xs text-zubo-text-500">Total Sessions</div>
                                <div className="text-lg font-semibold text-zubo-text-900">{sessionsInfo.sessions}</div>
                                <div className="text-xs text-zubo-text-500 mt-1">
                                  {sessionsInfo.sessionDates.length} days × {sessionsInfo.timesPerDay} times
                                </div>
                              </div>
                              <div className="rounded-lg bg-white border border-zubo-background-300 p-3">
                                <div className="text-xs text-zubo-text-500">Price/Session</div>
                                <div className="text-lg font-semibold text-zubo-text-900">
                                  ₹{sessionsInfo.pricePerSession}
                                </div>
                              </div>
                              <div className="rounded-lg bg-white border border-zubo-background-300 p-3">
                                <div className="text-xs text-zubo-text-500">Total</div>
                                <div className="text-lg font-extrabold text-zubo-primary-700">
                                  ₹{sessionsInfo.totalPrice}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {currentStep === "review" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-zubo-primary-100 bg-gradient-to-r from-zubo-background-100 to-zubo-primary-50 p-4">
                    <div className="grid gap-3">
                      <Row label="Pet" value={selectedPetName} />
                      <Row label="Service" value={selectedServiceName} />
                      <Row label="Address" value={selectedAddressLabel} />
                      {bookingType === "recurring" && sessionsInfo.sessionDates.length > 0 ? (
                        <>
                          <Row
                            label="Start Date"
                            value={format(new Date(sessionsInfo.sessionDates[0]), "EEE, MMM dd, yyyy")}
                          />
                          <Row
                            label="End Date"
                            value={format(
                              new Date(sessionsInfo.sessionDates[sessionsInfo.sessionDates.length - 1]),
                              "EEE, MMM dd, yyyy",
                            )}
                          />
                        </>
                      ) : (
                        selectedDate && <Row label="Date" value={format(new Date(selectedDate), "EEE, MMM dd, yyyy")} />
                      )}
                      {bookingType === "recurring" && selectedTimes.length > 0 && (
                        <Row
                          label="Times"
                          value={
                            <div className="flex flex-wrap gap-1 justify-end">
                              {selectedTimes.map((time) => {
                                const [h, m] = time.split(":")
                                const hour = Number(h)
                                const ampm = hour >= 12 ? "PM" : "AM"
                                const hour12 = hour % 12 === 0 ? 12 : hour % 12
                                return (
                                  <Badge key={time} variant="secondary" className="text-xs">
                                    {hour12}:{m} {ampm}
                                  </Badge>
                                )
                              })}
                            </div>
                          }
                        />
                      )}
                      {bookingType === "one-time" && selectedTime && (
                        <Row
                          label="Time"
                          value={(() => {
                            const [h, m] = selectedTime.split(":")
                            const hour = Number(h)
                            const ampm = hour >= 12 ? "PM" : "AM"
                            const hour12 = hour % 12 === 0 ? 12 : hour % 12
                            return `${hour12}:${m} ${ampm}`
                          })()}
                        />
                      )}
                      {bookingType === "recurring" && recurringPattern && (
                        <>
                          <Row label="Pattern" value={formatRecurringText()} />
                          <Row
                            label="Sessions"
                            value={
                              <button
                                type="button"
                                className="text-zubo-primary-700 underline underline-offset-2 hover:text-zubo-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zubo-accent-600 rounded"
                                onClick={() => setShowSessionDates(true)}
                              >
                                View Dates
                              </button>
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <Alert className="border-zubo-accent-300 bg-zubo-accent-50">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-zubo-text-800">
                      We'll share your Zubo Walker's profile two hours before the walk, and they will also contact you
                      before arriving.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Sticky footer actions above bottom navbar on mobile */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 border-t border-zubo-highlight-2-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="hidden md:flex items-center gap-2 text-sm text-zubo-text-600">
            <PawPrint className="h-4 w-4 text-zubo-primary-600" />
            {currentStep !== "review" ? (
              <span>Complete all steps to continue</span>
            ) : (
              <span>Review complete — proceed to payment</span>
            )}
          </div>
          <div className="flex w-full md:w-auto items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === "pet"}
              className="h-11 rounded-lg border-zubo-background-300 bg-white text-zubo-text-700 hover:bg-zubo-background-100 focus-visible:ring-2 focus-visible:ring-zubo-accent-600"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {currentStep === "review" ? (
              <Button
                onClick={submit}
                className="h-11 rounded-xl bg-zubo-primary-600 text-white shadow-md hover:bg-zubo-primary-700 focus-visible:ring-2 focus-visible:ring-zubo-accent-600 px-6"
              >
                Proceed to Payment
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="h-11 rounded-xl bg-zubo-primary-600 text-white shadow-md hover:bg-zubo-primary-700 focus-visible:ring-2 focus-visible:ring-zubo-accent-600 px-6 disabled:bg-zubo-background-300 disabled:text-zubo-text-500"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Session dates sheet */}
      <Sheet open={showSessionDates} onOpenChange={setShowSessionDates}>
        <SheetContent
          side="bottom"
          className="h-[85vh] max-h-screen bg-zubo-background-100 border-zubo-background-300 p-0"
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="p-6">
              <SheetTitle className="flex items-center gap-2 text-zubo-text-900">
                <Calendar className="h-5 w-5 text-zubo-primary-700" />
                Session Dates
              </SheetTitle>
              <p className="text-sm text-zubo-text-600">All dates included in this recurring booking.</p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {bookingType === "recurring" && sessionsInfo.sessionDates.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zubo-primary-600" />
                    <span className="text-sm text-zubo-text-700 font-medium">Start Date:</span>
                    <span className="font-semibold text-zubo-text-900">
                      {format(new Date(sessionsInfo.sessionDates[0]), "EEE, MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zubo-primary-600" />
                    <span className="text-sm text-zubo-text-700 font-medium">End Date:</span>
                    <span className="font-semibold text-zubo-text-900">
                      {format(
                        new Date(sessionsInfo.sessionDates[sessionsInfo.sessionDates.length - 1]),
                        "EEE, MMM dd, yyyy",
                      )}
                    </span>
                  </div>
                </div>
              )}
              {sessionsInfo.sessionDates.length === 0 ? (
                <div className="grid h-full place-content-center text-zubo-text-500">No sessions to show.</div>
              ) : (
                <ul className="divide-y divide-zubo-background-300 rounded-xl border border-zubo-background-300 bg-white">
                  {sessionsInfo.sessionDates.map((d, i) => (
                    <li key={i} className="flex items-center gap-3 p-3">
                      <Calendar className="h-4 w-4 text-zubo-primary-600" />
                      <span className="font-medium text-zubo-text-800">{format(new Date(d), "EEE, MMM dd, yyyy")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-zubo-background-300 bg-white p-6">
              <SheetFooter>
                <SheetClose asChild>
                  <Button className="w-full h-11 rounded-xl bg-zubo-primary-600 text-white hover:bg-zubo-primary-700 focus-visible:ring-2 focus-visible:ring-zubo-accent-600">
                    Close
                  </Button>
                </SheetClose>
              </SheetFooter>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zubo-background-300 pb-3 last:border-0">
      <div className="text-sm text-zubo-text-600">{label}</div>
      <div className="text-sm font-semibold text-zubo-text-900 text-right">{value || "-"}</div>
    </div>
  )
}
