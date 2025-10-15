"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  Info,
  AlertCircle,
  Loader2,
  IndianRupee,
  Shield,
  CheckCircle,
  XCircle,
  Mail,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"

interface CancellationRule {
  id: string
  minHours: number | null
  maxHours: number | null
  refundPercent: number
  notes?: string
  description?: string
}

interface CancellationPolicy {
  id: string
  name: string
  description?: string
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  rules: CancellationRule[]
}


export default function CancellationPolicyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [policy, setPolicy] = useState<CancellationPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get optional context from URL params
  const bookingId = searchParams.get("bookingId")
  const recurringBookingId = searchParams.get("recurringBookingId")

  useEffect(() => {
    fetchCancellationPolicy()
  }, [])

  const fetchCancellationPolicy = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/cancellation-policy")

      if (!response.ok) {
        throw new Error("Failed to fetch cancellation policy")
      }

      const data = await response.json()
      setPolicy(data.policy)
    } catch (error) {
      console.error("Error fetching cancellation policy:", error)
      setError("Failed to load cancellation policy. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRange = (rule: CancellationRule) => {
    if (rule.minHours === null && rule.maxHours === null) {
      return "Any time"
    }

    if (rule.minHours === null) {
      return `Less than ${rule.maxHours} hours before service`
    }

    if (rule.maxHours === null) {
      return `More than ${rule.minHours} hours before service`
    }

    if (rule.minHours === rule.maxHours) {
      return `Exactly ${rule.minHours} hours before service`
    }

    return `Between ${rule.minHours} and ${rule.maxHours} hours before service`
  }

  const getRefundIcon = (refundPercent: number) => {
    if (refundPercent === 100) return <CheckCircle className="h-5 w-5 text-zubo-accent-600" />
    if (refundPercent === 0) return <XCircle className="h-5 w-5 text-destructive" />
    return <RefreshCw className="h-5 w-5 text-zubo-highlight-2-600" />
  }

  const getRefundColor = (refundPercent: number) => {
    if (refundPercent === 100) return "from-zubo-accent-50 to-zubo-accent-100 border-zubo-accent-200"
    if (refundPercent === 0) return "from-destructive/10 to-destructive/20 border-destructive/30"
    return "from-zubo-highlight-2-50 to-zubo-highlight-2-100 border-zubo-highlight-2-200"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4 pb-20">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary-600" />
              <h3 className="text-lg font-semibold text-zubo-text-800 mb-2">Loading cancellation policy</h3>
              <p className="text-sm text-zubo-text-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4 pb-20">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-zubo-text-600 hover:text-zubo-text-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <Alert className="border-destructive bg-destructive/10 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error || "Cancellation policy not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zubo-background-300">
      <div className="container mx-auto p-4 pb-20 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zubo-text-600 hover:text-zubo-text-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-zubo-text-900 mb-2">Cancellation and Refund Policy</h1>
            <p className="text-zubo-text-600">Understand our cancellation terms and refund process</p>
          </div>
        </div>

        {/* Policy Overview */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-zubo-primary-50 to-zubo-highlight-1-50 border-b border-zubo-primary-200">
            <CardTitle className="flex items-center gap-3 text-zubo-text-900">
              <div className="w-10 h-10 rounded-lg bg-zubo-background-50 flex items-center justify-center">
                <Shield className="h-6 w-6 text-zubo-primary-600" />
              </div>
              <div>
                <span className="font-semibold">{policy.name}</span>
                <div className="text-sm text-zubo-text-600 font-normal">
                  Effective from {format(new Date(policy.effectiveFrom), "PPP")}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          {policy.description && (
            <CardContent className="p-6">
              <p className="text-zubo-text-700 leading-relaxed">{policy.description}</p>
            </CardContent>
          )}
        </Card>

        {/* Cancellation Rules */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-zubo-text-900 mb-4">Refund Schedule</h2>

          {policy.rules.map((rule, index) => (
            <Card key={rule.id} className={`overflow-hidden bg-gradient-to-r ${getRefundColor(rule.refundPercent)}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{getRefundIcon(rule.refundPercent)}</div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg text-zubo-text-900">{formatTimeRange(rule)}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-zubo-text-900">{rule.refundPercent}%</div>
                        <div className="text-sm text-zubo-text-600">
                          {rule.refundPercent === 100
                            ? "Full refund"
                            : rule.refundPercent === 0
                              ? "No refund"
                              : `Partial refund`}
                        </div>
                      </div>
                    </div>

                    {rule.description && <p className="text-zubo-text-700 mb-2">{rule.description}</p>}

                    {rule.notes && <p className="text-sm text-zubo-text-600 italic">{rule.notes}</p>}

                    {rule.refundPercent < 100 && rule.refundPercent > 0 && (
                      <div className="mt-3 text-sm text-zubo-text-600">
                        <span className="font-medium">Cancellation fee:</span> {100 - rule.refundPercent}%
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Quality Guarantee */}
          <Card className="border-zubo-accent-200 bg-gradient-to-r from-zubo-accent-50 to-zubo-accent-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zubo-accent-800">
                <CheckCircle className="h-5 w-5" />
                Quality Guarantee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zubo-accent-700 text-sm leading-relaxed">
                If you are unsatisfied with the quality of service you received, you may be eligible for a full refund.
              </p>
              <div className="mt-3 p-3 bg-zubo-accent-50 rounded-lg border border-zubo-accent-200">
                <p className="text-xs text-zubo-accent-700">
                  <strong>Important:</strong> Contact our customer service team within 24 hours of the service with
                  details (description, photos, videos) to be eligible for a quality-based refund.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Processing Time */}
          <Card className="border-zubo-primary-200 bg-gradient-to-r from-zubo-primary-50 to-zubo-primary-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zubo-primary-800">
                <Clock className="h-5 w-5" />
                Refund Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zubo-primary-700 text-sm leading-relaxed mb-3">
                Approved refunds are processed back to your original payment method.
              </p>
              <div className="space-y-2 text-xs text-zubo-primary-700">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3" />
                  <span>UPI/Wallet: 1-2 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3" />
                  <span>Credit/Debit Card: 5-7 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3" />
                  <span>Net Banking: 3-5 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <Card className="border-zubo-highlight-1-200 bg-gradient-to-r from-zubo-highlight-1-50 to-zubo-highlight-1-100">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-zubo-highlight-1-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-zubo-highlight-1-600" />
            </div>
            <h3 className="font-semibold text-zubo-highlight-1-900 mb-2">Questions About Cancellations?</h3>
            <p className="text-zubo-highlight-1-700 text-sm mb-4">
              If you have any questions about these charges or need assistance with cancellations, feel free to contact
              our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/support${bookingId ? `?bookingId=${bookingId}` : recurringBookingId ? `?recurringBookingId=${recurringBookingId}` : ""}`,
                  )
                }
                className="border-zubo-highlight-1-300 text-zubo-highlight-1-600 hover:bg-zubo-highlight-1-100 bg-transparent"
              >
                Contact Support
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("mailto:care@zubopets.com", "_blank")}
                className="border-zubo-highlight-1-300 text-zubo-highlight-1-600 hover:bg-zubo-highlight-1-100 bg-transparent"
              >
                <Mail className="mr-2 h-4 w-4" />
                care@zubopets.com
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Alert className="mt-6 border-zubo-primary-200 bg-zubo-primary-50">
          <Info className="h-4 w-4 text-zubo-primary-600" />
          <AlertDescription className="text-zubo-primary-800">
            <strong>Please note:</strong> This policy applies to all bookings made after{" "}
            {format(new Date(policy.effectiveFrom), "PPP")}. Cancellation fees are calculated based on the time
            remaining until your scheduled service when you request cancellation.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
