"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  MapPin,
  Phone,
  User,
  X,
  ChevronUp,
  Play,
  Square,
  Copy,
  Shield,
  Wifi,
  WifiOff,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getAblyClient, getAblyChannel, EVENTS, type ServiceUpdateEvent } from "@/lib/ably"
import type { RealtimeChannel } from "ably"

interface OngoingBooking {
  id: string
  petName: string
  paymentstatus: string
  petType: string
  serviceName: string
  sitterName: string
  sitterPhone: string
  date: string
  petImage: string
  time: string
  duration: number
  location: string
  status: string
  amount: number
  startedAt: string
  endedAt: string;
  notes?: string
  startOtp?: string
  endOtp?: string
}

export function OngoingBookingNotification() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [ongoingBooking, setOngoingBooking] = useState<OngoingBooking | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Fetch initial ongoing booking
  const fetchOngoingBooking = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/bookings/ongoing?ownerId=${user.id}`)
      const data = await response.json()

      if (data.success && data.bookings && data.bookings.length > 0) {
        const latestBooking = data.bookings[0]
        setOngoingBooking(latestBooking)
        setIsVisible(true)
        console.log("📋 Initial ongoing booking loaded:", latestBooking.id)
      } else {
        setOngoingBooking(null)
        setIsVisible(false)
        setIsExpanded(false)
        console.log("📋 No ongoing bookings found")
      }
    } catch (error) {
      console.error("❌ Error fetching ongoing booking:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Handle real-time service updates
  const handleServiceUpdate = useCallback(
    (message: any) => {
      const data: ServiceUpdateEvent = message.data

      if (data.userId !== user?.id) {
        console.warn("⚠️ Received update for different user, ignoring:", data.userId, "vs", user?.id)
        return
      }

      console.log("🔔 Received verified service update for user:", user.id, data)

      if (data.status === "ONGOING") {
        toast({
          title: "Service Started! 🎉",
          description: `${data.sitterName} has started caring for ${data.petName}`,
        })
        fetchOngoingBooking()
      } else if (data.status === "COMPLETED") {
        toast({
          title: "Service Completed! ✅",
          description: `${data.sitterName} has completed the service for ${data.petName}`,
        })
        setOngoingBooking(null)
        setIsVisible(false)
        setIsExpanded(false)
      }
    },
    [fetchOngoingBooking, toast, user?.id],
  )

  // Setup Ably connection
  useEffect(() => {
    if (!user?.id) return

    let ablyChannel: RealtimeChannel | null = null
    const client = getAblyClient()

    const setupAbly = async () => {
      try {
        console.log("🔌 Setting up Ably for user:", user.id)

        const userChannelName = `booking-updates:${user.id}`
        ablyChannel = client.channels.get(userChannelName)
        setChannel(ablyChannel)

        console.log("📡 Subscribing to channel:", userChannelName)

        // ✅ Use client.connection (not channel)
        client.connection.on("connected", () => {
          console.log("✅ Ably connected")
          setIsConnected(true)
        })

        client.connection.on("disconnected", () => {
          console.log("❌ Ably disconnected")
          setIsConnected(false)
        })

        client.connection.on("failed", (error) => {
          console.error("❌ Ably connection failed:", error)
          setIsConnected(false)
        })

        // Subscribe to events
        ablyChannel.subscribe(EVENTS.SERVICE_STARTED, handleServiceUpdate)
        ablyChannel.subscribe(EVENTS.SERVICE_ENDED, handleServiceUpdate)

        console.log("🔔 Subscribed to:", userChannelName)
      } catch (error) {
        console.error("❌ Failed to setup Ably:", error)
        setIsConnected(false)
      }
    }

    setupAbly()

    return () => {
      if (ablyChannel) {
        console.log("🔌 Cleaning up Ably channel for user:", user.id)
        ablyChannel.unsubscribe()
        ablyChannel.detach()
      }
      client.connection.off() // ✅ cleanup client listeners
    }
  }, [user?.id, handleServiceUpdate])

  // Initial data fetch
  useEffect(() => {
    fetchOngoingBooking()
  }, [fetchOngoingBooking])

  const getServiceDuration = (startedAt: string) => {
    const start = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const handleClose = () => {
    setIsExpanded(false)
    setIsVisible(false)
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  if (loading || !isVisible || !ongoingBooking) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Notification */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${isExpanded ? "bottom-0" : "bottom-16 md:bottom-4"
          }`}
      >
        <div className="mx-4 mb-4">
          <Card
            className={`border-l-4 border-l-green-500 shadow-lg transition-all duration-300 ${isExpanded ? "max-h-screen" : "max-h-20"
              } overflow-hidden`}
          >
            {/* Collapsed View */}
            <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleToggle}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={ongoingBooking.petImage} alt={ongoingBooking.petName} />
                    <AvatarFallback>{ongoingBooking.petName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-sm truncate">{ongoingBooking.serviceName}</p>
                      <Badge className="bg-green-100 text-green-800 text-xs">In Progress</Badge>
                      <div className="flex items-center">
                        {isConnected ? (
                          <Wifi className="h-3 w-3 text-green-600" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-orange-600" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {ongoingBooking.petName} • {getServiceDuration(ongoingBooking.startedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <ChevronUp
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                      }`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClose()
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
              <div className="border-t">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={ongoingBooking.petImage} alt={ongoingBooking.petName} />
                        <AvatarFallback>{ongoingBooking.petName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{ongoingBooking.petName}</h3>
                        <p className="text-sm text-gray-600">
                          {ongoingBooking.petType} • {ongoingBooking.serviceName}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-green-100 text-green-800">
                        In Progress • {getServiceDuration(ongoingBooking.startedAt)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs">
                        {isConnected ? (
                          <>
                            <Wifi className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Live</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 text-orange-600" />
                            <span className="text-orange-600">Offline</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{ongoingBooking.sitterName}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{ongoingBooking.sitterPhone}</span>
                    </div>
                    {/* <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="truncate">{ongoingBooking.location}</span>
                    </div> */}
                  </div>

                  {/* Service Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Started at</p>
                        <p className="text-sm font-medium">{
                          (() => {
                            const d = new Date(ongoingBooking.startedAt);
                            const day = d.getDate();
                            const nth = (n: number) => {
                              if (n > 3 && n < 21) return 'th';
                              switch (n % 10) {
                                case 1: return 'st';
                                case 2: return 'nd';
                                case 3: return 'rd';
                                default: return 'th';
                              }
                            };
                            const month = d.toLocaleString('en-US', { month: 'short' });
                            const year = d.getFullYear();
                            let hours = d.getHours();
                            const minutes = d.getMinutes().toString().padStart(2, '0');
                            const ampm = hours >= 12 ? 'pm' : 'am';
                            hours = hours % 12;
                            hours = hours ? hours : 12;
                            return `${day}${nth(day)} ${month} ${year}. ${hours}:${minutes} ${ampm}`;
                          })()
                        }</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-medium">₹{Number(ongoingBooking.amount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* OTPs */}
                  {(ongoingBooking.startOtp || ongoingBooking.endOtp) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        {ongoingBooking.startOtp && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Play className="h-3 w-3 text-green-600" />
                                <span className="font-medium text-green-800 text-xs">START Service</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-green-100"
                                onClick={() => copyToClipboard(ongoingBooking.startOtp!, "START OTP")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-lg font-mono font-bold text-green-900 mb-1">
                              {ongoingBooking.startOtp}
                            </div>
                            <p className="text-xs text-green-700">
                              Share this Code with your Zubo Walker to START the service
                            </p>
                          </div>
                        )}
                        {ongoingBooking.endOtp && (ongoingBooking.paymentstatus === "PAID" || ongoingBooking.paymentstatus === "REFUNDED") && (
                          <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Square className="h-3 w-3 text-red-600" />
                                <span className="font-medium text-red-800 text-xs">END Service</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100"
                                onClick={() => copyToClipboard(ongoingBooking.endOtp!, "END OTP")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-lg font-mono font-bold text-red-900 mb-1">{ongoingBooking.endOtp}</div>
                            <p className="text-xs text-red-700">Share this Code with your Zubo Walker to END the service</p>
                          </div>
                        )}
                        {ongoingBooking.endOtp && (ongoingBooking.paymentstatus !== "PAID" && ongoingBooking.paymentstatus !== "REFUNDED") && (
                          <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Square className="h-3 w-3 text-red-600" />
                              <span className="font-medium text-red-800 text-xs">END Service</span>
                            </div>
                            <div className="text-red-700 font-medium text-xs">
                              Drop-off Code will be shown after payment is completed.
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  {/* {ongoingBooking.notes && (
                    <>
                      <Separator />
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{ongoingBooking.notes}</p>
                      </div>
                    </>
                  )} */}

                  {/* <div className="text-xs text-gray-500 text-center">
                    {isConnected ? (
                      <span className="text-green-600">🟢 Live updates active • Channel: booking-updates:{user?.id}</span>
                    ) : (
                      <span className="text-orange-600">🟡 Reconnecting...</span>
                    )}
                  </div> */}
                </CardContent>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
