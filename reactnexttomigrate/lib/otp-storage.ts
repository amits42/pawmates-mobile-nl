// Simple in-memory OTP storage for development
// In production, this should be replaced with a database

interface OTPData {
  otp: string
  expires: number
  attempts: number
}

class OTPStorage {
  private storage = new Map<string, OTPData>()

  set(phone: string, data: OTPData): void {
    try {
      this.storage.set(phone, data)
      console.log(`💾 OTP stored for ${phone}:`, { otp: data.otp, expires: new Date(data.expires) })
    } catch (error) {
      console.error("❌ Error storing OTP:", error)
      throw error
    }
  }

  get(phone: string): OTPData | null {
    try {
      const data = this.storage.get(phone) || null
      if (data) {
        console.log(`📖 OTP retrieved for ${phone}:`, { otp: data.otp, expires: new Date(data.expires) })
      } else {
        console.log(`❌ No OTP found for ${phone}`)
      }
      return data
    } catch (error) {
      console.error("❌ Error retrieving OTP:", error)
      return null
    }
  }

  delete(phone: string): void {
    try {
      this.storage.delete(phone)
      console.log(`🗑️ OTP deleted for ${phone}`)
    } catch (error) {
      console.error("❌ Error deleting OTP:", error)
    }
  }

  keys(): string[] {
    try {
      return Array.from(this.storage.keys())
    } catch (error) {
      console.error("❌ Error getting OTP keys:", error)
      return []
    }
  }

  // Clean up expired OTPs
  cleanup(): void {
    try {
      const now = Date.now()
      for (const [phone, data] of this.storage.entries()) {
        if (data.expires < now) {
          this.storage.delete(phone)
          console.log(`🧹 Cleaned up expired OTP for ${phone}`)
        }
      }
    } catch (error) {
      console.error("❌ Error during OTP cleanup:", error)
    }
  }
}

export const otpStorage = new OTPStorage()

// Clean up expired OTPs every 5 minutes
if (typeof window === "undefined") {
  setInterval(
    () => {
      otpStorage.cleanup()
    },
    5 * 60 * 1000,
  )
}
