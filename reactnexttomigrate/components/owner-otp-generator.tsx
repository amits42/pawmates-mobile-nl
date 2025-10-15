"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw, Clock, CheckCircle } from "lucide-react"

interface OwnerOTPGeneratorProps {
  bookingId: string
  action: "start" | "end"
  onOTPGenerated?: (otp: string) => void
}

export function OwnerOTPGenerator({ bookingId, action, onOTPGenerated }: OwnerOTPGeneratorProps) {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const generateOTP = async () => {
    setLoading(true)
    setError("")

    try {
      const endpoint = action === "start" ? "/api/bookings/start-service" : "/api/bookings/end-service"

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      })

      const data = await response.json()

      if (data.success) {
        setOtp(data.otp)
        setExpiresAt(data.expiresAt)
        onOTPGenerated?.(data.otp)
      } else {
        setError(data.message || "Failed to generate OTP")
      }
    } catch (error) {
      console.error("Error generating OTP:", error)
      setError("Failed to generate OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyOTP = async () => {
    try {
      await navigator.clipboard.writeText(otp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy OTP:", error)
    }
  }

  const getTimeRemaining = () => {
    if (!expiresAt) return null
    const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>{action === "start" ? "Start Service OTP" : "End Service OTP"}</span>
          {otp && (
            <Badge variant="outline" className="ml-2">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeRemaining()}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {action === "start"
            ? "Generate a Code for the Zubo Walkers to start the service"
            : "Generate a Code for the Zubo Walkers to complete the service"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!otp ? (
          <Button onClick={generateOTP} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              `Generate ${action === "start" ? "Start" : "End"} OTP`
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Your OTP is:</p>
                <div className="text-3xl font-mono font-bold tracking-widest text-blue-600">{otp}</div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this with the Zubo Walkers to {action === "start" ? "start" : "complete"} the service
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={copyOTP} variant="outline" className="flex-1">
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy OTP
                  </>
                )}
              </Button>
              <Button onClick={generateOTP} variant="outline" disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                New OTP
              </Button>
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This OTP will expire in {getTimeRemaining()} minutes. The Zubo Walkers needs to enter this code to{" "}
                {action === "start" ? "start" : "complete"} the service.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
