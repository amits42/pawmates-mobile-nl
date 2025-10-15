"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ServiceOTPDialog } from "@/components/service-otp-dialog"

import { Calendar, Search, Filter, MapPin, Clock, DollarSign, CalendarIcon, Repeat, Play, Square } from "lucide-react"

interface Booking {
  id: string
  date: string
  time: string
  service: string
  petName: string
  petType: string
  breed: string
  ownerName: string
  ownerPhone: string
  location: string
  status: string
  duration: number
  amount: number
  notes?: string
  recurring: boolean
  recurringPattern?: string
  bookingType: "regular" | "recurring_session"
  sequenceNumber?: number
  paymentStatus?: string
}

interface FormattedBooking {
  id: string
  petOwner: {
    name: string
    phone: string
    email: string
    photo?: string
  }
  pet: {
    name: string
    type: string
    breed: string
    photo?: string
  }
  service: string
  date: string
  time: string
  duration: string
  address: string
  status: string
  amount: number
  notes?: string
  bookingType: "regular" | "recurring_session"
  sequenceNumber?: number
  paymentStatus?: string
}

export default function SitterBookingsPage() {
  const { sitter, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [bookings, setBookings] = useState<FormattedBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showStartOTP, setShowStartOTP] = useState(false)
  const [showEndOTP, setShowEndOTP] = useState(false)
  const [selectedBookingForOTP, setSelectedBookingForOTP] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not scheduled"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !sitter) {
      router.push("/login")
    }
  }, [mounted, loading, sitter, router])

  useEffect(() => {
    if (sitter) {
      fetchBookings()
    }
  }, [sitter])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)

      const userId = sitter?.userId || sitter?.id

      if (!userId) {
        console.error("No user ID available for fetching bookings")
        setBookings([])
        return
      }

      console.log("Fetching bookings for userId:", userId)

      const response = await fetch(`/api/sitters/bookings?userId=${userId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("🔍 Raw API response:", data)

      if (!Array.isArray(data)) {
        console.error("API did not return an array:", data)
        setBookings([])
        return
      }

      // Transform the API data
      const formattedBookings: FormattedBooking[] = data.map((booking: Booking) => {
        const formatted = {
          id: booking.id,
          petOwner: {
            name: booking.ownerName || "Pet Owner",
            phone: booking.ownerPhone || "N/A",
            email: `${booking.ownerName?.toLowerCase().replace(/\s/g, ".")}@example.com` || "owner@example.com",
            photo: undefined,
          },
          pet: {
            name: booking.petName || "Pet",
            type: booking.petType || "Unknown",
            breed: booking.breed || "Unknown",
            photo: undefined,
          },
          service: booking.service || "Pet Service",
          date: booking.date || "N/A",
          time: booking.time || "N/A",
          duration: `${booking.duration || 1} hr${booking.duration !== 1 ? "s" : ""}`,
          address: booking.location || "N/A",
          status: booking.status?.toUpperCase() || "ASSIGNED", // Normalize to uppercase
          amount: booking.amount || 0,
          notes: booking.notes,
          bookingType: booking.bookingType,
          sequenceNumber: booking.sequenceNumber,
          paymentStatus: booking.paymentStatus,
        }

        console.log(
          `🔍 Booking ${booking.id}: original status="${booking.status}" -> normalized status="${formatted.status}", type="${formatted.bookingType}"`,
        )
        return formatted
      })

      console.log("🔍 All formatted bookings:", formattedBookings)
      setBookings(formattedBookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (booking: FormattedBooking) => {
    const isRecurring = booking.bookingType === "recurring_session"
    const param = isRecurring
      ? `recurringBookingId=${encodeURIComponent(booking.id)}`
      : `bookingId=${encodeURIComponent(booking.id)}`
    router.push(`/sitter/bookings/details?${param}`)
  }

  const handleStartService = (bookingId: string) => {
    setSelectedBookingForOTP(bookingId)
    setShowStartOTP(true)
  }

  const handleEndService = (bookingId: string) => {
    setSelectedBookingForOTP(bookingId)
    setShowEndOTP(true)
  }

  const handleOTPSuccess = () => {
    fetchBookings()
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.petOwner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesTab = false

    // Map database statuses to tabs (using uppercase)
    if (activeTab === "upcoming") {
      matchesTab = ["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(booking.status)
    } else if (activeTab === "ongoing") {
      matchesTab = ["ONGOING"].includes(booking.status)
    } else if (activeTab === "completed") {
      matchesTab = ["COMPLETED"].includes(booking.status)
    } else if (activeTab === "cancelled") {
      matchesTab = ["CANCELLED"].includes(booking.status)
    }

    console.log(
      `🔍 Booking ${booking.id}: status="${booking.status}", activeTab="${activeTab}", matchesTab=${matchesTab}`,
    )

    return matchesSearch && matchesTab
  })

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
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

  // Helper function to get action buttons
  const getActionButtons = (booking: FormattedBooking) => {
    if (booking.status === "ONGOING") {
      return (
        <div className="flex flex-col space-y-2 mt-4 w-full">
          <Button
            onClick={() => handleEndService(booking.id)}
            className="w-full bg-zubo-highlight-1-600 hover:bg-zubo-highlight-1-700 text-xs sm:text-sm py-2 sm:py-2"
            size="sm"
          >
            End Service
          </Button>
          <Button
            onClick={() => handleViewDetails(booking)}
            variant="outline"
            className="w-full text-xs sm:text-sm py-2 sm:py-2 border-zubo-background-300 hover:bg-zubo-background-50 text-zubo-text-700"
            size="sm"
          >
            View Details
          </Button>
        </div>
      )
    } else if (["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(booking.status)) {
      return (
        <div className="flex flex-col space-y-2 mt-4 w-full">
          <Button
            onClick={() => handleStartService(booking.id)}
            className="w-full bg-zubo-accent-600 hover:bg-zubo-accent-700 text-xs sm:text-sm py-2 sm:py-2"
            size="sm"
          >
            Start Service
          </Button>
          <Button
            onClick={() => handleViewDetails(booking)}
            variant="outline"
            className="w-full text-xs sm:text-sm py-2 sm:py-2 border-zubo-background-300 hover:bg-zubo-background-50 text-zubo-text-700"
            size="sm"
          >
            View Details
          </Button>
        </div>
      )
    } else {
      return (
        <Button
          onClick={() => handleViewDetails(booking)}
          variant="outline"
          className="mt-4 w-full text-xs sm:text-sm py-2 sm:py-2 border-zubo-background-300 hover:bg-zubo-background-50 text-zubo-text-700"
          size="sm"
        >
          View Details
        </Button>
      )
    }
  }

  // Helper function to render booking card
  const renderBookingCard = (booking: FormattedBooking) => {
    const isRecurringSession = booking.bookingType === "recurring_session"

    return (
      <Card
        key={booking.id}
        className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
          booking.status === "ONGOING"
            ? "border-l-4 border-l-zubo-accent-500 bg-gradient-to-r from-zubo-accent-50 to-zubo-background-50"
            : "hover:border-zubo-background-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Main Content */}
          <div className="p-4 sm:p-6 flex-grow">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-zubo-background-50 shadow-md">
                    <AvatarImage
                      src={booking.pet.photo || "/placeholder.svg?height=56&width=56"}
                      alt={booking.pet.name}
                    />
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-zubo-primary-400 to-zubo-highlight-2-500 text-zubo-background-50">
                      {booking.pet.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {booking.status === "ONGOING" && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-zubo-accent-500 rounded-full border-2 border-zubo-background-50 animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-zubo-text-900 text-base sm:text-lg truncate">{booking.pet.name}</h3>
                    {isRecurringSession && (
                      <div className="flex items-center space-x-1 bg-zubo-highlight-2-100 px-2 py-1 rounded-full">
                        <Repeat className="h-3 w-3 text-zubo-highlight-2-600" />
                        <span className="text-xs text-zubo-highlight-2-700 font-medium">#{booking.sequenceNumber}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-zubo-text-600 mb-2">
                    {booking.pet.type} • {booking.pet.breed}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(booking.status)}
                    {booking.paymentStatus !== "PAID" && (
                      <Badge className="bg-zubo-highlight-2-100 text-zubo-highlight-2-800 text-xs border-zubo-highlight-2-200">
                        Payment Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div className="bg-zubo-background-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zubo-text-700">Service</span>
                <span className="text-sm font-semibold text-zubo-text-900">{booking.service}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-zubo-primary-100 rounded-full">
                    <Calendar className="h-3 w-3 text-zubo-primary-600" />
                  </div>
                  <span className="text-zubo-text-700">{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-zubo-accent-100 rounded-full">
                    <Clock className="h-3 w-3 text-zubo-accent-600" />
                  </div>
                  <span className="text-zubo-text-700">{booking.time}</span>
                </div>
                <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
                  <div className="p-1.5 bg-zubo-highlight-2-100 rounded-full">
                    <DollarSign className="h-3 w-3 text-zubo-highlight-2-600" />
                  </div>
                  <span className="font-semibold text-zubo-highlight-2-700">${booking.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start space-x-2 mb-3">
              <div className="p-1.5 bg-zubo-highlight-1-100 rounded-full mt-0.5">
                <MapPin className="h-3 w-3 text-zubo-highlight-1-600" />
              </div>
              <span className="text-sm text-zubo-text-700 line-clamp-2 flex-1">{booking.address}</span>
            </div>

            {/* Ongoing Status Alert */}
            {booking.status === "ONGOING" && (
              <div className="bg-gradient-to-r from-zubo-accent-100 to-zubo-accent-200 border border-zubo-accent-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-zubo-accent-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-zubo-accent-800 font-medium">
                    Service in progress • Use END OTP to complete
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Owner & Actions Section */}
          <div className="bg-gradient-to-b from-zubo-background-50 to-zubo-background-100 border-t sm:border-t-0 sm:border-l sm:w-56 p-4">
            {/* Owner Info */}
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10 ring-2 ring-zubo-background-50 shadow-sm">
                <AvatarImage
                  src={booking.petOwner.photo || "/placeholder.svg?height=40&width=40"}
                  alt={booking.petOwner.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-zubo-primary-400 to-zubo-highlight-2-500 text-zubo-background-50 text-sm font-medium">
                  {booking.petOwner.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zubo-text-900 truncate">{booking.petOwner.name}</p>
                <p className="text-xs text-zubo-text-600">Pet Owner</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {booking.status === "ONGOING" ? (
                <>
                  <Button
                    onClick={() => handleEndService(booking.id)}
                    className="w-full bg-gradient-to-r from-zubo-highlight-1-500 to-zubo-highlight-1-600 hover:from-zubo-highlight-1-600 hover:to-zubo-highlight-1-700 text-zubo-background-50 shadow-md transition-all duration-200 transform hover:scale-105"
                    size="sm"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Service
                  </Button>
                  <Button
                    onClick={() => handleViewDetails(booking)}
                    variant="outline"
                    className="w-full border-zubo-background-300 hover:bg-zubo-background-50 transition-all duration-200 text-zubo-text-700"
                    size="sm"
                  >
                    View Details
                  </Button>
                </>
              ) : ["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(booking.status) ? (
                <>
                  <Button
                    onClick={() => handleStartService(booking.id)}
                    className="w-full bg-gradient-to-r from-zubo-accent-500 to-zubo-accent-600 hover:from-zubo-accent-600 hover:to-zubo-accent-700 text-zubo-background-50 shadow-md transition-all duration-200 transform hover:scale-105"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Service
                  </Button>
                  <Button
                    onClick={() => handleViewDetails(booking)}
                    variant="outline"
                    className="w-full border-zubo-background-300 hover:bg-zubo-background-50 transition-all duration-200 text-zubo-text-700"
                    size="sm"
                  >
                    View Details
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleViewDetails(booking)}
                  variant="outline"
                  className="w-full border-zubo-background-300 hover:bg-zubo-background-50 transition-all duration-200 text-zubo-text-700"
                  size="sm"
                >
                  View Details
                </Button>
              )}
            </div>

            {/* Duration Badge */}
            <div className="mt-3 text-center">
              <Badge
                variant="secondary"
                className="bg-zubo-background-50/80 text-zubo-text-700 border border-zubo-background-200"
              >
                {booking.duration} duration
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zubo-background-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zubo-accent-600"></div>
      </div>
    )
  }

  const upcomingCount = bookings.filter((b) =>
    ["ASSIGNED", "CONFIRMED", "PENDING", "UPCOMING"].includes(b.status),
  ).length
  const ongoingCount = bookings.filter((b) => ["ONGOING"].includes(b.status)).length
  const completedCount = bookings.filter((b) => ["COMPLETED"].includes(b.status)).length
  const cancelledCount = bookings.filter((b) => ["CANCELLED"].includes(b.status)).length

  return (
    <div className="max-w-2xl md:max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6 bg-zubo-background-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zubo-text-900">My Bookings</h1>
          <p className="text-zubo-text-600 text-sm sm:text-base">Manage your pet care appointments</p>
        </div>
      </div>

      <Card className="shadow-md rounded-xl border border-zubo-background-200 bg-zubo-background-50">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl text-zubo-text-900">Booking History</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-zubo-text-600">
              View and manage your pet sitting appointments
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-transparent text-xs sm:text-sm border-zubo-primary-300 text-zubo-primary-700 hover:bg-zubo-primary-50"
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
            Calendar View
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 mb-4">
              {/* Mobile: Vertical Tabs */}
              <div className="block sm:hidden">
                <div className="grid grid-cols-2 gap-2">
                  <TabsList className="grid grid-cols-2 h-auto bg-zubo-background-50 p-1">
                    <TabsTrigger
                      value="upcoming"
                      className="text-xs py-2 data-[state=active]:bg-zubo-primary-500 data-[state=active]:text-zubo-background-50"
                    >
                      Upcoming
                      <span className="ml-1 bg-zubo-primary-100 text-zubo-primary-800 px-1.5 py-0.5 rounded-full text-xs">
                        {upcomingCount}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="ongoing"
                      className="text-xs py-2 data-[state=active]:bg-zubo-accent-500 data-[state=active]:text-zubo-background-50"
                    >
                      Ongoing
                      <span className="ml-1 bg-zubo-accent-100 text-zubo-accent-800 px-1.5 py-0.5 rounded-full text-xs">
                        {ongoingCount}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsList className="grid grid-cols-2 h-auto bg-zubo-background-50 p-1">
                    <TabsTrigger
                      value="completed"
                      className="text-xs py-2 data-[state=active]:bg-zubo-text-500 data-[state=active]:text-zubo-background-50"
                    >
                      Done
                      <span className="ml-1 bg-zubo-background-100 text-zubo-text-800 px-1.5 py-0.5 rounded-full text-xs">
                        {completedCount}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="cancelled"
                      className="text-xs py-2 data-[state=active]:bg-zubo-highlight-1-500 data-[state=active]:text-zubo-background-50"
                    >
                      Cancelled
                      <span className="ml-1 bg-zubo-highlight-1-100 text-zubo-highlight-1-800 px-1.5 py-0.5 rounded-full text-xs">
                        {cancelledCount}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Desktop: Horizontal Tabs */}
              <div className="hidden sm:flex justify-between items-center gap-2">
                <TabsList className="grid grid-cols-4 bg-zubo-background-50">
                  <TabsTrigger
                    value="upcoming"
                    className="data-[state=active]:bg-zubo-primary-500 data-[state=active]:text-zubo-background-50"
                  >
                    Upcoming ({upcomingCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="ongoing"
                    className="data-[state=active]:bg-zubo-accent-500 data-[state=active]:text-zubo-background-50"
                  >
                    Ongoing ({ongoingCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="data-[state=active]:bg-zubo-text-500 data-[state=active]:text-zubo-background-50"
                  >
                    Completed ({completedCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="data-[state=active]:bg-zubo-highlight-1-500 data-[state=active]:text-zubo-background-50"
                  >
                    Cancelled ({cancelledCount})
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 bg-transparent border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-50"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-zubo-text-400" />
                  <Input
                    placeholder="Search bookings..."
                    className="pl-10 text-sm rounded-lg bg-zubo-background-100 border-zubo-background-300 text-zubo-text-800 placeholder:text-zubo-text-400 focus:border-zubo-primary-500 focus:ring-zubo-primary-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 bg-transparent sm:hidden border-zubo-background-300 text-zubo-text-700 hover:bg-zubo-background-50"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tab Content remains the same but update action buttons for mobile */}
            <TabsContent value="upcoming" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-zubo-background-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="space-y-4">{filteredBookings.map(renderBookingCard)}</div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-zubo-text-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zubo-text-900 mb-1">No upcoming bookings</h3>
                  <p className="text-zubo-text-500">You don't have any upcoming bookings at the moment</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ongoing" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-zubo-background-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="space-y-4">{filteredBookings.map(renderBookingCard)}</div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-zubo-text-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zubo-text-900 mb-1">No ongoing services</h3>
                  <p className="text-zubo-text-500">You don't have any services in progress</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-zubo-background-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="space-y-4">{filteredBookings.map(renderBookingCard)}</div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-zubo-text-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zubo-text-900 mb-1">No completed bookings</h3>
                  <p className="text-zubo-text-500">You don't have any completed bookings yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-zubo-background-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="space-y-4">{filteredBookings.map(renderBookingCard)}</div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-zubo-text-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zubo-text-900 mb-1">No cancelled bookings</h3>
                  <p className="text-zubo-text-500">You don't have any cancelled bookings</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Service Start OTP Dialog */}
      <ServiceOTPDialog
        open={showStartOTP}
        onOpenChange={setShowStartOTP}
        bookingId={selectedBookingForOTP}
        action="start"
        onSuccess={handleOTPSuccess}
      />

      {/* Service End OTP Dialog */}
      <ServiceOTPDialog
        open={showEndOTP}
        onOpenChange={setShowEndOTP}
        bookingId={selectedBookingForOTP}
        action="end"
        onSuccess={handleOTPSuccess}
      />
    </div>
  )
}
