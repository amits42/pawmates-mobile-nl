"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { AuthContextType, User, Sitter, VerifyOTPResponse } from "@/types/auth"
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  removeStoredToken,
  getStoredSitter,
  setStoredSitter,
  removeStoredSitter,
  getStoredIsNewUser,
  setStoredIsNewUser,
  removeStoredIsNewUser,
  removeStoredUser,
} from "@/lib/auth-storage"
import { API_CONFIG } from "@/lib/api-config"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sitter, setSitter] = useState<Sitter | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    console.log("[v0] AuthProvider: Initializing...")

    const initAuth = async () => {
      try {
        const token = await getStoredToken()
        const storedUser = await getStoredUser()
        const storedSitter = await getStoredSitter()
        const storedIsNewUser = await getStoredIsNewUser()

        console.log("[v0] AuthProvider - Stored Data Check:")
        console.log("[v0]   - token exists:", !!token)
        console.log("[v0]   - storedUser:", storedUser)
        console.log("[v0]   - storedSitter:", storedSitter)
        console.log("[v0]   - storedIsNewUser:", storedIsNewUser)

        if (!token) {
          console.log("[v0] AuthProvider: No token found")
          setLoading(false)
          return
        }

        try {
          const res = await fetch(API_CONFIG.ENDPOINTS.VERIFY_TOKEN, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          })

          const result = await res.json()

          if (!res.ok || !result.valid) {
            console.warn("[v0] AuthProvider: Token invalid - clearing AsyncStorage")
            await removeStoredToken()
            await removeStoredIsNewUser()
            await removeStoredSitter()
            await removeStoredUser()
            setUser(null)
            setSitter(null)
            setIsNewUser(false)
          } else {
            console.log("[v0] AuthProvider: Token verified")

            if (storedUser) {
              const authenticatedUser = {
                ...storedUser,
                isAuthenticated: true,
              }
              setUser(authenticatedUser)
              setIsNewUser(storedIsNewUser)
              console.log("[v0] User ID from storage:", storedUser.id)
            } else if (storedSitter) {
              setSitter(storedSitter)
            } else {
              console.warn("[v0] AuthProvider: Token valid but no User/Sitter found - clearing token")
              await removeStoredToken()
            }
          }
        } catch (err) {
          console.error("[v0] AuthProvider: Error verifying token:", err)
          await removeStoredToken()
        }
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (phone: string, userType: "pet_owner" | "sitter" = "pet_owner"): Promise<void> => {
    console.log(`[v0] AuthProvider: Starting login for ${phone} as ${userType}`)
    setLoading(true)
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SEND_OTP, {
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
      console.log("[v0] AuthProvider: OTP sent successfully")
    } catch (error) {
      console.error("[v0] AuthProvider: Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (
    phone: string,
    otp: string,
    userType: "pet_owner" | "sitter" = "pet_owner",
  ): Promise<boolean> => {
    console.log(`[v0] AuthProvider: Verifying OTP for ${phone} as ${userType}`)
    setLoading(true)
    try {
      const endpoint = userType === "sitter" ? API_CONFIG.ENDPOINTS.SITTER_VERIFY_OTP : API_CONFIG.ENDPOINTS.VERIFY_OTP

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, otp }),
      })

      const data: VerifyOTPResponse = await response.json()
      console.log(`[v0] AuthProvider: OTP verification response:`, data)

      if (!data.success) {
        throw new Error(data.message)
      }

      if (data.token) {
        console.log("[v0] AuthProvider: Storing token and user data")
        await setStoredToken(data.token)

        if (userType === "sitter") {
          // Handle sitter login
          if (data.sitter) {
            console.log("[v0] AuthProvider: Sitter authenticated:", data.sitter.name)
            await setStoredSitter(data.sitter)
            setSitter(data.sitter)
            setUser(null)

            await removeStoredIsNewUser()
            setIsNewUser(false)

            return false
          } else {
            console.error("[v0] AuthProvider: No sitter data in response")
            throw new Error("Invalid sitter authentication response")
          }
        } else {
          // Handle pet owner login
          if (data.user) {
            const authenticatedUser = {
              ...data.user,
              phone: data.user.phone || phone,
              isAuthenticated: true,
              id: data.user.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            }

            console.log("[v0] AuthProvider: Storing user data:", authenticatedUser)
            await setStoredUser(authenticatedUser)
            setUser(authenticatedUser)
            setSitter(null)

            console.log("[v0] AuthProvider: User authenticated with ID:", authenticatedUser.id)

            if (data.isNewUser) {
              console.log("[v0] AuthProvider: New user detected")
              setIsNewUser(true)
              await setStoredIsNewUser(true)
              return true
            } else {
              console.log("[v0] AuthProvider: Existing user")
              setIsNewUser(false)
              await setStoredIsNewUser(false)
            }
          } else {
            console.error("[v0] AuthProvider: No user data in response")
            throw new Error("Invalid user authentication response")
          }
        }
      } else {
        console.error("[v0] AuthProvider: No token in response")
        throw new Error("No authentication token received")
      }

      return false
    } catch (error) {
      console.error("[v0] AuthProvider: OTP verification error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (userData: Partial<User>): Promise<void> => {
    if (!user) {
      console.error("[v0] AuthProvider: Cannot update profile - no user")
      return
    }

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.USER_PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userData,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile on server")
      }

      const updatedUser = { ...user, ...userData }
      await setStoredUser(updatedUser)
      setUser(updatedUser)

      console.log("[v0] AuthProvider: Profile updated, clearing isNewUser flag")
      setIsNewUser(false)
      await removeStoredIsNewUser()
    } catch (error) {
      console.error("[v0] AuthProvider: Update user profile error:", error)
      throw error
    }
  }

  const updateSitterProfile = async (sitterData: Partial<Sitter>): Promise<void> => {
    if (!sitter) {
      console.error("[v0] AuthProvider: Cannot update sitter profile - no sitter")
      return
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SITTER_PROFILE}?userId=${sitter.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sitterData),
      })

      if (!response.ok) {
        throw new Error("Failed to update sitter profile on server")
      }

      const updatedSitter = { ...sitter, ...sitterData }
      await setStoredSitter(updatedSitter)
      setSitter(updatedSitter)
      console.log("[v0] AuthProvider: Sitter profile updated")
    } catch (error) {
      console.error("[v0] AuthProvider: Update sitter profile error:", error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    console.log("[v0] AuthProvider: Logging out")
    await removeStoredToken()
    await removeStoredIsNewUser()
    await removeStoredSitter()
    await removeStoredUser()
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
