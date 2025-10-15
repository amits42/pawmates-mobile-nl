"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ServiceOTPDialog } from "@/components/service-otp-dialog"
import { Calendar, Clock, DollarSign, MapPin, Phone, Mail, ArrowLeft, Repeat, ExternalLink } from "lucide-react"

type BookingDetails = {
  id: string
  service?: string
  date?: string
  time?: string
  duration?: number | string
  status?: string
  amount?: number
  notes?: string
  address?: string
  bookingType?: "regular" | "recurring_session"
  sequenceNumber?: number
  petId: string
  paymentStatus?: string
  mainBookingId?: string
  pet?: {
    name?: string
    type?: string
    breed?: string
    photo?: string
  }
  owner?: {
    name?: string
    phone?: string
    email?: string
    photo?: string
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return "Not scheduled"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateString || "-"
  }
}

function toMoney(n?: number) {
  if (typeof n !== "number") return "-"
  return `$${n.toFixed(2)}`
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  switch (status) {
    case "ASSIGNED":
    case "CONFIRMED":
    case "PENDING":
    case "UPCOMING":
      return (
        <Badge className="bg-gradient-to-r from-zubo-primary-100 to-zubo-primary-200 text-zubo-primary-800 border-zubo-primary-200 font-medium">
          Upcoming
        </Badge>
      )
    case "ONGOING":
      return (
        <Badge className="bg-gradient-to-r from-zubo-accent-100 to-zubo-accent-200 text-zubo-accent-800 border-zubo-accent-200 font-medium animate-pulse">
          In Progress
        </Badge>
      )
    case "COMPLETED":
      return (
        <Badge className="bg-gradient-to-r from-zubo-background-100 to-zubo-background-200 text-zubo-text-800 border-zubo-background-200 font-medium">
          Completed
        </Badge>
      )
    case "CANCELLED":
      return (
        <Badge className="bg-gradient-to-r from-zubo-highlight-1-100 to-zubo-highlight-1-200 text-zubo-highlight-1-800 border-zubo-highlight-1-200 font-medium">
          Cancelled
        </Badge>
      )
    default:
      return (
        <Badge className="bg-gradient-to-r from-zubo-background-100 to-zubo-background-200 text-zubo-text-800 border-zubo-background-200 font-medium">
          {status}
        </Badge>
      )
  }
}

function normalizeBooking(data: any, kind: "regular" | "recurring"): BookingDetails {
  // Safe getter across snake_case/camelCase
  const get = (obj: any, keys: string[], fallback?: any) => {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k]
    }
    return fallback
  }

  const bookingType: BookingDetails["bookingType"] = kind === "recurring" ? "recurring_session" : "regular"

  const pet = {
    name: get(data, ["pet_name", "petName", "pet?.name"]),
    type: get(data, ["pet_type", "petType", "pet?.type"]),
    breed: get(data, ["breed", "petBreed", "pet?.breed"]),
    photo: get(data, ["pet_photo", "petPhoto", "pet?.photo"]),
    id: get(data, ["pet_id", "petId", "pet?.id"]),
  }

  const owner = {
    name: get(data, ["owner_name", "ownerName", "owner?.name"], "Pet Owner"),
    phone: get(data, ["owner_phone", "ownerPhone", "owner?.phone"], "N/A"),
    email: get(data, ["owner_email", "ownerEmail", "owner?.email"]),
    photo: get(data, ["owner_photo", "ownerPhoto", "owner?.photo"]),
  }

  const details: BookingDetails = {
    id: get(data, ["id", "booking_id", "session_id"], ""),
    service: get(data, ["service", "service_name", "serviceName"]),
    date: get(data, ["date", "service_date", "scheduled_date"]),
    time: get(data, ["time", "service_time", "scheduled_time"]),
    duration: get(data, ["duration_hours", "duration", "service_duration"]),
    status: String(get(data, ["status"], "") || "").toUpperCase(),
    amount: get(data, ["amount", "price", "total_amount"]),
    notes: get(data, ["notes", "special_instructions"]),
    address: get(data, ["location", "address", "service_address"]),
    bookingType,
    sequenceNumber: get(data, ["sequence_number", "sequenceNumber"]),
    paymentStatus: get(data, ["payment_status", "paymentStatus"]),
    mainBookingId: kind === "recurring" ? get(data, ["main_booking_id", "mainBookingId", "booking_id"]) : undefined,
    pet,
    owner,
  }

  return details
}

export default function SitterBookingDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sitter, loading } = useAuth()

  // Accept multiple query param names to be resilient
  const sessionId = useMemo(
    () => searchParams.get("recurringBookingId") || searchParams.get("sessionId") || undefined,
    [searchParams],
  )
  const bookingId = useMemo(() => searchParams.get("bookingId") || searchParams.get("id") || undefined, [searchParams])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<BookingDetails | null>(null)

  // OTP dialog controls
  const [showStartOTP, setShowStartOTP] = useState(false)
  const [showEndOTP, setShowEndOTP] = useState(false)

  useEffect(() => {
    if (!loading && !sitter) {
      router.push("/login")
    }
  }, [loading, sitter, router])

  useEffect(() => {
    const load = async () => {
      if (!sitter) return
      if (!sessionId && !bookingId) {
        setError("Missing booking identifier")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Decide type based on what param you have
        const id = sessionId || bookingId
        const type = sessionId ? "recurring" : "regular"

        const res = await fetch(`/api/sitters/bookings/${id}?type=${type}`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": sitter.userId || sitter.id || "",
          },
        })

        if (!res.ok) throw new Error(`Failed to load booking (${res.status})`)

        const data = await res.json()
        setDetails(normalizeBooking(data, type)) // 👈 normalize with type
      } catch (e: any) {
        setError(e?.message || "Something went wrong")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [sitter, sessionId, bookingId])

  const canStart = useMemo(() => {
    const s = (details?.status || "").toUpperCase()
    return ["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(s)
  }, [details?.status])

  const canEnd = useMemo(() => {
    const s = (details?.status || "").toUpperCase()
    return s === "ONGOING"
  }, [details?.status])

  const title = details?.bookingType === "recurring_session" ? "Session Details" : "Booking Details"

  return (
    <div className="max-w-2xl md:max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 bg-zubo-background-100">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="bg-transparent border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-50"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-zubo-text-900 ml-2">{title}</h1>
      </div>

      <Card className="shadow-md rounded-xl border border-zubo-background-200 bg-zubo-background-50">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Avatar className="h-12 w-12 ring-2 ring-zubo-background-50 shadow-md">
                <AvatarImage
                  src={details?.pet?.photo || "/placeholder.svg?height=48&width=48&query=pet-avatar"}
                  alt={details?.pet?.name || "Pet"}
                />
                <AvatarFallback className="bg-gradient-to-br from-zubo-primary-400 to-zubo-highlight-2-500 text-zubo-background-50">
                  {(details?.pet?.name || "P").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-col xs:flex-row xs:items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg sm:text-xl text-zubo-text-900">{details?.pet?.name || "Pet"}</CardTitle>
                  {details?.bookingType === "recurring_session" && typeof details?.sequenceNumber === "number" && (
                    <Badge className="bg-zubo-highlight-2-100 text-zubo-highlight-2-800 text-xs">
                      <Repeat className="h-3 w-3 mr-1" />
                      Session #{details.sequenceNumber}
                    </Badge>
                  )}
                  {/* Pet profile link */}
                  {details?.pet.id && (
                    <Link
                      href={`/sitter/pets/${details.pet.id}`}
                      className="text-xs text-zubo-primary underline hover:text-zubo-highlight-2-700 flex items-center gap-1"
                      title="View Pet Profile"
                    >
                      <ExternalLink className="h-3 w-3 inline" /> Pet Profile
                    </Link>
                  )}
                </div>
                <CardDescription className="text-xs sm:text-sm text-zubo-text-600">
                  {details?.pet?.type || "Pet"} • {details?.pet?.breed || "Breed"}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-row flex-wrap gap-2 mt-3 sm:mt-0 items-center">
              <StatusBadge status={details?.status} />
              {details?.paymentStatus && details.paymentStatus !== "PAID" && (
                <Badge className="bg-zubo-highlight-2-100 text-zubo-highlight-2-800 text-xs border-zubo-highlight-2-200">
                  Payment Pending
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-zubo-background-200 rounded w-1/3" />
              <div className="h-24 bg-zubo-background-200 rounded" />
              <div className="h-4 bg-zubo-background-200 rounded w-1/4" />
              <div className="h-20 bg-zubo-background-200 rounded" />
            </div>
          ) : error ? (
            <div className="bg-zubo-highlight-1-50 border border-zubo-highlight-1-200 text-zubo-highlight-1-800 p-4 rounded-lg">
              {error}
            </div>
          ) : details ? (
            <>
              {/* Service Info */}
              <div className="bg-zubo-background-50 rounded-lg p-3 border border-zubo-background-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zubo-text-700">Service</span>
                  <span className="text-sm font-semibold text-zubo-text-900">{details.service || "Pet Service"}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-zubo-primary-100 rounded-full">
                      <Calendar className="h-3 w-3 text-zubo-primary-600" />
                    </div>
                    <span className="text-zubo-text-700">{formatDate(details.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-zubo-accent-100 rounded-full">
                      <Clock className="h-3 w-3 text-zubo-accent-600" />
                    </div>
                    <span className="text-zubo-text-700">{details.time || "-"}</span>
                  </div>
                  <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
                    <div className="p-1.5 bg-zubo-highlight-2-100 rounded-full">
                      <DollarSign className="h-3 w-3 text-zubo-highlight-2-600" />
                    </div>
                    <span className="font-semibold text-zubo-highlight-2-700">{toMoney(details.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start space-x-2">
                <div className="p-1.5 bg-zubo-highlight-1-100 rounded-full mt-0.5">
                  <MapPin className="h-3 w-3 text-zubo-highlight-1-600" />
                </div>
                <span className="text-sm text-zubo-text-700 flex-1">{details.address || "No address provided"}</span>
              </div>

              {/* Notes */}
              {details.notes && (
                <div className="bg-zubo-background-50 border border-zubo-background-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-zubo-text-700 mb-1">Notes</div>
                  <div className="text-sm text-zubo-text-800">{details.notes}</div>
                </div>
              )}

              {/* Owner */}
              <div className="border-t border-zubo-background-200 pt-4">
                <h4 className="text-sm font-medium text-zubo-text-500 mb-3">Pet Owner</h4>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10 ring-2 ring-zubo-background-50 shadow-sm">
                    <AvatarImage
                      src={details.owner?.photo || "/placeholder.svg?height=40&width=40&query=owner-avatar"}
                      alt={details.owner?.name || "Owner"}
                    />
                    <AvatarFallback className="bg-zubo-primary-400 text-zubo-background-50">
                      {(details.owner?.name || "O").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-zubo-text-900">{details.owner?.name || "Pet Owner"}</p>
                    {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-zubo-text-400 mr-2" />
                        <span className="text-sm text-zubo-text-800">{details.owner?.phone || "N/A"}</span>
                      </div>
                      {(details.owner?.email || "").length > 0 && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-zubo-text-400 mr-2" />
                          <span className="text-sm text-zubo-text-800">{details.owner?.email}</span>
                        </div>
                      )}
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Actions: Start/End Service */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                {canStart && (
                  <Button
                    onClick={() => setShowStartOTP(true)}
                    className="bg-gradient-to-r from-zubo-accent-500 to-zubo-accent-600 hover:from-zubo-accent-600 hover:to-zubo-accent-700 text-zubo-background-50 shadow-md transition-all duration-200"
                  >
                    Start Service
                  </Button>
                )}
                {canEnd && (
                  <Button
                    onClick={() => setShowEndOTP(true)}
                    className="bg-gradient-to-r from-zubo-highlight-1-500 to-zubo-highlight-1-600 hover:from-zubo-highlight-1-600 hover:to-zubo-highlight-1-700 text-zubo-background-50 shadow-md transition-all duration-200"
                  >
                    End Service
                  </Button>
                )}
              </div>

              {/* Link to full booking when viewing a session */}
              {details.bookingType === "recurring_session" && details.mainBookingId && (
                <div className="pt-2">
                  <Link
                    href={`/sitter/bookings/details?bookingId=${encodeURIComponent(details.mainBookingId)}`}
                    className="inline-flex items-center text-zubo-primary-700 hover:text-zubo-primary-800 underline underline-offset-4"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View full booking
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-zubo-text-600">No details found.</div>
          )}
        </CardContent>
      </Card>

      {/* OTP Dialogs */}
      <ServiceOTPDialog
        open={showStartOTP}
        onOpenChange={setShowStartOTP}
        bookingId={details?.id || ""}
        action="start"
        onSuccess={() => {
          // refresh details after successful OTP
          if (typeof window !== "undefined") {
            // Simple local refresh
            window.location.reload()
          }
        }}
      />
      <ServiceOTPDialog
        open={showEndOTP}
        onOpenChange={setShowEndOTP}
        bookingId={details?.id || ""}
        action="end"
        onSuccess={() => {
          if (typeof window !== "undefined") {
            window.location.reload()
          }
        }}
      />
    </div>
  )
}
