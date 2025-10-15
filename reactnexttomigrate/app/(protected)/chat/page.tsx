"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ChatList from "@/components/chat-list"
import ChatRoom from "@/components/chat-room"
import { MessageCircle, Users, TestTube } from "lucide-react"

export default function ChatTestPage() {
  const [testMode, setTestMode] = useState<"list" | "room" | null>(null)
  const [currentUser, setCurrentUser] = useState({
    id: "",
    name: "",
    type: "pet_owner" as "pet_owner" | "sitter" | "admin",
  })
  const [testBookingId, setTestBookingId] = useState("")

  const handleStartTest = () => {
    if (!currentUser.id || !currentUser.name) {
      alert("Please fill in user details")
      return
    }
    setTestMode("list")
  }

  const handleTestDirectChat = () => {
    if (!currentUser.id || !currentUser.name || !testBookingId) {
      alert("Please fill in all details")
      return
    }
    setTestMode("room")
  }

  if (testMode === "list") {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Button variant="outline" onClick={() => setTestMode(null)} className="mb-4">
            ← Back to Test Setup
          </Button>
        </div>
        <ChatList currentUser={currentUser} />
      </div>
    )
  }

  if (testMode === "room") {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Button variant="outline" onClick={() => setTestMode(null)} className="mb-4">
            ← Back to Test Setup
          </Button>
        </div>
        <ChatRoom bookingId={testBookingId} currentUser={currentUser} onClose={() => setTestMode(null)} />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Chat System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Test Real-time Chat</h2>
            <p className="text-gray-600">Test the 3-way chat system between pet owners, Zubo Walkers, and admin support.</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={currentUser.id}
                onChange={(e) => setCurrentUser((prev) => ({ ...prev, id: e.target.value }))}
                placeholder="Enter user ID (e.g., user123)"
              />
            </div>

            <div>
              <Label htmlFor="userName">User Name</Label>
              <Input
                id="userName"
                value={currentUser.name}
                onChange={(e) => setCurrentUser((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <Label htmlFor="userType">User Type</Label>
              <Select
                value={currentUser.type}
                onValueChange={(value: "pet_owner" | "sitter" | "admin") =>
                  setCurrentUser((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pet_owner">Pet Owner</SelectItem>
                  <SelectItem value="sitter">Zubo Walkers</SelectItem>
                  <SelectItem value="admin">Admin/Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleStartTest} className="w-full" size="lg">
              <Users className="h-4 w-4 mr-2" />
              View My Chats
            </Button>

            <div className="border-t pt-4">
              <Label htmlFor="bookingId">Or test direct chat with Booking ID:</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="bookingId"
                  value={testBookingId}
                  onChange={(e) => setTestBookingId(e.target.value)}
                  placeholder="Enter booking ID"
                />
                <Button onClick={handleTestDirectChat}>Open Chat</Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">How to Test:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Open multiple browser tabs</li>
              <li>Use different User IDs and Types in each tab</li>
              <li>Start chatting - messages appear in real-time!</li>
              <li>Try sharing your location</li>
              <li>Test with the same booking ID across tabs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
