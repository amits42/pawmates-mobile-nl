"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WhatsAppTestPage() {
  const [formData, setFormData] = useState({
    bookingId: "booking_" + Date.now(),
    userPhone: "+918892743780",
    sitterPhone: "+919876543210",
    userAlias: "John (Pet Owner)",
    sitterAlias: "Sarah (Pet Sitter)",
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSetupChat = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      console.log("🚀 Sending request:", formData)

      const response = await fetch("/api/whatsapp/setup-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log("📥 Response data:", data)

      if (response.ok) {
        setResult(data)
      } else {
        setError(`${data.error || "Failed to setup chat"} (Status: ${response.status})`)
      }
    } catch (err) {
      console.error("❌ Network error details:", err)
      setError(`Network error: ${err.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const testAPI = async () => {
    try {
      const response = await fetch("/api/whatsapp/setup-chat", {
        method: "GET",
      })
      console.log("API Test Response:", response.status)
      alert(
        `API Test: ${response.status === 405 ? "Endpoint reachable (Method not allowed is expected)" : response.status}`,
      )
    } catch (err) {
      console.error("API Test Error:", err)
      alert(`API Test Failed: ${err.message}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🐾 WhatsApp Chat Setup Test</CardTitle>
          <CardDescription>Test the Twilio WhatsApp anonymous chat system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bookingId">Booking ID</Label>
              <Input
                id="bookingId"
                value={formData.bookingId}
                onChange={(e) => setFormData((prev) => ({ ...prev, bookingId: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="userPhone">User Phone</Label>
              <Input
                id="userPhone"
                value={formData.userPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, userPhone: e.target.value }))}
                placeholder="+918892743780"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sitterPhone">Zubo Walkers Phone</Label>
              <Input
                id="sitterPhone"
                value={formData.sitterPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, sitterPhone: e.target.value }))}
                placeholder="+919876543210"
              />
            </div>
            <div>
              <Label htmlFor="userAlias">User Alias</Label>
              <Input
                id="userAlias"
                value={formData.userAlias}
                onChange={(e) => setFormData((prev) => ({ ...prev, userAlias: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sitterAlias">Zubo Walkers Alias</Label>
            <Input
              id="sitterAlias"
              value={formData.sitterAlias}
              onChange={(e) => setFormData((prev) => ({ ...prev, sitterAlias: e.target.value }))}
            />
          </div>

          <Button onClick={testAPI} variant="outline" className="w-full mb-2">
            🔍 Test API Endpoint
          </Button>

          <Button onClick={handleSetupChat} disabled={loading} className="w-full">
            {loading ? "Setting up..." : "🚀 Setup WhatsApp Chat"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                ✅ Chat setup successful!
                <br />
                Chat Room ID: {result.chatRoomId}
                <br />
                Messages sent: {result.messagesSent}/{result.totalParticipants}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">📱 How to Test:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Setup WhatsApp Chat" above</li>
              <li>Check WhatsApp on the phone numbers you entered</li>
              <li>
                You should receive setup messages from {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "Twilio number"}
              </li>
              <li>Reply to any message - it will be forwarded to other participants</li>
              <li>Admin sees real phone numbers, others see aliases only</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
