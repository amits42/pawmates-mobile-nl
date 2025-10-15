"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Calendar, DollarSign, Star, TrendingUp, Users, Clock, MapPin, Phone, Mail, Heart, Award } from "lucide-react"

interface DashboardStats {
  totalEarnings: number
  thisMonthEarnings: number
  upcomingBookings: number
  completedBookings: number
  rating: number
  totalReviews: number
}

interface RecentBooking {
  id: string
  petName: string
  service: string
  date: string
  time: string
  amount: number
  status: string
}

interface SitterProfile {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  photo: string
  bio: string
  experience: string
  rating: number
  totalBookings: number
  isVerified: boolean
  services: string[]
  hourlyRate: number
  address: {
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  wallet: {
    balance: number
    pendingAmount: number
    totalEarnings: number
  }
}

export default function SitterDashboard() {
  const { user, sitter, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sitterProfile, setSitterProfile] = useState<SitterProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we have a valid sitter (either sitter object or user with sitter type)
  const isSitter = sitter || (user && user.userType === "sitter")
  const sitterId = sitter?.userId || (user?.userType === "sitter" ? user.id : null)

  useEffect(() => {
    if (mounted && !loading && !isSitter) {
      console.log("🚫 SitterDashboard: Not a sitter, redirecting to login")
      router.push("/login")
    }
  }, [mounted, loading, isSitter, router])

  useEffect(() => {
    if (mounted && !loading && isSitter && sitterId) {
      console.log("🔍 SitterDashboard: Fetching sitter data for ID:", sitterId)
      fetchSitterData(sitterId)
    }
  }, [mounted, loading, isSitter, sitterId])

  const fetchSitterData = async (userId: string) => {
    try {
      setIsLoading(true)
      console.log("📊 SitterDashboard: Fetching data for user ID:", userId)

      // Fetch sitter profile
      const profileResponse = await fetch(`/api/sitters/profile?userId=${userId}`)
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setSitterProfile(profileData)
        console.log("✅ SitterDashboard: Profile data loaded:", profileData.name)
      } else {
        console.error("❌ SitterDashboard: Failed to load profile:", await profileResponse.text())
      }

      // Fetch dashboard stats
      const statsResponse = await fetch(`/api/sitters/dashboard-stats?userId=${userId}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
        console.log("✅ SitterDashboard: Stats loaded")
      } else {
        console.error("❌ SitterDashboard: Failed to load stats:", await statsResponse.text())
      }

      // Fetch recent bookings
      const bookingsResponse = await fetch(`/api/sitters/recent-bookings?userId=${userId}`)
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        setRecentBookings(bookingsData)
        console.log("✅ SitterDashboard: Recent bookings loaded:", bookingsData.length)
      } else {
        console.error("❌ SitterDashboard: Failed to load bookings:", await bookingsResponse.text())
      }
    } catch (error) {
      console.error("❌ SitterDashboard: Error fetching sitter data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || loading || !isSitter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zubo-background-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zubo-accent-600"></div>
      </div>
    )
  }

  if (isLoading || !sitterProfile || !stats) {
    return (
      <div className="container mx-auto p-6 bg-zubo-background-200">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zubo-background-300 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-zubo-background-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-zubo-background-200 text-zubo-text-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zubo-primary-700">Welcome back, {sitterProfile.name}!</h1>
          <p className="text-zubo-text-600">Here's your sitter dashboard overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge
            variant={sitterProfile.isVerified ? "default" : "secondary"}
            className={
              sitterProfile.isVerified
                ? "bg-zubo-accent-100 text-zubo-accent-800"
                : "bg-zubo-highlight-2-100 text-zubo-highlight-2-800"
            }
          >
            {sitterProfile.isVerified ? "✓ Verified" : "Pending Verification"}
          </Badge>
          <Avatar className="h-12 w-12">
            <AvatarImage src={sitterProfile.photo || "/placeholder.svg"} alt={sitterProfile.name} />
            <AvatarFallback className="bg-zubo-primary-500 text-zubo-background-50">
              {sitterProfile.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zubo-background-50 border-zubo-background-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zubo-text-700">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-zubo-text-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zubo-primary-700">₹{stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-zubo-text-500">From {stats.completedBookings} bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-zubo-background-50 border-zubo-background-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zubo-text-700">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-zubo-text-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zubo-primary-700">₹{stats.thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-zubo-text-500">Current month earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-zubo-background-50 border-zubo-background-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zubo-text-700">Upcoming Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-zubo-text-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zubo-primary-700">{stats.upcomingBookings}</div>
            <p className="text-xs text-zubo-text-500">Scheduled services</p>
          </CardContent>
        </Card>

        <Card className="bg-zubo-background-50 border-zubo-background-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zubo-text-700">Rating</CardTitle>
            <Star className="h-4 w-4 text-zubo-text-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center text-zubo-primary-700">
              {stats.rating.toFixed(1)}
              <Star className="h-5 w-5 text-zubo-highlight-2-400 fill-current ml-1" />
            </div>
            <p className="text-xs text-zubo-text-500">From {stats.totalReviews} reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="lg:col-span-1 bg-zubo-background-50 border-zubo-background-200">
          <CardHeader>
            <CardTitle className="flex items-center text-zubo-primary-700">
              <Users className="h-5 w-5 mr-2 text-zubo-primary-600" />
              Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarImage src={sitterProfile.photo || "/placeholder.svg"} alt={sitterProfile.name} />
                <AvatarFallback className="text-2xl bg-zubo-primary-500 text-zubo-background-50">
                  {sitterProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg text-zubo-text-800">{sitterProfile.name}</h3>
              <p className="text-sm text-zubo-text-600">{sitterProfile.experience} experience</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-zubo-text-700">
                <Mail className="h-4 w-4 mr-2 text-zubo-text-400" />
                {sitterProfile.email}
              </div>
              <div className="flex items-center text-sm text-zubo-text-700">
                <Phone className="h-4 w-4 mr-2 text-zubo-text-400" />
                {sitterProfile.phone}
              </div>
              <div className="flex items-center text-sm text-zubo-text-700">
                <MapPin className="h-4 w-4 mr-2 text-zubo-text-400" />
                {sitterProfile.address.city}, {sitterProfile.address.state}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-zubo-text-800">Services</h4>
              <div className="flex flex-wrap gap-1">
                {sitterProfile.services.map((service) => (
                  <Badge key={service} variant="secondary" className="bg-zubo-accent-100 text-zubo-accent-800 text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => router.push("/sitter/profile")}
                className="w-full bg-zubo-primary-500 text-zubo-background-50 hover:bg-zubo-primary-600"
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-zubo-background-50 border-zubo-background-200">
          <CardHeader>
            <CardTitle className="flex items-center text-zubo-primary-700">
              <Clock className="h-5 w-5 mr-2 text-zubo-primary-600" />
              Recent Bookings
            </CardTitle>
            <CardDescription className="text-zubo-text-600">Your latest pet care appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 border border-zubo-background-300 rounded-lg bg-zubo-background-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-zubo-highlight-1-100 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5 text-zubo-highlight-1-600" />
                      </div>
                      <div>
                        <p className="font-medium text-zubo-text-800">{booking.petName}</p>
                        <p className="text-sm text-zubo-text-600">{booking.service}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-zubo-text-800">₹{booking.amount}</p>
                      <p className="text-sm text-zubo-text-600">
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() => router.push("/sitter/bookings")}
                  variant="outline"
                  className="w-full border-zubo-primary-500 text-zubo-primary-700 hover:bg-zubo-primary-50"
                >
                  View All Bookings
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-zubo-text-400 mx-auto mb-4" />
                <p className="text-zubo-text-600">No recent bookings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => router.push("/sitter/wallet")}
          className="h-16 bg-zubo-accent-600 text-zubo-background-50 hover:bg-zubo-accent-700"
        >
          <div className="text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-1" />
            <span>View Wallet</span>
          </div>
        </Button>
        <Button
          onClick={() => router.push("/sitter/bookings")}
          variant="outline"
          className="h-16 border-zubo-primary-500 text-zubo-primary-700 hover:bg-zubo-primary-50"
        >
          <div className="text-center">
            <Calendar className="h-6 w-6 mx-auto mb-1" />
            <span>Manage Bookings</span>
          </div>
        </Button>
        <Button
          onClick={() => router.push("/sitter/profile")}
          variant="outline"
          className="h-16 border-zubo-primary-500 text-zubo-primary-700 hover:bg-zubo-primary-50"
        >
          <div className="text-center">
            <Award className="h-6 w-6 mx-auto mb-1" />
            <span>Update Profile</span>
          </div>
        </Button>
      </div>
    </div>
  )
}
