"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface ServiceOTPDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  action: "start" | "end"
  onSuccess: () => void
}

export function ServiceOTPDialog({ open, onOpenChange, bookingId, action, onSuccess }: ServiceOTPDialogProps) {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)
    setError("")

    try {
      const endpoint = action === "start" ? "/api/bookings/start-service" : "/api/bookings/end-service"

      console.log(`🔐 Submitting ${action.toUpperCase()} OTP:`, { bookingId, otp })

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId, otp }),
      })

      const data = await response.json()
      console.log(`🔐 ${action.toUpperCase()} OTP response:`, data)

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onOpenChange(false)
          setOtp("")
          setSuccess(false)
        }, 1500)
      } else {
        setError(data.error || data.message || "Invalid OTP")
      }
    } catch (error) {
      console.error(`Error verifying ${action} OTP:`, error)
      setError("Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setOtp("")
    setError("")
    setSuccess(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action === "start" ? "Start Service" : "End Service"}</DialogTitle>
          <DialogDescription>
            {action === "start"
              ? "Enter the START OTP provided by the pet owner to begin the service"
              : "Enter the END OTP provided by the pet owner to complete the service"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-700">
              {action === "start" ? "Service Started!" : "Service Completed!"}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {action === "start"
                ? "The booking status has been updated to ONGOING"
                : "The booking has been marked as COMPLETED"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter {action.toUpperCase()} OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setOtp(value)
                  setError("")
                }}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit {action.toUpperCase()} OTP provided by the pet owner
              </p>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : action === "start" ? (
                  "Start Service"
                ) : (
                  "Complete Service"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
