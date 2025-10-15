"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Calendar, Clock, User } from "lucide-react"
import ChatRoomComponent from "./chat-room"

interface ChatRoom {
  id: string
  booking_id: string
  firebase_room_id: string
  owner_name: string
  sitter_name: string
  service_name: string
  date: string
  time: string
}

interface ChatListProps {
  currentUser: {
    id: string
    name: string
    type: "pet_owner" | "Zubo Walkers" | "admin"
  }
}

export default function ChatList({ currentUser }: ChatListProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await fetch(`/api/chat/rooms?userId=${currentUser.id}&userType=${currentUser.type}`)

        if (!response.ok) {
          throw new Error("Failed to fetch chat rooms")
        }

        const data = await response.json()
        setChatRooms(data.chatRooms || [])
      } catch (error) {
        console.error("Error fetching chat rooms:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChatRooms()
  }, [currentUser])

  if (selectedChat) {
    return (
      <ChatRoomComponent bookingId={selectedChat} currentUser={currentUser} onClose={() => setSelectedChat(null)} />
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading chats...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Your Chats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chatRooms.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">No active chats</p>
            <p className="text-sm text-gray-400">Chats will appear here when you have bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedChat(room.booking_id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{room.service_name}</Badge>
                    <span className="text-sm text-gray-500">#{room.booking_id.slice(-8)}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Open Chat
                  </Button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>Owner: {room.owner_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>Sitter: {room.sitter_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(room.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {room.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
