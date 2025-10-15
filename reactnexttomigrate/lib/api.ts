import type {
  UserProfile,
  Pet,
  Service,
  Caretaker,
  UpcomingBooking,
  Booking,
  CompanyDetails,
  Address,
} from "@/types/api"
import { getStoredUser } from "@/lib/auth"

// At the top of the file, add this check
const isDatabaseAvailable = () => {
  return process.env.DATABASE_URL && typeof window === "undefined"
}

// Base API URL
const API_BASE = "/api"

// Add call tracking for debugging
const apiCallTracker = new Map<string, { count: number; lastCall: number }>()

// Add this near the top after the apiCallTracker
const pendingCalls = new Map<string, Promise<any>>()

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("petcare_auth_token")
}

// Helper function to get user ID from localStorage
export function getUserId(): string | null {
  if (typeof window === "undefined") return null


  const userData = localStorage.getItem("petcare_user_data")

  if (userData) {
    try {
      const user = JSON.parse(userData)

      return user.id || null
    } catch (error) {
      console.error("❌ Error parsing user data from petcare_user_data:", error)
    }
  } else {
    const sitter = localStorage.getItem("sitter")
    if (sitter) {
      try {
        const user = JSON.parse(sitter)
        return user.userId || null
      } catch (error) {
        console.error("❌ Error parsing user data from sitter:", error)
      }
    }
  }

  // Fallback: try the old key
  const oldUserData = localStorage.getItem("user")
  console.log("🔍 getUserId - Raw user data from 'user' key:", oldUserData)

  if (oldUserData) {
    try {
      const user = JSON.parse(oldUserData)
      console.log("👤 getUserId - Parsed user from 'user' key:", user)
      console.log("🆔 getUserId - User ID from 'user' key:", user.id)
      return user.id || null
    } catch (error) {
      console.error("❌ Error parsing user data from 'user' key:", error)
    }
  }

  // Try using the helper function
  const storedUser = getStoredUser()
  console.log("🔍 getUserId - User from getStoredUser():", storedUser)

  if (storedUser) {
    console.log("🆔 getUserId - User ID from getStoredUser():", storedUser.id)
    return storedUser.id || null
  }

  console.log("❌ getUserId - No user ID found anywhere")
  return null
}

// Helper function for API calls with enhanced tracking
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE}${endpoint}`
  const method = options?.method || "GET"
  const callKey = `${method} ${endpoint}`

  // Check if this exact call is already pending
  if (pendingCalls.has(callKey)) {
    console.log(`🔄 Reusing pending call: ${callKey}`)
    return pendingCalls.get(callKey)
  }

  const now = Date.now()

  // Track API calls
  const existing = apiCallTracker.get(callKey)

  if (existing) {
    existing.count++
    const timeSinceLastCall = now - existing.lastCall
    existing.lastCall = now

    console.log(`🔄 API Call #${existing.count}: ${callKey}`)
    console.log(`⏱️ Time since last call: ${timeSinceLastCall}ms`)

    // Warn if too many calls in short time
    if (existing.count > 5 && timeSinceLastCall < 1000) {
      console.warn(`⚠️ POTENTIAL ISSUE: ${callKey} called ${existing.count} times, last call ${timeSinceLastCall}ms ago`)
      console.warn(`🔍 This might be causing rate limiting issues!`)
    }

    // Block rapid successive calls (less than 100ms apart)
    if (timeSinceLastCall < 100) {
      console.warn(`🚫 Blocking rapid call: ${callKey} (${timeSinceLastCall}ms since last call)`)
      throw new Error(`Too many rapid calls to ${callKey}`)
    }
  } else {
    apiCallTracker.set(callKey, { count: 1, lastCall: now })
    console.log(`🌐 First API Call: ${callKey}`)
  }

  // Log call stack to see where it's coming from
  console.log(`📍 Called from:`, new Error().stack?.split("\n")[2]?.trim())

  const authToken = getAuthToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }

  // Create the promise and store it
  const callPromise = fetch(fullUrl, {
    headers,
    ...options,
  })
    .then(async (response) => {
      // Remove from pending calls when done
      pendingCalls.delete(callKey)

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText} for ${callKey}`)

        // Special handling for rate limiting
        if (response.status === 429) {
          console.error(`🚫 RATE LIMITED: ${callKey}`)
          console.error(
            `📊 Call statistics:`,
            Array.from(apiCallTracker.entries()).map(([key, stats]) => ({
              endpoint: key,
              count: stats.count,
              lastCall: new Date(stats.lastCall).toISOString(),
            })),
          )
        }

        const errorText = await response.text()
        console.error(`❌ Error details:`, errorText)
        throw new Error(`API call failed: ${response.statusText}`)
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error(`❌ Failed to parse JSON response for ${callKey}:`, parseError)
        throw new Error(`API call failed: ${response.statusText}`)
      }

      console.log(`✅ API Response for ${callKey}:`, data)
      return data
    })
    .catch((error) => {
      // Remove from pending calls on error too
      pendingCalls.delete(callKey)
      throw error
    })

  // Store the pending call
  pendingCalls.set(callKey, callPromise)

  return callPromise
}

// Add a function to reset tracking (useful for debugging)
export function resetApiCallTracking() {
  apiCallTracker.clear()
  console.log("🔄 API call tracking reset")
}

// Add a function to get current tracking stats
export function getApiCallStats() {
  const stats = Array.from(apiCallTracker.entries()).map(([key, stats]) => ({
    endpoint: key,
    count: stats.count,
    lastCall: new Date(stats.lastCall).toISOString(),
  }))
  console.log("📊 Current API call statistics:", stats)
  return stats
}

// User Profile API calls
export async function fetchUserProfile(): Promise<UserProfile> {
  const userId = getUserId()
  console.log("🔍 fetchUserProfile - User ID:", userId)

  if (!userId) {
    console.error("❌ User ID not found in localStorage")
    console.log("🔍 Debug: All localStorage contents:")
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key!)
      console.log(`  ${key}: ${value}`)
    }
    throw new Error("User ID not found. Please login again.")
  }

  const queryParams = new URLSearchParams({ userId })
  const response = await apiCall<UserProfile>(`/user/profile?${queryParams.toString()}`)

  console.log("🔍 fetchUserProfile - API Response:", response)
  console.log("🔍 fetchUserProfile - Profile data structure:", {
    hasFirstName: !!response.firstName,
    hasLastName: !!response.lastName,
    hasEmail: !!response.email,
    hasPhone: !!response.phone,
    petsCount: response.pets?.length || 0,
    hasAddress: !!response.address,
  })

  return response
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const userId = getUserId()
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  return apiCall<UserProfile>("/user/profile", {
    method: "PUT",
    body: JSON.stringify({ ...profile, userId }),
  })
}

export async function fetchUserAddress(): Promise<Address> {
  const userId = getUserId()
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  const queryParams = new URLSearchParams({ userId })
  return apiCall<Address>(`/user/address?${queryParams.toString()}`)
}

export async function updateUserAddress(address: Partial<Address>): Promise<Address> {
  const userId = getUserId()
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  return apiCall<Address>("/user/address", {
    method: "PUT",
    body: JSON.stringify({ ...address, userId }),
  })
}

// Pets API calls
export async function fetchUserPets(): Promise<Pet[]> {
  const userId = getUserId()
  console.log("🐾 fetchUserPets - User ID:", userId)

  if (!userId) {
    console.error("❌ fetchUserPets - User ID not found")
    throw new Error("User ID not found. Please login again.")
  }

  const queryParams = new URLSearchParams({ userId })
  return apiCall<Pet[]>(`/pets?${queryParams.toString()}`)
}

export async function addPet(pet: Partial<Pet>): Promise<Pet> {
  console.log("🐾 addPet called with:", pet)
  const userId = getUserId()
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  return apiCall<Pet>("/pets", {
    method: "POST",
    body: JSON.stringify({ ...pet, userId }),
  })
}

export async function updatePet(pet: Partial<Pet> & { id: string }): Promise<Pet> {
  const userId = getUserId()
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  return apiCall<Pet>(`/pets/${pet.id}`, {
    method: "PUT",
    body: JSON.stringify({ ...pet, userId }),
  })
}

export async function deletePet(id: string): Promise<void> {
  const userId = getUserId()
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  await apiCall(`/pets/${id}`, {
    method: "DELETE",
    headers: {
      "X-User-ID": userId,
    },
  })
}

// Services API calls (these don't need user ID)
export async function fetchServices(): Promise<Service[]> {
  console.log("🔧 fetchServices - This should work without user ID")
  return apiCall<Service[]>("/services")
}

// Caretakers API calls
interface FetchCaretakersParams {
  serviceId: string
  date: string
  time: string
  location: { lat: number; lng: number } | null
  isRecurring: boolean
  recurringPattern: string | null
  recurringEndDate?: string
}

export async function fetchAvailableCaretakers(params: FetchCaretakersParams): Promise<Caretaker[]> {
  const searchParams = new URLSearchParams({
    serviceId: params.serviceId,
    date: params.date,
    time: params.time,
    isRecurring: params.isRecurring.toString(),
  })

  if (params.location) {
    searchParams.append("lat", params.location.lat.toString())
    searchParams.append("lng", params.location.lng.toString())
  }

  if (params.recurringPattern) {
    searchParams.append("recurringPattern", params.recurringPattern)
  }

  if (params.recurringEndDate) {
    searchParams.append("recurringEndDate", params.recurringEndDate)
  }

  return apiCall<Caretaker[]>(`/caretakers?${searchParams.toString()}`)
}

// Bookings API calls
export async function fetchBookings(): Promise<Booking[]> {
  const userId = getUserId()
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  // Send user ID as query parameter
  const queryParams = new URLSearchParams({ userId })
  return apiCall<Booking[]>(`/bookings?${queryParams.toString()}`, {
    headers: {
      "X-User-ID": userId, // Also send as header
    },
  })
}

export async function fetchUpcomingBooking(): Promise<UpcomingBooking | null> {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error("User ID not found. Please login again.")
    }

    const queryParams = new URLSearchParams({ userId })
    return await apiCall<UpcomingBooking>(`/bookings/upcoming?${queryParams.toString()}`)
  } catch (error) {
    // Return null if no upcoming booking found
    return null
  }
}

export async function createBooking(bookingData: any): Promise<Booking> {
  const userId = getUserId()
  if (!userId) {
    throw new Error("User ID not found. Please login again.")
  }

  return apiCall<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify({ ...bookingData, userId }),
  })
}

// Company details API calls
export async function fetchCompanyDetails(): Promise<CompanyDetails> {
  return apiCall<CompanyDetails>("/company/details")
}

// Payment API calls
export async function processPayment(paymentData: any): Promise<any> {
  return apiCall("/payment/process", {
    method: "POST",
    body: JSON.stringify(paymentData),
  })
}

// Mock function to send WhatsApp notifications
export async function sendWhatsAppNotification(notificationData: {
  to: string
  type: string
  bookingId?: string
  serviceOtp?: string
  bookingDetails?: any
}) {
  // Simulate API call to Twilio or similar service
  console.log(`Sending ${notificationData.type} notification to ${notificationData.to}`)

  let message = ""

  switch (notificationData.type) {
    case "booking_confirmation":
      message = `Your booking #${notificationData.bookingId} has been confirmed! Your service OTP is ${notificationData.serviceOtp}. Please share this with your caretaker when they arrive.`
      break
    case "service_start":
      message = `Your service for booking #${notificationData.bookingId} has started.`
      break
    case "service_end":
      message = `Your service for booking #${notificationData.bookingId} has ended. Thank you for using our service!`
      break
    default:
      message = `Notification from Pet Care Booking App`
  }

  console.log(`Message content: ${message}`)

  // Mock successful notification
  return {
    success: true,
    messageId: `msg_${Math.random().toString(36).substring(2, 15)}`,
    timestamp: new Date().toISOString(),
  }
}
