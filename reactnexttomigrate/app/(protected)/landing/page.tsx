"use client"

import Image from "next/image"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight, CheckCircle, Sparkles, Dog } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface Booking {
  id: string
  date: string
  recurring: boolean
  time: string
  status: string
  total_price: number
  service_name?: string
  pet_name?: string
  pet_image: string
  pet_type?: string
  sitter_name?: string
  notes?: string
}

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(true)

  useEffect(() => {
    if (!loading && user?.isAuthenticated) {
      fetchUpcomingBooking()
    }
  }, [user, loading])

  const fetchUpcomingBooking = async () => {
    try {
      setBookingsLoading(true)
      console.log("🔍 Fetching upcoming booking...")

      // Get userId from auth context
      if (!user?.id) {
        console.log("❌ No user ID available")
        setUpcomingBooking(null)
        return
      }

      const response = await fetch(`/api/bookings/upcoming?userId=${user.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          // No upcoming booking found
          console.log("📅 No upcoming booking found")
          setUpcomingBooking(null)
          return
        }
        throw new Error("Failed to fetch upcoming booking")
      }

      const upcomingBookingData: Booking = await response.json()
      console.log("⏰ Upcoming booking:", upcomingBookingData)
      setUpcomingBooking(upcomingBookingData)
    } catch (error) {
      console.error("❌ Error fetching upcoming booking:", error)
      setUpcomingBooking(null)
    } finally {
      setBookingsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zubo-background-200 via-zubo-background-50 to-zubo-background-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zubo-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-zubo-text-700">Loading PetCare...</p>
        </div>
      </div>
    )
  }

  const getPetEmoji = (petType?: string) => {
    if (!petType) return "🐾"
    switch (petType.toLowerCase()) {
      case "dog":
        return "🐕"
      case "cat":
        return "🐱"
      case "bird":
        return "🐦"
      case "fish":
        return "🐠"
      case "rabbit":
        return "🐰"
      default:
        return "🐾"
    }
  }

  const getServiceEmoji = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    if (name.includes("walk")) return "🚶‍♂️"
    if (name.includes("sit")) return "🏠"
    if (name.includes("groom")) return "✂️"
    if (name.includes("vet")) return "🏥"
    if (name.includes("feed")) return "🍽️"
    return "🐾"
  }

  const formatDate = (dateString: string) => {
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

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zubo-background-50 via-white to-zubo-primary-50 pb-20 md:pb-8 overflow-x-hidden">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zubo-primary-500/10 via-zubo-highlight-1-500/5 to-zubo-accent-500/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-zubo-primary-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-zubo-highlight-1-200 rounded-full blur-lg opacity-40 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-zubo-accent-200 rounded-full blur-2xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8 md:py-16 max-w-7xl">
          <div className="text-center max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-zubo-primary-500 to-zubo-highlight-1-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-6 shadow-2xl border border-zubo-primary-100">
                  <Image src="/favicon/favicon.svg" alt="Zubo Pets Logo" width={56} height={56} className="h-14 w-14" />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-zubo-primary-100 to-zubo-highlight-1-100 rounded-full border border-zubo-primary-200 mb-6">
                <span className="text-sm font-semibold text-zubo-primary-700">Welcome to Zubo Pets</span>
              </div>

              <h1 className="text-4xl gradient-text md:text-7xl font-bold mb-6 bg-gradient-to-r from-zubo-primary-600 via-zubo-highlight-1-600 to-zubo-accent-600 bg-clip-text text-transparent leading-tight">
                Your Pet's Happy Place! 🐾
              </h1>

              <p className="text-xl md:text-2xl text-zubo-text-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                Professional, reliable, and loving care for your furry friends.
                <br className="hidden md:block" />
                <span className="font-semibold text-zubo-primary-600">
                  Book trusted pet care services in just a few taps.
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/book-service">
                <Button
                  size="lg"
                  className="group bg-zubo-primary-500 hover:bg-zubo-primary-600 text-white px-10 py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0"
                >
                  <Calendar className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                  Book a Service Now
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Link href="/my-bookings">
                <Button
                  variant="outline"
                  size="lg"
                  className="group border-2 border-zubo-primary-500 text-zubo-primary-600 hover:bg-zubo-primary-500 hover:text-white px-10 py-6 text-lg font-bold transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl"
                >
                  <CheckCircle className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  My Bookings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Enhanced Upcoming Booking Section */}
        {bookingsLoading ? (
          <Card className="mb-12 border-0 shadow-2xl bg-gradient-to-r from-zubo-background-50 to-white overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-zubo-primary-200 border-t-zubo-primary-500 mx-auto mb-6"></div>
              <p className="text-xl text-zubo-primary-700 font-medium">Loading your bookings...</p>
            </CardContent>
          </Card>
        ) : upcomingBooking ? (
          <Card className="mb-12 border-0 shadow-2xl bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zubo-background-200 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-zubo-primary-200 rounded-full blur-2xl opacity-30"></div>

            <CardHeader className="relative pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-zubo-text-800 flex items-center mb-2">
                    <div className="bg-zubo-primary-500 rounded-full p-2 mr-4">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    Upcoming Booking
                  </CardTitle>
                </div>
                <div className="hidden md:block">
                  <div className="bg-zubo-background-100 rounded-2xl p-4 shadow-lg">
                    <Calendar className="h-12 w-12 text-zubo-primary-600" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="bg-zubo-background-50 rounded-2xl p-6 border border-zubo-background-200 shadow-lg mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-5 w-5 text-zubo-primary-600 mr-2" />
                      <span className="font-bold text-zubo-text-800">Date</span>
                    </div>
                    <p className="text-zubo-text-700 font-semibold">{formatDate(upcomingBooking.date)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-zubo-primary-600 mr-2" />
                      <span className="font-bold text-zubo-text-800">Time</span>
                    </div>
                    <p className="text-zubo-text-700 font-semibold">{
                      (() => {
                        if (!upcomingBooking.time) return "-"
                        try {
                          const d = new Date(`1970-01-01T${upcomingBooking.time}`)
                          return d.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        } catch {
                          return upcomingBooking.time
                        }
                      })()
                    }</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Dog className="h-5 w-5 text-zubo-primary-600 mr-2" />
                      <span className="font-bold text-zubo-text-800">Pet</span>
                    </div>
                    <p className="text-zubo-text-700 font-semibold">{upcomingBooking.pet_name || "Your Pet"}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-zubo-primary-600 mr-2 font-bold">₹</span>
                      <span className="font-bold text-zubo-text-800">Amount</span>
                    </div>
                    <p className="text-zubo-text-700 font-semibold">{formatPrice(upcomingBooking.total_price)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-zubo-background-50 rounded-2xl p-6 border border-zubo-background-200 shadow-lg mb-6">
                <div className="text-center">
                  <span className="font-bold text-zubo-text-800 text-lg">Zubo Walker: </span>
                  <span className="text-zubo-text-700 font-semibold">
                    {upcomingBooking.sitter_name || "Professional Walker"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={
                    upcomingBooking.recurring
                      ? `/recurring-session?recurringBookingId=${upcomingBooking.id}`
                      : `/booking-details/${upcomingBooking.id}`
                  }
                >
                  <Button className="w-full sm:w-auto bg-zubo-primary-500 hover:bg-zubo-primary-600 text-white font-bold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    View Booking
                  </Button>
                </Link>
                <Link href={`/support?bookingId=${upcomingBooking.id}`}>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-zubo-primary-500 text-zubo-primary-600 hover:bg-zubo-primary-500 hover:text-white font-bold px-8 py-4 text-lg transition-all duration-300 bg-white shadow-lg hover:shadow-xl"
                  >
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-12 border-0 shadow-2xl bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-zubo-primary-200 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-zubo-background-200 rounded-full blur-2xl opacity-30"></div>

            <CardHeader className="relative text-center pb-6">
              <div className="bg-zubo-background-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="h-10 w-10 text-zubo-primary-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-zubo-text-800 mb-3">
                No walks scheduled — book one now!
              </CardTitle>
              <CardDescription className="text-zubo-text-600 text-xl font-medium">
                Give your pet the care they deserve
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center relative">
              <p className="text-zubo-text-700 mb-8 text-xl leading-relaxed max-w-2xl mx-auto">
                Schedule professional pet care services with our trusted walkers.
                <br />
                <span className="font-semibold">Your pet's happiness is just one click away!</span>
              </p>
              <Link href="/book-service">
                <Button
                  size="lg"
                  className="bg-zubo-primary-500 hover:bg-zubo-primary-600 text-white px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  Book a Walk
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
