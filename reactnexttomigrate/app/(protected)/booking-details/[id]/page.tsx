"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Repeat,
  User,
  Shield,
  HelpCircle,
  Loader2,
  Copy,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Heart,
  CreditCard,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  XCircle,
  ExternalLink,
  MapPin,
  IndianRupee,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { RebookButton } from "@/components/rebook-button"
import { SessionCancellationDialog } from "@/components/session-cancellation-dialog"
import type { Booking } from "@/types/api"
import { format } from "date-fns"
import { parse } from "date-fns"
import Image from "next/image"
import { BookingCancellationDialog } from "@/components/booking-cancellation-dialog"
import { Toaster } from "@/components/ui/toaster"

interface RecurringSession {
  id: string
  sequenceNumber: number
  sessionDate: string
  sessionTime: string
  sessionPrice: number
  status: string
  paymentStatus: string
  duration: number
  notes?: string
  startOtp?: string
  endOtp?: string
  sitterId?: string
  sitterName?: string
  sitterPhone?: string
}

interface CancellationPolicy {
  percentageDeduction: number
  description: string
  refundAmount: number
  deductionAmount: number
  processingTime: string
  canRefund: boolean
}

interface RefundStatus {
  id: string
  refundId: string
  amount: number
  status: string
  bookingId?: string
  sessionId?: string
  sequenceNumber?: number
  sessionDate?: string
  initiatedAt: string
  processedAt?: string
  failedAt?: string
  failureReason?: string
  estimatedProcessingTime: string
}

const formatDate = (dateString: string) => {
  if (!dateString) return "Not scheduled"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

const formatDateShort = (dateString: string) => {
  if (!dateString) return "Not scheduled"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

const formatRecurringPattern = (pattern: string) => {
  if (!pattern) return "One-time service"

  if (pattern.startsWith("weekly_")) {
    const parts = pattern.split("_")
    const interval = parts[1]
    const days = parts.slice(2).join("_").split(",")

    if (days.length === 7) return `Every day`
    if (days.length === 5 && !days.includes("saturday") && !days.includes("sunday")) {
      return `Weekdays only`
    }
    if (days.length === 2 && days.includes("saturday") && days.includes("sunday")) {
      return `Weekends only`
    }

    const dayNames = days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")
    return interval === "1" ? `Weekly on ${dayNames}` : `Every ${interval} weeks on ${dayNames}`
  }

  if (pattern.startsWith("monthly_")) {
    return `Monthly service`
  }

  return pattern
}

const getServiceIcon = (service: string) => {
  const iconMap: { [key: string]: string } = {
    "dog walking": "/landing-icons/Walking.png",
    "pet sitting": "/landing-icons/boarding-daycare.svg",
    grooming: "/landing-icons/Grooming.png",
    "pet grooming": "/landing-icons/Grooming.png",
    veterinary: "/landing-icons/vet.svg",
    training: "/landing-icons/training.svg",
    boarding: "/landing-icons/boarding-daycare.svg",
  }
  const serviceLower = service?.toLowerCase() || ""
  const match = Object.entries(iconMap).find(([key]) => serviceLower.includes(key))
  if (match) {
    const [_, src] = match
    return <Image src={src || "/placeholder.svg"} alt={service} width={40} height={40} className="h-8 w-8" priority />
  }
  // fallback to paw emoji
  return <span className="text-2xl">🐾</span>
}

const hasSessionSitterAssigned = (session: RecurringSession) => {
  return (
    session.sitterId &&
    session.sitterName &&
    session.sitterName.trim() !== "" &&
    session.sitterName.toLowerCase() !== "to be assigned" &&
    session.sitterName.toLowerCase() !== "sitter not assigned" &&
    session.sitterPhone
  )
}

export default function BookingDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [sessions, setSessions] = useState<RecurringSession[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy | null>(null)
  const [sessionCancellationPolicies, setSessionCancellationPolicies] = useState<{ [key: string]: CancellationPolicy }>(
    {},
  )
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null)
  const [refunds, setRefunds] = useState<RefundStatus[]>([])
  const [showRefunds, setShowRefunds] = useState(false)
  const [showBookingCancellationDialog, setShowBookingCancellationDialog] = useState(false)

  const bookingId = params?.id as string

  useEffect(() => {
    if (bookingId && user?.id) {
      fetchBookingDetails()
      fetchRefundStatus()
    }
  }, [bookingId, user])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch booking details")
      }

      const foundBooking = await response.json()

      if (!foundBooking) {
        throw new Error("Booking not found")
      }

      setBooking(foundBooking)

      // If it's a recurring booking, fetch sessions
      if (foundBooking.recurring) {
        fetchRecurringSessions(foundBooking.id)
      } else {
        // For non-recurring bookings, fetch cancellation policy
        fetchCancellationPolicy(foundBooking)
      }
    } catch (error) {
      console.error("Error fetching booking details:", error)
      setError("Failed to load booking details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchRecurringSessions = async (bookingId: number) => {
    try {
      setSessionsLoading(true)

      const response = await fetch(`/api/bookings/recurring/${bookingId}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      })

      if (!response.ok) throw new Error("Failed to fetch recurring sessions")

      const data = await response.json()
      setSessions(data)

      // Fetch cancellation policy only for the first paid session, then apply to all paid sessions
      const policies: { [key: string]: CancellationPolicy } = {}
      const firstPaidSession = data.find((session: any) => session.paymentStatus === "PAID")
      let sharedPolicy: CancellationPolicy | null = null
      if (firstPaidSession) {
        try {
          const policyResponse = await fetch("/api/bookings/cancellation-policy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-ID": user?.id || "",
            },
            body: JSON.stringify({
              sessionId: firstPaidSession.id,
              amount: firstPaidSession.sessionPrice,
              paymentStatus: firstPaidSession.paymentStatus,
            }),
          })
          if (policyResponse.ok) {
            sharedPolicy = await policyResponse.json()
          }
        } catch (error) {
          console.error(`Error fetching policy for session ${firstPaidSession.id}:`, error)
        }
      }
      if (sharedPolicy) {
        for (const session of data) {
          if (session.paymentStatus === "PAID") {
            policies[session.id] = sharedPolicy
          }
        }
      }
      setSessionCancellationPolicies(policies)
    } catch (error) {
      console.error("Error fetching recurring sessions:", error)
      toast({
        title: "Failed to load sessions",
        description: "Could not load recurring sessions. Please try again.",
        variant: "destructive",
      })
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }

  const fetchCancellationPolicy = async (booking: Booking) => {
    try {
      const response = await fetch("/api/bookings/cancellation-policy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.totalPrice,
          paymentStatus: booking.paymentStatus,
        }),
      })

      if (response.ok) {
        const policy = await response.json()
        setCancellationPolicy(policy)
      }
    } catch (error) {
      console.error("Error fetching cancellation policy:", error)
    }
  }

  const fetchRefundStatus = async () => {
    try {
      const response = await fetch(`/api/bookings/refund-status?bookingId=${bookingId}&userId=${user?.id}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRefunds(data.refunds || [])
      }
    } catch (error) {
      console.error("Error fetching refund status:", error)
    }
  }

  const handleCancelBooking = async (reason: string) => {
    if (!booking) return

    setIsCancelling(true)

    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: reason,
          userId: user?.id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Booking Cancelled Successfully! ✅",
          description: result.refundInfo
            ? `Your refund of ₹${result.refundInfo.refundAmount} will be processed within ${result.refundInfo.processingTime}.`
            : "Your booking has been cancelled.",
        })

        // Refresh booking details and refund status
        await fetchBookingDetails()
        await fetchRefundStatus()
      } else {
        throw new Error(result.error || "Failed to cancel booking")
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleCancelSession = async (session: RecurringSession, reason: string) => {
    setCancellingSessionId(session.id)

    try {
      const response = await fetch("/api/bookings/recurring/cancel-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "",
        },
        body: JSON.stringify({
          sessionId: session.id,
          reason: reason,
          userId: user?.id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Session Cancelled Successfully! ✅",
          description: result.refundInfo
            ? `Your refund of ₹${result.refundInfo.refundAmount} will be processed within ${result.refundInfo.processingTime}.`
            : "Your session has been cancelled.",
        })

        // Refresh sessions and refund status
        if (booking) {
          await fetchRecurringSessions(booking.id)
          await fetchRefundStatus()
        }
      } else {
        throw new Error(result.error || "Failed to cancel session")
      }
    } catch (error) {
      console.error("Error cancelling session:", error)
      toast({
        title: "Session Cancellation Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setCancellingSessionId(null)
    }
  }

  const getStatusBadge = (status: string, paymentStatus?: string, sitterId?: string, sitterName?: string) => {
    const statusConfig = {
      upcoming: {
        variant: "default" as const,
        icon: <Clock className="inline h-4 w-4 mr-1 text-zubo-primary-700" />,
        color: "bg-zubo-primary-50 text-zubo-primary-700 border-zubo-primary-200",
      },
      confirmed: {
        variant: "default" as const,
        icon: <CheckCircle className="inline h-4 w-4 mr-1 text-zubo-accent-700" />,
        color: "bg-zubo-accent-50 text-zubo-accent-700 border-zubo-accent-200",
      },
      pending: {
        variant: "outline" as const,
        icon: <Clock className="inline h-4 w-4 mr-1 text-zubo-highlight-2-700" />,
        color: "bg-zubo-highlight-2-50 text-zubo-highlight-2-700 border-zubo-highlight-2-200",
      },
      ongoing: {
        variant: "secondary" as const,
        icon: <RefreshCw className="inline h-4 w-4 mr-1 text-zubo-highlight-1-700" />,
        color: "bg-zubo-highlight-1-50 text-zubo-highlight-1-700 border-zubo-highlight-1-200",
      },
      "in-progress": {
        variant: "secondary" as const,
        icon: <RefreshCw className="inline h-4 w-4 mr-1 text-zubo-highlight-1-700" />,
        color: "bg-zubo-highlight-1-50 text-zubo-highlight-1-700 border-zubo-highlight-1-200",
      },
      completed: {
        variant: "outline" as const,
        icon: <CheckCircle className="inline h-4 w-4 mr-1 text-zubo-accent-700" />,
        color: "bg-zubo-accent-50 text-zubo-accent-700 border-zubo-accent-200",
      },
      cancelled: {
        variant: "destructive" as const,
        icon: <XCircle className="inline h-4 w-4 mr-1 text-destructive" />,
        color: "bg-destructive text-destructive-foreground border-destructive",
      },
      usercancelled: {
        variant: "destructive" as const,
        icon: <XCircle className="inline h-4 w-4 mr-1 text-destructive" />,
        color: "bg-destructive text-destructive-foreground border-destructive",
      },
      assigned: {
        variant: "default" as const,
        icon: <User className="inline h-4 w-4 mr-1 text-zubo-primary-700" />,
        color: "bg-zubo-primary-50 text-zubo-primary-700 border-zubo-primary-200",
      },
    }

    const normalizedStatus = status?.toLowerCase() || "pending"
    if (normalizedStatus === "pending" || normalizedStatus === "assigned") {
      return null
    }
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending

    let displayStatus = status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"

    if (normalizedStatus === "usercancelled") {
      displayStatus = "Cancelled by You"
    } else if (normalizedStatus === "pending" && !sitterId) {
      displayStatus = "Zubo Walkers Unassigned"
    } else if (normalizedStatus === "assigned" && sitterId) {
      displayStatus = "Zubo Walkers Assigned"
    }

    return (
      <Badge className={`${config.color} font-medium px-3 py-1 text-sm`}>
        <span className="mr-1">{config.icon}</span>
        {displayStatus}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const config = {
      PAID: {
        color: "bg-zubo-accent-50 text-zubo-accent-700 border-zubo-accent-200",
        icon: <CreditCard className="inline h-4 w-4 mr-1 text-zubo-accent-700" />, // Lucide CreditCard
      },
      PENDING: {
        color: "bg-zubo-highlight-2-50 text-zubo-highlight-2-700 border-zubo-highlight-2-200",
        icon: <Clock className="inline h-4 w-4 mr-1 text-zubo-highlight-2-700" />, // Lucide Clock
      },
      FAILED: { color: "bg-destructive text-destructive-foreground border-destructive", icon: "❌" },
    }

    const normalizedStatus = paymentStatus?.toUpperCase() || "PENDING"
    const statusConfig = config[normalizedStatus as keyof typeof config] || config.PENDING

    return (
      <Badge className={`${statusConfig.color} font-medium px-2 py-0.5 text-xs`}>
        <span className="mr-1">{statusConfig.icon}</span>
        {paymentStatus === "PENDING" ? "Unpaid" : paymentStatus}
      </Badge>
    )
  }

  const getRefundStatusBadge = (status: string) => {
    const config = {
      INITIATED: {
        color: "bg-zubo-primary-50 text-zubo-primary-700 border-zubo-primary-200",
        icon: "",
      },
      PROCESSED: {
        color: "bg-zubo-accent-50 text-zubo-accent-700 border-zubo-accent-200",
        icon: "",
      },
      FAILED: { color: "bg-destructive text-destructive-foreground border-destructive", icon: "❌" },
    }

    const normalizedStatus = status?.toUpperCase() || "INITIATED"
    const statusConfig = config[normalizedStatus as keyof typeof config] || config.INITIATED

    return (
      <Badge className={`${statusConfig.color} font-medium px-2 py-0.5 text-xs`}>
        <span className="mr-1">{statusConfig.icon}</span>
        {status === "INITIATED" ? "Processing" : status}
      </Badge>
    )
  }

  const handleChatWithSitter = async () => {
    if (!user?.phone) {
      toast({
        title: "Phone number required",
        description: "Please ensure your phone number is set in your profile",
        variant: "destructive",
      })
      return
    }

    const sitterPhone = booking?.sitter_phone || booking?.sitterPhone
    if (!sitterPhone) {
      toast({
        title: "Sitter contact not available",
        description: "Sitter phone number is not available for this booking",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const sitterName = booking?.sitter_name || booking?.sitterName || booking?.caretakerName
      const chatData = {
        bookingId: booking.id.toString(),
        userPhone: user.phone,
        sitterPhone: sitterPhone,
        userAlias: user.name || "Pet Owner",
        sitterAlias: sitterName,
      }

      const response = await fetch("/api/whatsapp/setup-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.message?.includes("already exists") || result.message?.includes("message sent")) {
          toast({
            title: "Message Sent! 📨",
            description: `Your message to ${sitterName} has been sent. Check your WhatsApp for updates!`,
          })
        } else {
          toast({
            title: "Chat Started! 🎉",
            description: `WhatsApp chat with ${sitterName} has been set up. Check your WhatsApp!`,
          })
        }
      } else {
        throw new Error(result.error || result.details || "Failed to start chat")
      }
    } catch (error) {
      console.error("❌ Error starting sitter chat:", error)
      toast({
        title: "Failed to start chat",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChatWithSessionSitter = async (session: RecurringSession) => {
    if (!user?.phone) {
      toast({
        title: "Phone number required",
        description: "Please ensure your phone number is set in your profile",
        variant: "destructive",
      })
      return
    }

    if (!session.sitterPhone) {
      toast({
        title: "Sitter contact not available",
        description: "Sitter phone number is not available for this session",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const chatData = {
        bookingId: session.id.toString(),
        sessionId: session.id,
        userPhone: user.phone,
        sitterPhone: session.sitterPhone,
        userAlias: user.name || "Pet Owner",
        sitterAlias: session.sitterName,
      }

      const response = await fetch("/api/whatsapp/setup-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.message?.includes("already exists") || result.message?.includes("message sent")) {
          toast({
            title: "Message Sent! 📨",
            description: `Your message to ${session.sitterName} has been sent. Check your WhatsApp for updates!`,
          })
        } else {
          toast({
            title: "Chat Started! 🎉",
            description: `WhatsApp chat with ${session.sitterName} has been set up. Check your WhatsApp!`,
          })
        }
      } else {
        throw new Error(result.error || result.details || "Failed to start chat")
      }
    } catch (error) {
      console.error("❌ Error starting session sitter chat:", error)
      toast({
        title: "Failed to start chat",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewSitterProfile = (sitterId: string) => {
    router.push(`/sitter-profile/${sitterId}`)
  }

  const handlePayNow = () => {
    router.push(`/book-service/payment?bookingId=${booking?.id}&payExisting=true`)
  }

  const handlePayForSession = (session: RecurringSession) => {
    // Only pass recurringBookingId and payRecurring=true for recurring session payments
    const paymentUrl = `/book-service/payment?recurringBookingId=${session.id}&payRecurring=true`
    router.push(paymentUrl)
  }

  const handleGetHelp = () => {
    router.push(`/support?bookingId=${booking?.id}`)
  }

  const canCancelBooking = (booking: Booking) => {
    // Only allow cancellation for non-recurring bookings
    if (booking.recurring) return false

    const cancellableStatuses = ["pending", "confirmed", "assigned", "upcoming"]
    return cancellableStatuses.includes(booking.status?.toLowerCase() || "")
  }

  const canCancelSession = (session: RecurringSession) => {
    const cancellableStatuses = ["pending", "confirmed", "assigned", "upcoming"]
    return cancellableStatuses.includes(session.status?.toLowerCase() || "")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4 pb-20">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary-600" />
              <h3 className="text-lg font-semibold text-zubo-text-800 mb-2">Loading booking details</h3>
              <p className="text-sm text-zubo-text-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4 pb-20">
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

          <Alert className="border-destructive bg-destructive/10 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error || "Booking not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const sitterName = booking.sitter_name || booking.sitterName || booking.caretakerName
  const sitterPhone = booking.sitter_phone || booking.sitterPhone
  const hasSitterAssigned =
    booking.sitterId &&
    sitterName &&
    sitterName.trim() !== "" &&
    sitterName.toLowerCase() !== "to be assigned" &&
    sitterName.toLowerCase() !== "sitter not assigned" &&
    sitterPhone

  const showChatButton = ["upcoming", "confirmed", "pending", "assigned", "ongoing", "in-progress"].includes(
    booking.status?.toLowerCase() || "",
  )
  const showRebookButton = ["completed", "cancelled", "usercancelled"].includes(booking.status?.toLowerCase() || "")
  const showCancelButton = canCancelBooking(booking)

  // Logic to display cancellation policy info for non-recurring bookings, even if cancelled
  const showCancellationPolicyInfo =
    cancellationPolicy &&
    !booking.recurring &&
    (canCancelBooking(booking) || ["cancelled", "usercancelled"].includes(booking.status?.toLowerCase() || ""))

  // Recurring sessions calculations
  const totalSessions = sessions.length
  const paidSessions = sessions.filter((s) => s.paymentStatus === "PAID").length
  const totalAmount = sessions.reduce((sum, s) => sum + s.sessionPrice, 0)
  const paidAmount = sessions.filter((s) => s.paymentStatus === "PAID").reduce((sum, s) => sum + s.sessionPrice, 0)

  // Show first 3 sessions by default, with option to show all
  const displayedSessions = showAllSessions ? sessions : sessions.slice(0, 3)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: `${label} Copied! ✅`,
      description: `Successfully copied to clipboard`,
    })
  }

  return (
    <div className="min-h-screen bg-zubo-background-300">
      <div className="container mx-auto p-4 pb-20 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zubo-text-600 hover:text-zubo-text-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Bookings
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zubo-text-900 mb-2">
                {booking.recurring ? "Recurring Booking Details" : "Booking Details"}
              </h1>
             <div className="flex items-center gap-2 text-sm text-zubo-text-600">
  <span>Booking ID: #{booking.id.toString().slice(-5)}</span>
  {/* Removed copy button */}
</div>

            </div>
            {getStatusBadge(booking.status || "pending", booking.paymentStatus, booking.sitterId, sitterName)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Overview */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-zubo-primary-50 to-zubo-highlight-1-50 border-b border-zubo-primary-200">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-zubo-background-50 rounded-lg shadow-sm">
                    <span className="text-2xl">{getServiceIcon(booking.serviceName || "pet care")}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zubo-text-900">
                      {booking.serviceName || "Pet Care Service"}
                    </h2>
                    <p className="text-sm text-zubo-text-600 mt-1">
                      Booked on {format(new Date(booking.createdAt || booking.date), "PPP")}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {booking.recurring ? (
                      <>
                        <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-zubo-primary-600" />
                          <div>
                            <p className="text-sm text-zubo-text-500">Start Date</p>
                            <p className="font-medium text-zubo-text-900">{formatDate(booking.recurringStartDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-zubo-primary-600" />
                          <div>
                            <p className="text-sm text-zubo-text-500">End Date</p>
                            <p className="font-medium text-zubo-text-900">{formatDate(booking.recurringEndDate)}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-zubo-primary-600" />
                        <div>
                          <p className="text-sm text-zubo-text-500">Service Date</p>
                          <p className="font-medium text-zubo-text-900">{formatDate(booking.date)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                      <Clock className="h-5 w-5 text-zubo-accent-600" />
                      <div>
                        <p className="text-sm text-zubo-text-500">Time</p>
                        <p className="font-medium text-zubo-text-900">{
                          (() => {
                            if (!booking.time) return "Not scheduled"
                            try {
                              const d = new Date(`1970-01-01T${booking.time}`)
                              return d.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            } catch {
                              return booking.time
                            }
                          })()
                        }</p>
                      </div>
                    </div>

                    {/* Address Section */}
                    {booking.address && (
                      <div className="flex items-start gap-3 p-3 bg-zubo-background-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-zubo-highlight-1-600 mt-1" />
                        <div>
                          <p className="text-sm text-zubo-text-500 mb-1">Service Address</p>
                          <div className="text-zubo-text-900 font-medium">
                            {booking.address.line1}
                            {booking.address.line2 && <>, {booking.address.line2}</>}
                          </div>
                          <div className="text-zubo-text-700 text-sm">
                            {booking.address.city}, {booking.address.state} {booking.address.postalCode}
                            <br />
                            {booking.address.country}
                            {booking.address.landmark && (
                              <>
                                <br />
                                <span className="text-zubo-text-500">Landmark: {booking.address.landmark}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                      <IndianRupee className="h-5 w-5 text-zubo-highlight-2-600" />
                      <div>
                        <p className="text-sm text-zubo-text-500">{booking.recurring ? "Total Amount" : "Amount"}</p>
                        <p className="font-medium text-lg text-zubo-text-900">
                          {booking.recurring ? totalAmount.toFixed(2) : booking.totalPrice?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-zubo-background-50 rounded-lg">
                      <CreditCard className="h-5 w-5 text-zubo-highlight-1-600" />
                      <div>
                        <p className="text-sm text-zubo-text-500">Payment Status</p>
                        <p className="font-medium text-zubo-text-900">
                          {booking.recurring
                            ? `${paidSessions}/${totalSessions} sessions paid`
                            : booking.paymentStatus === "PENDING"
                              ? "Unpaid"
                              : booking.paymentStatus || "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recurring Pattern */}
                {booking.recurring && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-zubo-highlight-2-50 to-zubo-highlight-1-50 rounded-lg border border-zubo-highlight-2-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="h-5 w-5 text-zubo-highlight-2-600" />
                      <span className="font-medium text-zubo-highlight-2-900">Recurring Service</span>
                    </div>
                    <p className="text-zubo-highlight-2-800">{formatRecurringPattern(booking.recurringPattern)}</p>
                    {booking.recurringEndDate && (
                      <p className="text-sm text-zubo-highlight-2-700 mt-1">
                        Until {format(new Date(booking.recurringEndDate), "PPP")}
                      </p>
                    )}
                    {booking.recurring && (
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-zubo-highlight-2-600">Total Sessions</p>
                          <p className="font-semibold text-zubo-highlight-2-900">{totalSessions}</p>
                        </div>
                        <div>
                          <p className="text-zubo-highlight-2-600">Amount Paid</p>
                          <p className="font-semibold text-zubo-accent-600">₹{paidAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Refund Status */}
            {refunds.length > 0 && (
              <Card className="border-zubo-accent-200 bg-gradient-to-r from-zubo-accent-50 to-zubo-accent-100">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg text-zubo-accent-800">
                      <RefreshCw className="h-5 w-5" />
                      Refund Status ({refunds.length})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRefunds(!showRefunds)}
                      className="text-zubo-accent-700 hover:text-zubo-accent-800"
                    >
                      {showRefunds ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showRefunds && (
                  <CardContent className="space-y-3">
                    {refunds.map((refund) => (
                      <div
                        key={refund.id}
                        className="bg-zubo-background-50 p-4 rounded-lg border border-zubo-accent-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-zubo-text-900">
                              Refund #{refund.refundId.slice(-8)}
                            </span>
                            {getRefundStatusBadge(refund.status)}
                          </div>
                          <span className="font-semibold text-zubo-accent-600">₹{refund.amount.toFixed(2)}</span>
                        </div>

                        {refund.sequenceNumber && (
                          <p className="text-xs text-zubo-text-600 mb-1">
                            Session {refund.sequenceNumber} - {formatDateShort(refund.sessionDate || "")}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-zubo-text-600">
                          <Clock className="h-3 w-3" />
                          <span>{refund.estimatedProcessingTime}</span>
                        </div>

                        {refund.failureReason && (
                          <Alert className="mt-2 border-destructive bg-destructive/10">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <AlertDescription className="text-destructive text-xs">
                              {refund.failureReason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Cancellation & Refund Policy (Collapsible) */}
            {showCancellationPolicyInfo && (
              <Card className="border-zubo-highlight-2-200 bg-gradient-to-r from-zubo-highlight-2-50 to-zubo-highlight-1-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-zubo-highlight-2-600" />
                      <span className="font-medium text-zubo-highlight-2-800">
                        {["cancelled", "usercancelled"].includes(booking.status?.toLowerCase() || "")
                          ? "Booking Cancelled"
                          : "Cancellation Policy"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/cancellation-policy?bookingId=${booking.id}`)}
                      className="border-zubo-primary-300 text-zubo-primary-600 hover:bg-zubo-primary-50 bg-transparent"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Policy Details
                    </Button>
                  </div>
                  <p className="text-sm text-zubo-highlight-2-700 mt-2">
                    {["cancelled", "usercancelled"].includes(booking.status?.toLowerCase() || "")
                      ? "This booking was cancelled. Refund details are available in the policy."
                      : "Click 'Cancel Booking' to see your eligible refund amount based on our cancellation policy."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recurring Sessions */}
            {booking.recurring && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                    <Repeat className="h-5 w-5 text-zubo-primary-600" />
                    Recurring Sessions ({totalSessions})
                  </CardTitle>
                  {booking.recurring && (
                    <p className="text-sm text-zubo-text-600">
                      Please contact support if you would like to cancel or change multiple sessions. You can cancel
                      individual sessions.
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-zubo-primary-600" />
                        <p className="text-sm text-zubo-text-600">Loading sessions...</p>
                      </div>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Calendar className="h-6 w-6 mx-auto mb-2 text-zubo-text-400" />
                        <p className="text-sm text-zubo-text-600">No sessions found</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayedSessions.map((session) => (
                        <Card key={session.id} className="border-l-4 border-l-zubo-primary-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-zubo-text-900">
                                  Session {session.sequenceNumber}
                                </span>
                                {getStatusBadge(session.status, undefined, session.sitterId, session.sitterName)}
                                {getPaymentStatusBadge(session.paymentStatus)}
                              </div>
                              <div className="text-sm font-semibold text-zubo-text-800">
                                ₹{session.sessionPrice.toFixed(2)}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-zubo-primary-600" />
                                <span>{formatDateShort(session.sessionDate)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-zubo-accent-600" />
                                <span>{format(parse(session.sessionTime, "HH:mm:ss", new Date()), "hh:mm a")}</span>
                              </div>
                            </div>

                            {/* Navigate to Recurring Session Details */}
                            <div className="mb-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-zubo-primary border-zubo-primary bg-transparent"
                                onClick={() => {
                                  window.location.href = `/recurring-session?recurringBookingId=${session.id}`
                                }}
                              >
                                View Session Details
                              </Button>
                            </div>

                            {session.notes && <p className="text-xs text-zubo-text-600 mb-3">{session.notes}</p>}

                            {/* Session Sitter Info */}
                            {hasSessionSitterAssigned(session) && (
                              <div className="bg-zubo-primary-50 border border-zubo-primary-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-zubo-primary-600" />
                                    <span className="text-sm font-medium text-zubo-primary-800">
                                      Zubo Walker: {session.sitterName}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewSitterProfile(session.sitterId!)}
                                    className="text-zubo-primary-600 hover:bg-zubo-primary-100 text-xs px-2 py-1 h-6"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Profile
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Session OTPs */}
                            {(session.startOtp || session.endOtp) && (
                              <div className="bg-zubo-accent-50 border border-zubo-accent-200 rounded-lg p-3 mb-3">
                                <h4 className="text-xs font-semibold text-zubo-accent-800 mb-2">Service Codes</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {session.startOtp && (
                                    <div className="bg-zubo-background-50 p-2 rounded border border-zubo-accent-100">
                                      <div className="text-zubo-accent-600 font-medium">Pick-up Code</div>
                                      <div className="font-mono font-bold text-zubo-accent-800">{session.startOtp}</div>
                                    </div>
                                  )}
                                  {session.endOtp && (session.paymentStatus === "PAID" || session.paymentStatus === "REFUNDED") && (
                                    <div className="bg-zubo-background-50 p-2 rounded border border-zubo-accent-100">
                                      <div className="text-zubo-accent-600 font-medium">Drop-off Code</div>
                                      <div className="font-mono font-bold text-zubo-accent-800">{session.endOtp}</div>
                                    </div>
                                  )}
                                  {session.endOtp && (session.paymentStatus !== "PAID" && session.paymentStatus !== "REFUNDED") && (
                                    <div className="bg-zubo-background-50 p-2 rounded border border-zubo-highlight-1-200">
                                      <div className="text-zubo-highlight-1-700 font-medium">
                                        Drop-off Code will be shown after payment is completed.
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Session Actions */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {session.paymentStatus === "PAID" ? (
                                  <div className="flex items-center gap-1 text-zubo-accent-600 text-xs">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Paid</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-zubo-highlight-2-600 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Payment Pending</span>
                                  </div>
                                )}

                                {canCancelSession(session) && (
                                  <SessionCancellationDialog
                                    session={session}
                                    onCancel={handleCancelSession}
                                    isLoading={cancellingSessionId === session.id}
                                    cancellationPolicy={sessionCancellationPolicies[session.id]}
                                  />
                                )}

                                {/* Chat with sitter for this specific session - check session's sitter assignment */}
                                {/* {hasSessionSitterAssigned(session) &&
                                  ["upcoming", "confirmed", "pending", "assigned", "ongoing", "in-progress"].includes(
                                    session.status?.toLowerCase() || "",
                                  ) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleChatWithSessionSitter(session)}
                                      disabled={isLoading}
                                      className="text-zubo-accent-600 hover:bg-zubo-accent-50 text-xs px-2 py-1 h-6"
                                    >
                                      {isLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <>
                                          <MessageCircle className="h-3 w-3 mr-1" />
                                          Chat with {session.sitterName?.split(" ")[0]}
                                        </>
                                      )}
                                    </Button>
                                  )} */}
                              </div>

                              {session.paymentStatus === "PENDING" && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePayForSession(session)}
                                  className="bg-zubo-primary-600 hover:bg-zubo-primary-700 text-zubo-background-50 text-xs"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Pay ₹{session.sessionPrice.toFixed(2)}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Show More/Less Button */}
                      {sessions.length > 3 && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowAllSessions(!showAllSessions)}
                            className="flex items-center gap-2 border-zubo-primary-300 text-zubo-primary-600 hover:bg-zubo-primary-50 bg-transparent"
                          >
                            {showAllSessions ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Show Less Sessions
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Show All {sessions.length} Sessions
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pet & Sitter Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pet Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                    <Heart className="h-5 w-5 text-zubo-highlight-1-600" />
                    Pet Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-zubo-accent-50 rounded-lg">
                    <div className="w-12 h-12 bg-zubo-accent-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🐾</span>
                    </div>
                    <div>
                      <p className="font-medium text-zubo-text-900">{booking.petName || "Not specified"}</p>
                      <p className="text-sm text-zubo-text-600">Your beloved pet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sitter Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                    <User className="h-5 w-5 text-zubo-primary-600" />
                    Zubo Walker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-zubo-primary-50 rounded-lg">
                    <div className="w-12 h-12 bg-zubo-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-zubo-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-zubo-text-900">
                            {sitterName || "To be assigned"}
                            {booking.sitterId && !sitterName && (
                              <span className="text-zubo-highlight-2-600 text-sm ml-2">(Loading...)</span>
                            )}
                          </p>
                          <p className="text-sm text-zubo-text-600">
                            {hasSitterAssigned ? "Professional pet sitter" : "Will be assigned soon"}
                          </p>
                        </div>
                        {hasSitterAssigned && booking.sitterId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSitterProfile(booking.sitterId)}
                            className="text-zubo-primary-600 hover:bg-zubo-primary-100 text-xs px-2 py-1 h-6"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service OTPs for Non-Recurring Bookings */}
            {!booking.recurring &&
              (booking.startOtp || booking.endOtp || booking.serviceOtp) &&
              ["upcoming", "confirmed", "pending", "assigned", "ongoing"].includes(
                booking.status?.toLowerCase() || "",
              ) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                      <Shield className="h-5 w-5 text-zubo-highlight-2-600" />
                      Service Codes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* START OTP */}
                    {booking.startOtp && (
                      <div className="bg-gradient-to-r from-zubo-accent-50 to-zubo-accent-100 p-4 rounded-lg border border-zubo-accent-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-zubo-accent-600" />
                            <span className="font-medium text-zubo-accent-800">Pick-up Code</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-zubo-accent-100"
                            onClick={() => copyToClipboard(booking.startOtp!, "START OTP")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-2xl font-mono font-bold text-zubo-accent-900 mb-2">{booking.startOtp}</div>
                        <p className="text-sm text-zubo-accent-700">
                          Share this Code with your Zubo Walker to START the service
                        </p>
                      </div>
                    )}

                    {/* END OTP */}
                    {booking.endOtp && (booking.paymentStatus === "PAID" || booking.paymentStatus === "REFUNDED") && (
                      <div className="bg-gradient-to-r from-zubo-highlight-1-50 to-zubo-highlight-1-100 p-4 rounded-lg border border-zubo-highlight-1-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Square className="h-4 w-4 text-zubo-highlight-1-600" />
                            <span className="font-medium text-zubo-highlight-1-800">Drop-off Code</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-zubo-highlight-1-100"
                            onClick={() => copyToClipboard(booking.endOtp!, "END OTP")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-2xl font-mono font-bold text-zubo-highlight-1-900 mb-2">
                          {booking.endOtp}
                        </div>
                        <p className="text-sm text-zubo-highlight-1-700">
                          Share this Code with your Zubo Walker to END the service
                        </p>
                      </div>
                    )}
                    {booking.endOtp && (booking.paymentStatus !== "PAID" && booking.paymentStatus !== "REFUNDED") && (
                      <div className="bg-gradient-to-r from-zubo-highlight-1-50 to-zubo-highlight-1-100 p-4 rounded-lg border border-zubo-highlight-1-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Square className="h-4 w-4 text-zubo-highlight-1-600" />
                          <span className="font-medium text-zubo-highlight-1-800">Drop-off Code</span>
                        </div>
                        <div className="text-zubo-highlight-1-700 font-medium">
                          Drop-off Code will be shown after payment is completed.
                        </div>
                      </div>
                    )}

                    {/* Legacy Service OTP */}
                    {!booking.startOtp && !booking.endOtp && booking.serviceOtp && (
                      <div className="bg-gradient-to-r from-zubo-highlight-2-50 to-zubo-highlight-2-100 p-4 rounded-lg border border-zubo-highlight-2-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-zubo-highlight-2-600" />
                            <span className="font-medium text-zubo-highlight-2-800">Service OTP</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-zubo-highlight-2-100"
                            onClick={() => copyToClipboard(booking.serviceOtp!, "Service OTP")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-2xl font-mono font-bold text-zubo-highlight-2-900 mb-2">
                          {booking.serviceOtp}
                        </div>
                        <p className="text-sm text-zubo-highlight-2-700">
                          Share this Code with your Zubo Walker to start the service
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-zubo-text-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!booking.recurring && booking.paymentStatus === "PENDING" && (
                  <Button
                    onClick={handlePayNow}
                    className="w-full bg-gradient-to-r from-zubo-accent-600 to-zubo-primary-600 hover:from-zubo-accent-700 hover:to-zubo-primary-700 text-zubo-background-50"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Button>
                )}

                {showCancelButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 text-xs bg-transparent"
                    onClick={() => setShowBookingCancellationDialog(true)}
                  >
                    <XCircle className="mr-2 h-3 w-3" />
                    Cancel Booking
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleGetHelp}
                  className="w-full border-zubo-primary-300 text-zubo-primary-600 hover:bg-zubo-primary-50 bg-transparent"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Get Help & Support
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/cancellation-policy?bookingId=${booking.id}`)}
                  className="w-full border-zubo-highlight-2-300 text-zubo-highlight-2-600 hover:bg-zubo-highlight-2-50 bg-transparent"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Cancellation Policy
                </Button>

                {/* Chat button for normal bookings when sitter is assigned */}
                {/* {!booking.recurring && showChatButton && hasSitterAssigned && (
                  <Button
                    variant="outline"
                    onClick={handleChatWithSitter}
                    disabled={isLoading}
                    className="w-full border-zubo-accent-300 text-zubo-accent-600 hover:bg-zubo-accent-50 bg-transparent"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting Chat...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Chat with {sitterName?.split(" ")[0]}
                      </>
                    )}
                  </Button>
                )} */}

                {showRebookButton && (
                  <div className="pt-2">
                    <RebookButton booking={booking} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg text-zubo-text-900">Booking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zubo-accent-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-zubo-accent-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-zubo-text-900">Booking Created</p>
                      <p className="text-xs text-zubo-text-600">
                        {format(new Date(booking.createdAt || booking.date), "PPp")}
                      </p>
                    </div>
                  </div>

                  {(booking.paymentStatus === "paid" || (booking.recurring && paidSessions > 0)) && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zubo-primary-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-zubo-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-zubo-text-900">
                          {booking.recurring ? `${paidSessions} Sessions Paid` : "Payment Completed"}
                        </p>
                        <p className="text-xs text-zubo-text-600">
                          {booking.recurring
                            ? `₹${paidAmount.toFixed(2)} of ₹${totalAmount.toFixed(2)} paid`
                            : "Payment processed successfully"}
                        </p>
                      </div>
                    </div>
                  )}

                  {hasSitterAssigned && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zubo-highlight-2-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-zubo-highlight-2-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-zubo-text-900">Sitter Assigned</p>
                        <p className="text-xs text-zubo-text-600">{sitterName}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zubo-background-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-zubo-text-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-zubo-text-900">
                        {booking.recurring ? "Recurring Schedule" : "Scheduled Service"}
                      </p>
                      <p className="text-xs text-zubo-text-600">
                        {booking.recurring
                          ? formatRecurringPattern(booking.recurringPattern)
                          : `${formatDate(booking.date)} at ${booking.time}`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* Need Help */}
            {/* <Card className="bg-gradient-to-r from-zubo-primary-50 to-zubo-highlight-1-50 border-zubo-primary-200">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-zubo-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="h-6 w-6 text-zubo-primary-600" />
                </div>
                <h3 className="font-medium text-zubo-primary-900 mb-2">Need Help?</h3>
                <p className="text-sm text-zubo-primary-700 mb-3">
                  Our support team is here to help you with any questions or concerns.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetHelp}
                  className="border-zubo-primary-300 text-zubo-primary-600 hover:bg-zubo-primary-100 bg-transparent"
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </div>

        {/* Add the missing BookingCancellationDialog */}
        <BookingCancellationDialog
          booking={booking}
          open={showBookingCancellationDialog}
          onOpenChange={setShowBookingCancellationDialog}
          onCancel={handleCancelBooking}
          isLoading={isCancelling}
          cancellationPolicy={cancellationPolicy}
        />
      </div>
      <Toaster />
    </div>
  )
}
