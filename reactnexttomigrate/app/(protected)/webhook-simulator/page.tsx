"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WebhookSimulator() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sender, setSender] = useState("user")

  const participants = {
    user: { phone: "+918892743780", alias: "Pet Owner John" },
    sitter: { phone: "+919876543210", alias: "Pet Sitter Sarah" },
    admin: { phone: "+917003493718", alias: "Admin Support" },
  }

  const simulateMessage = async () => {
    if (!newMessage.trim()) return

    const senderInfo = participants[sender as keyof typeof participants]
    const timestamp = new Date().toLocaleTimeString()

    // Simulate webhook processing
    const incomingMessage = {
      id: Date.now(),
      from: senderInfo.phone,
      body: newMessage,
      timestamp,
      sender: sender,
    }

    // Simulate forwarding to other participants
    const forwardedMessages = Object.entries(participants)
      .filter(([key]) => key !== sender)
      .map(([key, participant]) => ({
        id: Date.now() + Math.random(),
        to: participant.phone,
        body: `*${senderInfo.alias}:*\n${newMessage}`,
        timestamp,
        recipient: key,
        forwarded: true,
      }))

    setMessages((prev) => [...prev, incomingMessage, ...forwardedMessages])
    setNewMessage("")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔄 WhatsApp Webhook Simulator</CardTitle>
          <CardDescription>
            Simulate how the 3-way WhatsApp chat forwarding would work (for testing in v0)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              ⚠️ This is a simulation only. Real webhook testing requires deployment to Vercel or using ngrok.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Send Message As:</Label>
              <select value={sender} onChange={(e) => setSender(e.target.value)} className="w-full p-2 border rounded">
                <option value="user">Pet Owner John</option>
                <option value="sitter">Pet Zubo Walkers Sarah</option>
                <option value="admin">Admin Support</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>Message:</Label>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === "Enter" && simulateMessage()}
                />
                <Button onClick={simulateMessage}>Send</Button>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-semibold">Message Flow:</h3>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.forwarded ? "bg-blue-50 border-l-4 border-blue-400" : "bg-green-50 border-l-4 border-green-400"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {msg.forwarded ? `📤 Forwarded to: ${msg.to}` : `📥 Received from: ${msg.from}`}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{msg.body}</div>
                  </div>
                  <div className="text-xs text-gray-500">{msg.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">🚀 For Real Testing:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Deploy your app to Vercel</li>
              <li>Get your public URL: https://your-app.vercel.app</li>
              <li>Configure Twilio webhook: https://your-app.vercel.app/api/twilio/webhook</li>
              <li>Test real 3-way WhatsApp chat!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
