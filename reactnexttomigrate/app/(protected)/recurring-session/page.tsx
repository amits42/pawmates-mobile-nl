"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  User,
  Shield,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Toaster } from "@/components/ui/toaster"

type RawSession = {
  id: string
  user_id: string
  pet_id: string
  service_id: string
  sitter_id?: string | null
  sequence_number: number
  session_date: string
  session_time: string
  duration: number
  session_price: string | number
  status: string
  payment_status: string
  notes?: string | null
  cancellation_reason?: string | null
  service_started_at?: string | null
  service_ended_at?: string | null
  actual_duration?: number | null
  created_at: string
  updated_at: string
  main_booking_id?: string | null
  pet_name?: string | null
  service_name?: string | null
  sitter_name?: string | null
  sitter_phone?: string | null
}

type SessionDetail = {
  id: string
  mainBookingId?: string
  sequenceNumber: number
  date: string
  time: string
  duration: number
  price: number
  status: string
  paymentStatus: string
  notes?: string
  cancellationReason?: string
  serviceStartedAt?: string | null
  serviceEndedAt?: string | null
  actualDuration?: number | null
  createdAt: string
  updatedAt: string
  petName?: string
  serviceName?: string
  sitterId?: string
  sitterName?: string
  sitterPhone?: string
  startOtp?: string
  endOtp?: string
}

function toCamelSession(raw: RawSession): SessionDetail {
  return {
    id: raw.id,
    mainBookingId: raw.main_booking_id || undefined,
    sequenceNumber: raw.sequence_number,
    date: raw.session_date,
    time: raw.session_time,
    duration: raw.duration,
    price: typeof raw.session_price === "string" ? Number.parseFloat(raw.session_price) : raw.session_price || 0,
    status: raw.status,
    paymentStatus: raw.payment_status,
    notes: raw.notes || undefined,
    cancellationReason: raw.cancellation_reason || undefined,
    serviceStartedAt: raw.service_started_at || null,
    serviceEndedAt: raw.service_ended_at || null,
    actualDuration: raw.actual_duration ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    petName: raw.pet_name || undefined,
    serviceName: raw.service_name || undefined,
    sitterId: raw.sitter_id || undefined,
    sitterName: raw.sitter_name || undefined,
    sitterPhone: raw.sitter_phone || undefined,
  }
}

function formatDateLong(dateString?: string) {
  if (!dateString) return "Not scheduled"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateString
  }
}

function formatDateShort(dateString?: string) {
  if (!dateString) return "Not scheduled"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateString
  }
}

function StatusBadge({ status, sitterId, sitterName }: { status: string; sitterId?: string; sitterName?: string }) {
  const mapping: Record<string, { color: string; icon: JSX.Element; label?: string }> = {
    upcoming: {
      color: "bg-zubo-primary-50 text-zubo-primary-700 border-zubo-primary-200",
      icon: <Clock className="h-4 w-4 inline text-zubo-primary-600" />,
    },
    confirmed: {
      color: "bg-zubo-accent-50 text-zubo-accent-700 border-zubo-accent-200",
      icon: <CheckCircle className="h-4 w-4 inline text-zubo-accent-600" />,
    },
    pending: {
      color: "bg-zubo-highlight-2-50 text-zubo-highlight-2-700 border-zubo-highlight-2-200",
      icon: <Clock className="h-4 w-4 inline text-zubo-highlight-2-600" />,
    },
    ongoing: {
      color: "bg-zubo-highlight-1-50 text-zubo-highlight-1-700 border-zubo-highlight-1-200",
      icon: <Loader2 className="h-4 w-4 inline animate-spin text-zubo-highlight-1-600" />,
    },
    "in-progress": {
      color: "bg-zubo-highlight-1-50 text-zubo-highlight-1-700 border-zubo-highlight-1-200",
      icon: <Loader2 className="h-4 w-4 inline animate-spin text-zubo-highlight-1-600" />,
    },
    completed: {
      color: "bg-zubo-accent-50 text-zubo-accent-700 border-zubo-accent-200",
      icon: <CheckCircle className="h-4 w-4 inline text-zubo-accent-600" />,
    },
    cancelled: {
      color: "bg-destructive text-destructive-foreground border-destructive",
      icon: <AlertCircle className="h-4 w-4 inline text-destructive" />,
    },
    assigned: {
      color: "bg-zubo-primary-50 text-zubo-primary-700 border-zubo-primary-200",
      icon: <User className="h-4 w-4 inline text-zubo-primary-600" />,
    },
  }

  const n = (status || "").toLowerCase()
  if (n === "pending" || n === "assigned") {
    return null
  }
  const conf = mapping[n] || mapping.pending
  let label = status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"
  return (
    <Badge className={`${conf.color} font-medium px-3 py-1 text-sm`}>
      <span className="mr-1">{conf.icon}</span>
      {label}
    </Badge>
  )
}

function PaymentBadge({ paymentStatus }: { paymentStatus?: string }) {
  const config: Record<string, { color: string; icon: string; label?: string }> = {
    PAID: { color: "bg-zubo-accent-50 text-zubo-accent-700 border-zubo-accent-200", icon: "💳" },
    PENDING: { color: "bg-zubo-highlight-2-50 text-zubo-highlight-2-700 border-zubo-highlight-2-200", icon: "⏳" },
    FAILED: { color: "bg-destructive text-destructive-foreground border-destructive", icon: "❌" },
    REFUNDED: { color: "bg-zubo-primary-50 text-zubo-primary-700 border-zubo-primary-200", icon: "↩️" },
  }
  const s = (paymentStatus || "PENDING").toUpperCase()
  const c = config[s] || config.PENDING
  return (
    <Badge className={`${c.color} font-medium px-2 py-0.5 text-xs`}>
      <span className="mr-1">{c.icon}</span>
      {s === "PENDING" ? "Unpaid" : s}
    </Badge>
  )
}

export default function RecurringSessionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const sessionId = useMemo(
    () => searchParams.get("recurringBookingId") || searchParams.get("id") || "",
    [searchParams],
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loadingOtps, setLoadingOtps] = useState(false)

  useEffect(() => {
    if (!sessionId || !user?.id) return
    let ignore = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/bookings/recurring/session/${sessionId}`, {})
        const data = await res.json()
        if (!res.ok || data?.success === false) {
          throw new Error(data?.error || "Failed to fetch session")
        }
        const raw: RawSession = data.session
        const mapped = toCamelSession(raw)
        if (!ignore) setSession(mapped)
      } catch (e) {
        console.error("Failed to fetch session:", e)
        if (!ignore) setError(e instanceof Error ? e.message : "Failed to load session")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId || !user?.id || !session) return
    if (session.startOtp && session.endOtp) return // ✅ already loaded, skip

    let ignore = false
    const fetchOtps = async () => {
      setLoadingOtps(true)
      try {
        const res = await fetch(`/api/bookings/recurring/session/${sessionId}/otps`)
        const data = await res.json()

        const startOtp = data.startOtp
        const endOtp = data.endOtp

        if (!ignore) {
          setSession((prev) => (prev ? { ...prev, startOtp, endOtp } : prev))
        }
      } catch (e) {
        console.error("Failed to fetch OTPs:", e)
      } finally {
        if (!ignore) setLoadingOtps(false)
      }
    }

    fetchOtps()
    return () => {
      ignore = true
    }
  }, [sessionId, session])

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: `${label} Copied! ✅`,
      description: "Successfully copied to clipboard",
    })
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4">
          <Alert className="border-destructive bg-destructive/10 max-w-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Missing recurringBookingId. Please open this page from a valid session link.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary-600" />
              <h3 className="text-lg font-semibold text-zubo-text-800 mb-2">{"Loading session details"}</h3>
              <p className="text-sm text-zubo-text-600">{"Please wait..."}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-zubo-text-600 hover:text-zubo-text-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <Alert className="border-destructive bg-destructive/10 max-w-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error || "Session not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const hasSitterAssigned =
    session.sitterId &&
    session.sitterName &&
    session.sitterName.trim() !== "" &&
    session.sitterName.toLowerCase() !== "to be assigned" &&
    session.sitterName.toLowerCase() !== "sitter not assigned" &&
    session.sitterPhone

  return (
    <div className="min-h-screen bg-zubo-background-300">
      <div className="container mx-auto p-4 pb-20 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-zubo-text-600 hover:text-zubo-text-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {session.mainBookingId && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/booking-details/${session.mainBookingId}`)}
                  className="border-zubo-primary-300 text-zubo-primary-600 hover:bg-zubo-primary-50 bg-transparent"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Main Booking
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={session.status} sitterId={session.sitterId} sitterName={session.sitterName} />
              <PaymentBadge paymentStatus={session.paymentStatus} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-zubo-text-900 mt-3">
            {"Recurring Session"} {session.sequenceNumber ? `#${session.sequenceNumber}` : ""}
          </h1>
          {session.serviceName && (
            <p className="text-sm text-zubo-text-600">
              {session.serviceName}
              {session.petName ? ` • ${session.petName}` : ""}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-zubo-primary-50 to-zubo-highlight-1-50 border-b border-zubo-primary-200">
                <CardTitle className="flex items-center gap-3 text-zubo-text-900">
                  <div className="w-10 h-10 rounded-lg bg-zubo-background-50 flex items-center justify-center">
                    <span className="text-xl">🔄</span>
                  </div>
                  <div>
                    <span className="font-semibold">{session.serviceName || "Pet Care Service"}</span>
                    <div className="text-xs text-zubo-text-600">
                      {"Scheduled for"} {formatDateLong(session.date)} {"at"} {session.time || "Not set"}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-zubo-primary-600" />
                      <div>
                        <p className="text-sm text-zubo-text-500">Session Date</p>
                        <p className="font-medium text-zubo-text-900">{formatDateLong(session.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                      <Clock className="h-5 w-5 text-zubo-accent-600" />
                      <div>
                        <p className="text-sm text-zubo-text-500">Time • Duration</p>
                        <p className="font-medium text-zubo-text-900">
                          {(() => {
                            if (!session.time) return "Not set"
                            try {
                              const d = new Date(`1970-01-01T${session.time}`)
                              return d.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            } catch {
                              return session.time
                            }
                          })()} {session.duration ? `• ${session.duration} min` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                      <CreditCard className="h-5 w-5 text-zubo-highlight-1-600" />
                      <div>
                        <p className="text-sm text-zubo-text-500">Payment Status</p>
                        <p className="font-medium text-zubo-text-900">
                          {session.paymentStatus === "PENDING" ? "Unpaid" : session.paymentStatus}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                      <CreditCard className="h-5 w-5 text-zubo-highlight-2-600" />
                      <div>
                        <p className="text-sm text-zubo-text-500">Price</p>
                        <p className="font-medium text-lg text-zubo-text-900">₹{session.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes and Cancellation Reason */}
                {(session.notes || session.cancellationReason) && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {session.notes && (
                      <div className="p-4 rounded-lg bg-zubo-highlight-2-50 border border-zubo-highlight-2-200">
                        <h4 className="text-sm font-semibold text-zubo-text-800 mb-1">{"Notes"}</h4>
                        <p className="text-sm text-zubo-text-700">{session.notes}</p>
                      </div>
                    )}
                    {session.cancellationReason && (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                        <h4 className="text-sm font-semibold text-destructive mb-1">{"Cancellation Reason"}</h4>
                        <p className="text-sm text-destructive">{session.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service OTPs */}
            {(session.startOtp || session.endOtp) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                    <Shield className="h-5 w-5 text-zubo-highlight-2-600" />
                    {"Service Codes"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {session.startOtp && (
                      <div className="bg-gradient-to-r from-zubo-accent-50 to-zubo-accent-100 p-4 rounded-lg border border-zubo-accent-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-zubo-accent-600" />
                            <span className="font-medium text-zubo-accent-800">Pick-up Code</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-zubo-accent-100"
                            onClick={() => copy(session.startOtp!, "START OTP")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xl font-mono font-bold text-zubo-accent-900">{session.startOtp}</div>
                      </div>
                    )}

                    {session.paymentStatus !== "PENDING" ? (
                      session.endOtp && (
                        <div className="bg-gradient-to-r from-zubo-highlight-1-50 to-zubo-highlight-1-100 p-4 rounded-lg border border-zubo-highlight-1-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-zubo-highlight-1-600" />
                              <span className="font-medium text-zubo-highlight-1-800">Drop-off Code</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-zubo-highlight-1-100"
                              onClick={() => copy(session.endOtp!, "END OTP")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-xl font-mono font-bold text-zubo-highlight-1-900">{session.endOtp}</div>
                        </div>
                      )
                    ) : (
                      <div className="bg-zubo-background-50 p-4 rounded-lg border border-zubo-highlight-2-200 text-center">
                        <p className="text-sm text-zubo-text-600">
                          🔒 Drop-off Code will be shown once you complete the payment.
                        </p>
                      </div>
                    )}
                  </div>
                  {loadingOtps && (
                    <div className="flex items-center gap-2 text-sm text-zubo-text-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {"Loading OTPs..."}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sitter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-zubo-text-900">Zubo Walker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-zubo-primary-50 rounded-lg">
                  <div className="w-12 h-12 bg-zubo-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-zubo-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zubo-text-900">
                      {hasSitterAssigned ? session.sitterName : "To be assigned"}
                    </p>
                    <p className="text-sm text-zubo-text-600">
                      {hasSitterAssigned ? "Professional pet sitter" : "Will be assigned soon"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-zubo-text-900">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* <div className="flex items-center gap-2 text-sm text-zubo-text-600">
                  <Clock className="h-4 w-4 text-zubo-text-500" />
                  <span>
                    {"Created"}: {format(new Date(session.createdAt), "PPp")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zubo-text-600">
                  <Clock className="h-4 w-4 text-zubo-text-500" />
                  <span>
                    {"Updated"}: {format(new Date(session.updatedAt), "PPp")}
                  </span>
                </div>
                {session.serviceStartedAt && (
                  <div className="flex items-center gap-2 text-sm text-zubo-text-600">
                    <Clock className="h-4 w-4 text-zubo-text-500" />
                    <span>
                      {"Service Started"}: {format(new Date(session.serviceStartedAt), "PPp")}
                    </span>
                  </div>
                )}
                {session.serviceEndedAt && (
                  <div className="flex items-center gap-2 text-sm text-zubo-text-600">
                    <Clock className="h-4 w-4 text-zubo-text-500" />
                    <span>
                      {"Service Ended"}: {format(new Date(session.serviceEndedAt), "PPp")}
                    </span>
                  </div>
                )}
                {typeof session.actualDuration === "number" && (
                  <div className="flex items-center gap-2 text-sm text-zubo-text-600">
                    <Clock className="h-4 w-4 text-zubo-text-500" />
                    <span>
                      {"Actual Duration"}: {session.actualDuration} min
                    </span>
                  </div>
                )} */}
                <div className="pt-2 ">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/cancellation-policy?recurringBookingId=${session.id}`)}
                    className="w-full border-zubo-highlight-2-300 text-zubo-highlight-2-600 hover:bg-zubo-highlight-2-50 bg-transparent text-xs"
                  >
                    <Info className="mr-2 h-3 w-3" />
                    View Cancellation Policy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick link back to booking */}
            {/* {session.mainBookingId && (
              <Card className="border-zubo-primary-200 bg-gradient-to-r from-zubo-primary-50 to-zubo-highlight-1-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-zubo-text-700">{"Linked Booking"}</p>
                      <p className="font-semibold text-zubo-text-900">#{session.mainBookingId.slice(0, 8)}...</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/booking-details/${session.mainBookingId}`)}
                      className="border-zubo-primary-300 text-zubo-primary-600 hover:bg-zubo-primary-100 bg-transparent"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {"Open"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )} */}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
