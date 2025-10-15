"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, ClipboardList, User, LogOut } from "lucide-react"
import { fetchUpcomingBooking, fetchCompanyDetails } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import type { UpcomingBooking, CompanyDetails } from "@/types/api"

export default function HomePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [upcomingBooking, setUpcomingBooking] = useState<UpcomingBooking | null>(null)
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)
  const [loading, setLoading] = useState(true)

  // Debug effect to track user state
  useEffect(() => {
    console.log("🏠 HomePage - User State:")
    console.log("  - user:", user)
    console.log("  - user?.phone:", user?.phone)
    console.log("  - user?.name:", user?.name)
    console.log("  - user?.isAuthenticated:", user?.isAuthenticated)
  }, [user])

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("📊 HomePage: Loading data...")
        const bookingData = await fetchUpcomingBooking()
        const companyData = await fetchCompanyDetails()

        setUpcomingBooking(bookingData)
        setCompanyDetails(companyData)
        console.log("✅ HomePage: Data loaded successfully")
      } catch (error) {
        console.error("❌ HomePage: Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleLogout = () => {
    console.log("🚪 HomePage: Logging out")
    logout()
    router.push("/login")
  }

  // Get display name with comprehensive fallbacks
  const getDisplayName = () => {
    console.log("🏷️ HomePage: Getting display name for user:", user)

    if (!user) {
      console.log("⚠️ HomePage: No user object found")
      return "Pet Lover"
    }

    if (user.name && user.name.trim()) {
      console.log("✅ HomePage: Using user name:", user.name)
      return user.name
    }

    if (user.phone) {
      const phoneStr = String(user.phone)
      const displayPhone = phoneStr.startsWith("+") ? phoneStr.slice(1) : phoneStr
      console.log("📞 HomePage: Using phone number:", displayPhone)
      return displayPhone
    }

    console.log("🔄 HomePage: Using fallback name")
    return "Pet Lover"
  }

  // If user is not available, show error state
  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">User data is not available. Please log in again.</p>
          <Button onClick={() => router.push("/login")} className="bg-red-600 hover:bg-red-700">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-blue-700">Loading your pet care dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800">Welcome, {getDisplayName()}!</h1>
        <Button variant="outline" onClick={handleLogout} className="border-red-300 text-red-600 hover:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Debug Info (remove in production) */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
        <strong>Debug Info:</strong>
        <br />
        User ID: {user?.id || "N/A"}
        <br />
        Phone: {user?.phone || "N/A"}
        <br />
        Name: {user?.name || "N/A"}
        <br />
        Authenticated: {user?.isAuthenticated ? "Yes" : "No"}
      </div>

      {/* Rest of the component remains the same */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-blue-50 p-1 rounded-xl">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300"
          >
            Services
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300"
          >
            About Us
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          {/* Quick Actions */}
          <h2 className="text-2xl font-bold mb-6 text-blue-800">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/book-service" className="w-full">
              <Button
                variant="outline"
                className="w-full h-28 flex flex-col bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-800"
              >
                <Calendar className="h-8 w-8 mb-2 text-blue-600" />
                <span className="font-semibold">Book a Service</span>
              </Button>
            </Link>
            <Link href="/my-bookings" className="w-full">
              <Button
                variant="outline"
                className="w-full h-28 flex flex-col bg-orange-50 border-orange-300 hover:bg-orange-100 text-orange-800"
              >
                <ClipboardList className="h-8 w-8 mb-2 text-orange-600" />
                <span className="font-semibold">My Bookings</span>
              </Button>
            </Link>
            <Link href="/profile" className="w-full">
              <Button
                variant="outline"
                className="w-full h-28 flex flex-col bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-800"
              >
                <User className="h-8 w-8 mb-2 text-purple-600" />
                <span className="font-semibold">Manage Profile</span>
              </Button>
            </Link>
            <Link href="/profile/pets" className="w-full">
              <Button
                variant="outline"
                className="w-full h-28 flex flex-col bg-green-50 border-green-300 hover:bg-green-100 text-green-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 mb-2 text-green-600"
                >
                  <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
                  <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5" />
                  <path d="M8 14v.5" />
                  <path d="M16 14v.5" />
                  <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
                  <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306" />
                </svg>
                <span className="font-semibold">My Pets</span>
              </Button>
            </Link>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold mb-4">Our Services</h3>
            <p className="text-gray-600">Service information will be loaded here.</p>
          </div>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold mb-4">About Us</h3>
            <p className="text-gray-600">Company information will be loaded here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
