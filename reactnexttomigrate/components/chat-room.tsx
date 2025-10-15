"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { db, getUserDisplayName } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, MapPin, Phone, Clock, Camera } from "lucide-react"
import { toast } from "sonner"
import LocationPicker from "./location-picker"
import ImagePicker from "./image-picker"

interface Message {
  id: string
  text: string
  senderId: string
  senderType: "pet_owner" | "Zubo Walkers" | "admin"
  senderName: string
  timestamp: any
  type: "text" | "location" | "system" | "image"
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  imageUrl?: string
  imageName?: string
}

interface ChatRoomProps {
  bookingId: string
  currentUser: {
    id: string
    name: string
    type: "pet_owner" | "Zubo Walkers" | "admin"
  }
  onClose?: () => void
}

function ChatRoom({ bookingId, currentUser, onClose }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRoomId = `booking_${bookingId}`
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize chat room and listen to messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Create/get chat room
        const response = await fetch("/api/chat/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            userId: currentUser.id,
            userType: currentUser.type,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to initialize chat")
        }

        // Listen to messages in real-time
        const messagesRef = collection(db, "chats", chatRoomId, "messages")
        const q = query(messagesRef, orderBy("timestamp", "asc"), limit(100))

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messageList: Message[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            messageList.push({
              id: doc.id,
              ...data,
              timestamp: data.timestamp,
            } as Message)
          })
          setMessages(messageList)
          setLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.error("Error initializing chat:", error)
        toast.error("Failed to load chat")
        setLoading(false)
      }
    }

    const unsubscribe = initializeChat()
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [bookingId, currentUser, chatRoomId])

  // Send text message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const messagesRef = collection(db, "chats", chatRoomId, "messages")
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: currentUser.id,
        senderType: currentUser.type,
        senderName: getUserDisplayName(currentUser.type, currentUser.name),
        timestamp: serverTimestamp(),
        type: "text",
      })

      // Update or create chat room document safely
      try {
        const chatRoomRef = doc(db, "chats", chatRoomId)
        await setDoc(
          chatRoomRef,
          {
            lastActivity: serverTimestamp(),
            lastMessage: newMessage.trim(),
            lastMessageBy: currentUser.id,
          },
          { merge: true },
        ) // merge: true creates document if it doesn't exist
      } catch (updateError) {
        console.log("Could not update chat room metadata:", updateError)
        // Continue anyway - message was sent successfully
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  // Share current location
  const shareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser")
      return
    }

    setSending(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Get address from coordinates (optional)
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=demo&limit=1`,
            )
            const data = await response.json()
            if (data.results && data.results[0]) {
              address = data.results[0].formatted
            }
          } catch (e) {
            console.log("Could not get address")
          }

          const messagesRef = collection(db, "chats", chatRoomId, "messages")
          await addDoc(messagesRef, {
            text: `📍 Shared location: ${address}`,
            senderId: currentUser.id,
            senderType: currentUser.type,
            senderName: getUserDisplayName(currentUser.type, currentUser.name),
            timestamp: serverTimestamp(),
            type: "location",
            location: {
              latitude,
              longitude,
              address,
            },
          })

          // In the shareLocation function, after adding the location message, replace the update logic:
          try {
            const chatRoomRef = doc(db, "chats", chatRoomId)
            await setDoc(
              chatRoomRef,
              {
                lastActivity: serverTimestamp(),
                lastMessage: `📍 Shared location: ${address}`,
                lastMessageBy: currentUser.id,
              },
              { merge: true },
            ) // merge: true creates document if it doesn't exist
          } catch (updateError) {
            console.log("Could not update chat room metadata:", updateError)
            // Continue anyway - location was shared successfully
          }

          toast.success("Location shared successfully")
        } catch (error) {
          console.error("Error sharing location:", error)
          toast.error("Failed to share location")
        } finally {
          setSending(false)
        }
      },
      (error) => {
        console.error("Error getting location:", error)
        toast.error("Could not get your location")
        setSending(false)
      },
    )
  }

  const handleLocationSelect = async (location: {
    latitude: number
    longitude: number
    address: string
  }) => {
    setSending(true)
    try {
      const messagesRef = collection(db, "chats", chatRoomId, "messages")
      await addDoc(messagesRef, {
        text: `📍 Shared location: ${location.address}`,
        senderId: currentUser.id,
        senderType: currentUser.type,
        senderName: getUserDisplayName(currentUser.type, currentUser.name),
        timestamp: serverTimestamp(),
        type: "location",
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        },
      })

      toast.success("Location shared successfully")
    } catch (error) {
      console.error("Error sharing location:", error)
      toast.error("Failed to share location")
    } finally {
      setSending(false)
    }
  }

  const handleImageSelect = async (imageData: {
    file: File
    preview: string
    name: string
  }) => {
    setSending(true)
    try {
      // Upload image to Vercel Blob
      const formData = new FormData()
      formData.append("image", imageData.file)
      formData.append("chatId", chatRoomId)

      const uploadResponse = await fetch("/api/chat/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image")
      }

      const uploadResult = await uploadResponse.json()

      // Send image message
      const messagesRef = collection(db, "chats", chatRoomId, "messages")
      await addDoc(messagesRef, {
        text: `📷 Shared an image: ${imageData.name}`,
        senderId: currentUser.id,
        senderType: currentUser.type,
        senderName: getUserDisplayName(currentUser.type, currentUser.name),
        timestamp: serverTimestamp(),
        type: "image",
        imageUrl: uploadResult.url,
        imageName: imageData.name,
      })

      toast.success("Image shared successfully")
    } catch (error) {
      console.error("Error sharing image:", error)
      toast.error("Failed to share image")
    } finally {
      setSending(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get message bubble color based on sender
  const getMessageBubbleColor = (senderType: string) => {
    switch (senderType) {
      case "pet_owner":
        return "bg-blue-500 text-white"
      case "Zubo Walkers":
        return "bg-green-500 text-white"
      case "admin":
        return "bg-purple-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading chat...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Chat - Booking #{bookingId.slice(-8)}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">Pet Owner</Badge>
          <Badge variant="outline">Zubo Walkers</Badge>
          <Badge variant="outline">Support</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === currentUser.id
                        ? "bg-blue-500 text-white"
                        : getMessageBubbleColor(message.senderType)
                    }`}
                  >
                    {message.senderId !== currentUser.id && (
                      <div className="text-xs opacity-75 mb-1">{message.senderName}</div>
                    )}

                    {message.type === "image" ? (
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <Camera className="h-4 w-4" />
                          <span className="text-sm">Image shared</span>
                        </div>
                        <img
                          src={message.imageUrl || "/placeholder.svg"}
                          alt={message.imageName || "Shared image"}
                          className="max-w-full h-auto rounded-lg cursor-pointer"
                          onClick={() => window.open(message.imageUrl, "_blank")}
                        />
                        <p className="text-xs mt-1 opacity-75">{message.imageName}</p>
                      </div>
                    ) : message.type === "location" ? (
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Location shared</span>
                        </div>
                        <div className="text-sm">{message.location?.address}</div>
                        {message.location && (
                          <a
                            href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline opacity-75 hover:opacity-100"
                          >
                            View on Google Maps
                          </a>
                        )}
                      </div>
                    ) : (
                      <div>{message.text}</div>
                    )}

                    <div className="text-xs opacity-75 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button onClick={() => setShowLocationPicker(true)} disabled={sending} variant="outline" size="icon">
              <MapPin className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowImagePicker(true)} disabled={sending} variant="outline" size="icon">
              <Camera className="h-4 w-4" />
            </Button>
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
      />

      <ImagePicker
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelect={handleImageSelect}
      />
    </Card>
  )
}

export default ChatRoom
export { ChatRoom }

export const ChatRoomComponent = ChatRoom
