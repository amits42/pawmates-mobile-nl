"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getStoredToken, getStoredUser, setStoredToken, setStoredUser, removeStoredToken } from "@/lib/auth"
import type { AuthContextType, User, Sitter, VerifyOTPResponse } from "@/types/auth"
import { installAPIInterceptor } from "@/lib/api-interceptor"
// import { messaging } from "@/lib/firebase";
import { getUserId } from "@/lib/api";
// import { getToken } from "firebase/messaging"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper functions to manage sitter state in localStorage
const getStoredSitter = (): Sitter | null => {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem("sitter")
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error parsing stored sitter:", error)
    return null
  }
}

const setStoredSitter = (sitter: Sitter): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("sitter", JSON.stringify(sitter))
  } catch (error) {
    console.error("Error storing sitter:", error)
  }
}

const removeStoredSitter = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("sitter")
}

// Helper functions to manage isNewUser state in localStorage
const getStoredIsNewUser = (): boolean => {
  if (typeof window === "undefined") return false
  const stored = localStorage.getItem("isNewUser")
  return stored === "true"
}

const setStoredIsNewUser = (isNewUser: boolean): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("isNewUser", isNewUser.toString())
}

const removeStoredIsNewUser = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("isNewUser")
}

const removeRedirection = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("postLoginRedirect")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sitter, setSitter] = useState<Sitter | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    console.log("🔄 AuthProvider: Initializing...")

    const initAuth = async () => {
      const token = getStoredToken()
      const storedUser = getStoredUser()
      const storedSitter = getStoredSitter()
      const storedIsNewUser = getStoredIsNewUser()

      console.log("🔍 AuthProvider - Stored Data Check:")
      console.log("  - token exists:", !!token)
      console.log("  - storedUser:", storedUser)
      console.log("  - storedSitter:", storedSitter)
      console.log("  - storedIsNewUser:", storedIsNewUser)

      if (!token) {
        console.log("❌ AuthProvider: No token found")
        setLoading(false)
        return
      }

      try {
        const res = await fetch("/api/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const result = await res.json()

        if (!res.ok || !result.valid) {
          console.warn("⚠️ AuthProvider: Token invalid - clearing localStorage")
          removeStoredToken()
          removeStoredIsNewUser()
          removeStoredSitter()
          setUser(null)
          setSitter(null)
          setIsNewUser(false)
        } else {
          console.log("✅ AuthProvider: Token verified")

          if (storedUser) {
            const authenticatedUser = {
              ...storedUser,
              isAuthenticated: true,
            }
            setUser(authenticatedUser)
            setIsNewUser(storedIsNewUser)
            console.log("👤 User ID from storage:", storedUser.id)
          } else if (storedSitter) {
            setSitter(storedSitter)
          } else {
            console.warn("⚠️ AuthProvider: Token valid but no User/Zubo Walkers found - clearing token")
            removeStoredToken()
          }
        }
      } catch (err) {
        console.error("❌ AuthProvider: Error verifying token:", err)
        removeStoredToken()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
    installAPIInterceptor()
  }, [])

  // Debug effect to track user state changes
  useEffect(() => {
    console.log("👤 AuthProvider - User State Changed:")
    console.log("  - user:", user)
    console.log("  - user.id:", user?.id)
    console.log("  - sitter:", sitter)
    console.log("  - sitter.id:", sitter?.id)
    console.log("  - loading:", loading)
    console.log("  - isNewUser:", isNewUser)
  }, [user, sitter, loading, isNewUser])

  const login = async (phone: string, userType: "pet_owner" | "Zubo Walkers" = "pet_owner"): Promise<void> => {
    console.log(`📞 AuthProvider: Starting login for ${phone} as ${userType}`)
    setLoading(true)
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message)
      }
      console.log("✅ AuthProvider: OTP sent successfully")
    } catch (error) {
      console.error("❌ AuthProvider: Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (
    phone: string,
    otp: string,
    userType: "pet_owner" | "Zubo Walkers" = "pet_owner",
  ): Promise<boolean> => {
    console.log(`🔐 AuthProvider: Verifying OTP for ${phone} as ${userType}`)
    setLoading(true)
    try {
      const endpoint = userType === "sitter" ? "/api/sitters/verify-otp" : "/api/auth/verify-otp"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, otp }),
      })

      const data: VerifyOTPResponse = await response.json()
      console.log(`📥 AuthProvider: OTP verification response:`, data)

      if (!data.success) {
        throw new Error(data.message)
      }

      if (data.token) {
        console.log("💾 AuthProvider: Storing token and user data")
        setStoredToken(data.token)

        if (userType === "sitter") {
          // Handle sitter login
          if (data.sitter) {
            console.log("✅ AuthProvider: Sitter authenticated:", data.sitter.name)
            setStoredSitter(data.sitter)
            setSitter(data.sitter)
            setUser(null) // Clear user state

            // Clear any user-related storage
            removeStoredIsNewUser()
            setIsNewUser(false)

            return false // Sitters are never new users
          } else {
            console.error("❌ AuthProvider: No Zubo Walkers data in response")
            throw new Error("Invalid Zubo Walkers authentication response")
          }
        } else {
          // Handle pet owner login
          if (data.user) {
            // Store the complete user object from database
            const authenticatedUser = {
              ...data.user,
              // Ensure required fields are present
              phone: data.user.phone || phone,
              isAuthenticated: true,
              // Generate a user ID if not present
              id: data.user.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            }

            console.log("💾 AuthProvider: Storing user data:", authenticatedUser)
            setStoredUser(authenticatedUser)
            setUser(authenticatedUser)
            setSitter(null) // Clear sitter state

            // Create and store JWT token
            // const jwtToken = createJWTToken({
            //   userId: authenticatedUser.id,
            //   phone: authenticatedUser.phone,
            //   userType: "OWNER",
            // })
            // setStoredToken(jwtToken)
            // console.log("🔑 AuthProvider: Created and stored JWT token")

            console.log("✅ AuthProvider: User authenticated with ID:", authenticatedUser.id)

            // Check if this is a new user
            if (data.isNewUser) {
              console.log("🆕 AuthProvider: New user detected")
              setIsNewUser(true)
              setStoredIsNewUser(true)
              return true // Return true to indicate this is a new user
            } else {
              console.log("👤 AuthProvider: Existing user")
              setIsNewUser(false)
              setStoredIsNewUser(false)
            }
          } else {
            console.error("❌ AuthProvider: No user data in response")
            throw new Error("Invalid user authentication response")
          }
        }
      } else {
        console.error("❌ AuthProvider: No token in response")
        throw new Error("No authentication token received")
      }

      return false // Return false to indicate this is an existing user
    } catch (error) {
      console.error("❌ AuthProvider: OTP verification error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (userData: Partial<User>): Promise<void> => {
    if (!user) {
      console.error("❌ AuthProvider: Cannot update profile - no user")
      return
    }

    try {
      // Update profile on server first
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userData,
          userId: user.id, // Use user ID instead of phone
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile on server")
      }

      const updatedUser = { ...user, ...userData }
      setStoredUser(updatedUser)
      setUser(updatedUser)

      // Clear the new user flag after profile completion
      console.log("✅ AuthProvider: Profile updated, clearing isNewUser flag")
      setIsNewUser(false)
      removeStoredIsNewUser()
    } catch (error) {
      console.error("❌ AuthProvider: Update user profile error:", error)
      throw error
    }
  }

  const updateSitterProfile = async (sitterData: Partial<Sitter>): Promise<void> => {
    if (!sitter) {
      console.error("❌ AuthProvider: Cannot update  Zubo Walkers profile - no Zubo Walkers")
      return
    }

    try {
      // Update profile on server first
      const response = await fetch(`/api/sitters/profile?userId=${sitter.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sitterData),
      })

      if (!response.ok) {
        throw new Error("Failed to update Zubo Walkers profile on server")
      }

      const updatedSitter = { ...sitter, ...sitterData }
      setStoredSitter(updatedSitter)
      setSitter(updatedSitter)
      console.log("✅ AuthProvider: Sitter profile updated")
    } catch (error) {
      console.error("❌ AuthProvider: Update sitter profile error:", error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    console.log("🚪 AuthProvider: Logging out")
    // Remove FCM token from backend
    // try {
    //   if (messaging && typeof window !== "undefined") {
    //     const fcmToken = await getToken(messaging, { vapidKey: "BFRlMOq7VE6H9XEVKHfYvUzJw536VOs4mGyV2B8z_SdF7VgqqGiCcoTJAdmudmpgR4jXMV3vcOlkMIoAQ-73ZGg" }); const userId = getUserId();
    //     if (fcmToken && userId) {
    //       await fetch('/api/notifications/delete-fcm-token', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ userId, fcmToken }),
    //       });
    //     }
    //   }
    // } catch (err) {
    //   console.warn("Failed to remove FCM token on logout", err);
    // }
    removeStoredToken()
    removeStoredIsNewUser()
    removeRedirection()
    removeStoredSitter()
    setUser(null)
    setSitter(null)
    setIsNewUser(false)
  }

  const value: AuthContextType = {
    user,
    sitter,
    login,
    verifyOTP,
    logout,
    loading,
    isNewUser,
    updateUserProfile,
    updateSitterProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
