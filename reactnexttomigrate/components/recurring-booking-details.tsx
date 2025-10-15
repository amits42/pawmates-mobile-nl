"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, CreditCard, CheckCircle, AlertCircle, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Booking } from "@/types/api"

interface RecurringSession {
  id: string
  sequenceNumber: number
  sessionDate: string
  sessionTime: string
  sessionPrice: number
  status: string
  paymentStatus: string
  duration: number
  notes?: string
  startOtp?: string
  endOtp?: string
}

interface RecurringBookingDetailsProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  router: any
  user: any
}

const formatDate = (dateString: string) => {
  if (!dateString) return "Not scheduled"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

const getStatusBadge = (status: string, paymentStatus?: string) => {
  const statusConfig = {
    pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏳" },
    confirmed: { color: "bg-green-50 text-green-700 border-green-200", icon: "✅" },
    completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✅" },
    cancelled: { color: "bg-red-50 text-red-700 border-red-200", icon: "❌" },
  }

  const normalizedStatus = status?.toLowerCase() || "pending"
  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending

  return (
    <Badge className={`${config.color} font-medium px-2 py-0.5 text-xs`}>
      <span className="mr-1">{config.icon}</span>
      {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
    </Badge>
  )
}

const getPaymentStatusBadge = (paymentStatus: string) => {
  const config = {
    PAID: { color: "bg-green-50 text-green-700 border-green-200", icon: "💳" },
    PENDING: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏳" },
    FAILED: { color: "bg-red-50 text-red-700 border-red-200", icon: "❌" },
  }

  const normalizedStatus = paymentStatus?.toUpperCase() || "PENDING"
  const statusConfig = config[normalizedStatus as keyof typeof config] || config.PENDING

  return (
    <Badge className={`${statusConfig.color} font-medium px-2 py-0.5 text-xs`}>
      <span className="mr-1">{statusConfig.icon}</span>
      {paymentStatus === "PENDING" ? "Unpaid" : paymentStatus}
    </Badge>
  )
}

export function RecurringBookingDetails({ booking, open, onOpenChange, router, user }: RecurringBookingDetailsProps) {
  const [sessions, setSessions] = useState<RecurringSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open && booking?.id) {
      fetchRecurringSessions()
    }
  }, [open, booking?.id])

  const fetchRecurringSessions = async () => {
    if (!booking?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/bookings/recurring/${booking.id}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      })

      if (!response.ok) throw new Error("Failed to fetch recurring sessions")

      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error("Error fetching recurring sessions:", error)
      setError("Failed to load sessions. Please try again.")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const handlePayForSession = (session: RecurringSession) => {
    const paymentUrl =
      `/book-service/payment?` +
      `recurringBookingId=${session.id}&` +
      `bookingId=${booking?.id}&` +
      `amount=${session.sessionPrice}&` +
      `serviceName=${encodeURIComponent(booking?.serviceName || "")}&` +
      `sessionDate=${session.sessionDate}&` +
      `sessionTime=${session.sessionTime}&` +
      `sequenceNumber=${session.sequenceNumber}&` +
      `payRecurring=true`

    router.push(paymentUrl)
    onOpenChange(false)
  }

  if (!booking) return null

  const totalSessions = sessions.length
  const paidSessions = sessions.filter((s) => s.paymentStatus === "PAID").length
  const totalAmount = sessions.reduce((sum, s) => sum + s.sessionPrice, 0)
  const paidAmount = sessions.filter((s) => s.paymentStatus === "PAID").reduce((sum, s) => sum + s.sessionPrice, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <DialogTitle className="text-lg font-semibold">Recurring Booking Sessions</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">{booking.serviceName}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Sessions</p>
                <p className="font-semibold">{totalSessions}</p>
              </div>
              <div>
                <p className="text-gray-600">Paid Sessions</p>
                <p className="font-semibold text-green-600">
                  {paidSessions}/{totalSessions}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-semibold">${totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Amount Paid</p>
                <p className="font-semibold text-green-600">${paidAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">Loading sessions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <Button size="sm" onClick={fetchRecurringSessions}>
                  Retry
                </Button>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">No sessions found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {sessions.map((session) => (
                <Card key={session.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Session {session.sequenceNumber}</span>
                        {getStatusBadge(session.status)}
                        {getPaymentStatusBadge(session.paymentStatus)}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">${session.sessionPrice.toFixed(2)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        <span>{formatDate(session.sessionDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-green-600" />
                        <span>{session.sessionTime}</span>
                      </div>
                    </div>

                    {session.notes && <p className="text-xs text-gray-600 mb-3">{session.notes}</p>}

                    {(session.startOtp || session.endOtp) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <h4 className="text-xs font-semibold text-green-800 mb-2">Service Codes</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {session.startOtp && (
                            <div className="bg-white p-2 rounded border">
                              <div className="text-green-600 font-medium">Pick-up Code</div>
                              <div className="font-mono font-bold text-green-800">{session.startOtp}</div>
                            </div>
                          )}
                          {session.endOtp && (
                            <div className="bg-white p-2 rounded border">
                              <div className="text-green-600 font-medium">Drop-off Code</div>
                              <div className="font-mono font-bold text-green-800">{session.endOtp}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {session.paymentStatus === "PENDING" && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => handlePayForSession(session)}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-xs"
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay ${session.sessionPrice.toFixed(2)}
                        </Button>
                      </div>
                    )}

                    {session.paymentStatus === "PAID" && (
                      <div className="flex justify-end">
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle className="h-3 w-3" />
                          <span>Paid</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
