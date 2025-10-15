"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XCircle, AlertTriangle, Loader2, Clock, RefreshCw, Info } from "lucide-react"

interface RecurringSession {
  id: string
  sequenceNumber: number
  sessionDate: string
  sessionTime: string
  sessionPrice: number
  status: string
  paymentStatus: string
}

interface CancellationPolicy {
  percentageDeduction: number
  refundAmount: number
  deductionAmount: number
  processingTime: string
  canRefund: boolean
}

interface SessionCancellationDialogProps {
  session: RecurringSession
  onCancel: (session: RecurringSession, reason: string) => Promise<void>
  isLoading: boolean
  cancellationPolicy?: CancellationPolicy
}

const CANCELLATION_REASONS = [
  "Schedule conflict",
  "Pet is unwell",
  "Travel plans changed",
  "Financial constraints",
  "Found alternative care",
  "Emergency situation",
  "Service no longer needed",
  "Other",
]

export function SessionCancellationDialog({
  session,
  onCancel,
  isLoading,
  cancellationPolicy,
}: SessionCancellationDialogProps) {
  const [selectedReason, setSelectedReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [refundInfo, setRefundInfo] = useState<CancellationPolicy | null>(null)
  const [loadingRefund, setLoadingRefund] = useState(false)

  const fetchRefundCalculation = async () => {
    if (session.paymentStatus !== "PAID") return

    setLoadingRefund(true)
    try {
      const response = await fetch("/api/bookings/calculate-refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "user-id-here", // This should come from auth context
        },
        body: JSON.stringify({
          sessionId: session.id,
          amount: session.sessionPrice,
          paymentStatus: session.paymentStatus,
        }),
      })

      if (response.ok) {
        const refundData = await response.json()
        setRefundInfo(refundData)
      }
    } catch (error) {
      console.error("Error fetching refund calculation:", error)
    } finally {
      setLoadingRefund(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchRefundCalculation()
    }
  }

  const handleCancel = async () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason
    if (!reason.trim()) return

    try {
      await onCancel(session, reason.trim())
      setIsOpen(false)
      setSelectedReason("")
      setCustomReason("")
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const formatDate = (dateString: string) => {
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

  const isFormValid = selectedReason && (selectedReason !== "Other" || customReason.trim())

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-6 px-2">
          <XCircle className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Cancel Session {session.sequenceNumber}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Session Details:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatDate(session.sessionDate)} at {session.sessionTime}
                  </Badge>
                </div>
                <div className="text-blue-700">Amount: ₹{session.sessionPrice.toFixed(2)}</div>
              </div>
            </div>

            {session.paymentStatus === "PAID" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  <Info className="h-4 w-4 inline mr-1" />
                  Refund Information:
                </p>
                {loadingRefund ? (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Calculating refund...</span>
                  </div>
                ) : refundInfo ? (
                  (() => {
                    // Defensive: handle nulls and fallback for refund info
                    const displayRefundInfo = {
                      percentageDeduction:
                        refundInfo?.percentageDeduction ?? refundInfo?.deductionPercent ?? refundInfo?.ruleApplied?.percentageDeduction ?? 10,
                      deductionAmount:
                        refundInfo?.deductionAmount != null
                          ? refundInfo.deductionAmount
                          : refundInfo?.canRefund === false
                            ? refundInfo?.originalAmount ?? session.sessionPrice
                            : (session.sessionPrice * 10) / 100,
                      refundAmount:
                        refundInfo?.refundAmount != null
                          ? refundInfo.refundAmount
                          : refundInfo?.canRefund === false
                            ? 0
                            : session.sessionPrice - (session.sessionPrice * 10) / 100,
                      processingTime: refundInfo?.processingTime ?? "5-7 business days",
                      description: refundInfo?.description ?? "",
                      canRefund: refundInfo?.canRefund ?? true,
                    }
                    return (
                      <div className="space-y-1 text-sm text-amber-700">
                        <div className="flex justify-between">
                          <span>Session Amount:</span>
                          <span>
                            ₹{session.sessionPrice != null ? session.sessionPrice.toFixed(2) : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cancellation Fee ({displayRefundInfo.percentageDeduction != null ? displayRefundInfo.percentageDeduction + "%" : "-"}):</span>
                          <span className="text-red-600">
                            {displayRefundInfo.deductionAmount != null
                              ? `-₹${Number(displayRefundInfo.deductionAmount).toFixed(2)}`
                              : displayRefundInfo.canRefund === false
                                ? "No refund"
                                : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium border-t border-amber-200 pt-1">
                          <span>Refund Amount:</span>
                          <span className="text-green-600">
                            {displayRefundInfo.refundAmount != null
                              ? `₹${Number(displayRefundInfo.refundAmount).toFixed(2)}`
                              : displayRefundInfo.canRefund === false
                                ? "No refund"
                                : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                          <Clock className="h-3 w-3" />
                          <span>Processing time: {displayRefundInfo.processingTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <RefreshCw className="h-3 w-3" />
                          <span>Refund via original payment method</span>
                        </div>
                        {displayRefundInfo.description && (
                          <div className="text-xs text-amber-700 mt-2">{displayRefundInfo.description}</div>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-sm text-amber-700">Unable to calculate refund at this time</div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Please select a reason for cancellation: <span className="text-red-500">*</span>
              </Label>

              <div className="grid grid-cols-2 gap-2">
                {CANCELLATION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`text-xs p-2 rounded border text-left transition-colors ${selectedReason === reason
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {selectedReason === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-reason" className="text-sm">
                    Please specify: <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="custom-reason"
                    placeholder="Please provide details about your cancellation reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="text-sm"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {!isFormValid && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-xs">
                  Please select a cancellation reason to proceed.
                </AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Keep Session</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isLoading || !isFormValid}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Session"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
