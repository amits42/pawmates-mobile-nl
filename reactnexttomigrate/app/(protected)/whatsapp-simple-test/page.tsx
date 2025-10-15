"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function WhatsAppSimpleTestPage() {
  const [formData, setFormData] = useState({
    bookingId: "booking_" + Date.now().toString().slice(-6),
    userPhone: "+918892743780", // Default user phone
    sitterPhone: "+919876543210", // Default sitter phone
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
      console.log("Sending request to setup chat:", formData)

      const response = await fetch("/api/whatsapp/setup-simple-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("Response:", data)

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Failed to setup chat")
      }
    } catch (err) {
      console.error("Error setting up chat:", err)
      setError(`Error: ${err.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600">🐾</span> WhatsApp Chat Test
          </CardTitle>
          <CardDescription>Test the WhatsApp chat system using your existing Twilio setup</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
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

          <Button onClick={handleSetupChat} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...
              </>
            ) : (
              "🚀 Setup WhatsApp Chat"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                WhatsApp chat setup successful!
                <br />
                Chat Room ID: {result.chatRoomId}
                <br />
                Messages have been sent to all participants.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">📱 How to Test:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
              <li>Enter the phone numbers you want to test with</li>
              <li>Click "Setup WhatsApp Chat" button</li>
              <li>Check WhatsApp on those phone numbers</li>
              <li>
                You should receive messages from{" "}
                {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "your Twilio WhatsApp number"}
              </li>
              <li>
                <strong>Reply to the message</strong> - this will test the webhook functionality
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <h3 className="font-semibold text-amber-800 mb-2">⚠️ Important:</h3>
            <p className="text-sm text-amber-700">
              Make sure your Twilio webhook is configured to point to:
              <br />
              <code className="bg-white px-2 py-1 rounded text-amber-800">
                {process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.com"}/api/twilio/webhook
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
