"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Clock, MapPin, Phone, User, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface OngoingBooking {
  id: string
  petName: string
  petType: string
  service: string
  sitterName: string
  sitterPhone: string
  date: string
  time: string
  duration: number
  location: string
  status: string
  amount: number
  startedAt: string
  notes?: string
}

export function OwnerEndService() {
  const { user } = useAuth()
  const [ongoingBookings, setOngoingBookings] = useState<OngoingBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [endingService, setEndingService] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<OngoingBooking | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (user?.id) {
      fetchOngoingBookings()
    }
  }, [user])

  const fetchOngoingBookings = async () => {
    try {
      const response = await fetch(`/api/bookings/ongoing?ownerId=${user?.id}`)
      const data = await response.json()

      if (data.success) {
        setOngoingBookings(data.bookings)
      } else {
        setError(data.message || "Failed to fetch ongoing bookings")
      }
    } catch (error) {
      console.error("Error fetching ongoing bookings:", error)
      setError("Failed to fetch ongoing bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleEndService = (booking: OngoingBooking) => {
    setSelectedBooking(booking)
    setShowConfirmDialog(true)
  }

  const confirmEndService = async () => {
    if (!selectedBooking || !user?.id) return

    setEndingService(selectedBooking.id)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/bookings/end-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          ownerId: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Service for ${selectedBooking.petName} has been completed successfully!`)
        // Remove the booking from ongoing list
        setOngoingBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id))
        setShowConfirmDialog(false)
        setSelectedBooking(null)
      } else {
        setError(data.message || "Failed to end service")
      }
    } catch (error) {
      console.error("Error ending service:", error)
      setError("Failed to end service. Please try again.")
    } finally {
      setEndingService(null)
    }
  }

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Ongoing Services</span>
            <Badge variant="outline">{ongoingBookings.length}</Badge>
          </CardTitle>
          <CardDescription>
            Services currently in progress. You can end them when the Zubo Walkers has finished.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {ongoingBookings.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No ongoing services</h3>
              <p className="text-gray-500">You don't have any services currently in progress.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ongoingBookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg?height=40&width=40" alt={booking.petName} />
                            <AvatarFallback>{booking.petName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{booking.petName}</h3>
                            <p className="text-sm text-gray-600">
                              {booking.petType} • {booking.service}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            In Progress • {getServiceDuration(booking.startedAt)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{booking.sitterName}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{booking.sitterPhone}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{booking.location}</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{booking.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <p className="text-lg font-bold">${booking.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Started at {booking.time}</p>
                        </div>
                        <Button
                          onClick={() => handleEndService(booking)}
                          disabled={endingService === booking.id}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {endingService === booking.id ? "Ending..." : "End Service"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Service Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to end the service for {selectedBooking?.petName}?
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt={selectedBooking.petName} />
                    <AvatarFallback>{selectedBooking.petName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedBooking.petName}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.service}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Zubo Walkers: {selectedBooking.sitterName}</p>
                  <p>Duration: {getServiceDuration(selectedBooking.startedAt)}</p>
                  <p>Amount: ${selectedBooking.amount.toFixed(2)}</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action will mark the service as completed and cannot be undone.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={endingService === selectedBooking.id}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmEndService}
                  disabled={endingService === selectedBooking.id}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {endingService === selectedBooking.id ? "Ending..." : "End Service"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
