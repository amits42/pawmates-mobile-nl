import type { User } from "@/types/auth"

const AUTH_TOKEN_KEY = "petcare_auth_token"
const USER_DATA_KEY = "petcare_user_data"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function removeStoredToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_DATA_KEY)
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const userData = localStorage.getItem(USER_DATA_KEY)
    console.log("🔍 getStoredUser - Raw localStorage data:", userData)

    if (!userData) {
      console.log("❌ No user data found in localStorage")
      return null
    }

    const parsedUser = JSON.parse(userData)

    return parsedUser
  } catch (error) {
    console.error("❌ Error parsing stored user:", error)
    return null
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === "undefined") return
  try {
    console.log("💾 setStoredUser - Storing user:", user)
    console.log("🆔 setStoredUser - User ID being stored:", user.id)
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))

    // Verify it was stored correctly
    const stored = localStorage.getItem(USER_DATA_KEY)
    console.log("✅ setStoredUser - Verification - Stored data:", stored)
  } catch (error) {
    console.error("❌ Error storing user:", error)
  }
}

export function isValidPhoneNumber(phone: string): boolean {
  // If phone already has +91 prefix
  if (phone.startsWith("+91")) {
    return /^\+91[6-9]\d{9}$/.test(phone)
  }

  // If phone is just the 10 digits
  return /^[6-9]\d{9}$/.test(phone)
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "")

  // If already has +91 prefix, return as is
  if (cleaned.startsWith("+91")) {
    return cleaned
  }

  // If starts with 91 without +, add the +
  if (cleaned.startsWith("91") && cleaned.length >= 12) {
    return `+${cleaned}`
  }

  // Otherwise assume it's a 10-digit Indian number and add +91
  return `+91${cleaned}`
}
