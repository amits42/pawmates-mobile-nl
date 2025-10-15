"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import Footer from "@/components/footer"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Menu,
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
  MessageCircle,
  Phone,
} from "lucide-react"
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

export default function PublicCancellationPolicyPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-zubo-background">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Image
                  src="/logo/zubo-logo.svg"
                  alt="ZuboPets"
                  width={400}
                  height={400}
                  className="h-32 w-auto"
                  priority
                />
              </Link>
            </div>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Home
              </Link>
              <Link
                href="/#why-choose-us"
                className="text-zubo-text hover:text-zubo-primary transition-colors font-medium"
              >
                Why Choose Us
              </Link>
              <Link href="/#services" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Services
              </Link>
              <Link
                href="/#how-it-works"
                className="text-zubo-text hover:text-zubo-primary transition-colors font-medium"
              >
                How it Works
              </Link>
              <Link href="/#about" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                About Us
              </Link>
              <Link href="/faq" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                FAQ
              </Link>
              <Link href="/#contact" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Contact
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white bg-transparent"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/book-service">
                <Button className="bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white">
                  Book a Walk
                </Button>
              </Link>
            </div>
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-zubo-primary"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-8 w-8 text-zubo-primary" />
            </button>
          </div>
        </div>
        {/* Mobile sliding panel */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            <div
              className="absolute inset-0 h-screen bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] h-full min-h-screen bg-white shadow-lg p-6 flex flex-col gap-6 animate-slide-in-right overflow-y-auto">
              <button
                className="absolute top-4 right-4 p-2 rounded focus:outline-none focus:ring-2 focus:ring-zubo-primary"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <span className="text-2xl">&times;</span>
              </button>
              <Link
                href="/"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/#why-choose-us"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Why Choose Us
              </Link>
              <Link
                href="/#services"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/#how-it-works"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                How it Works
              </Link>
              <Link
                href="/#about"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="/faq"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="/#contact"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Contact
              </Link>
              <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white bg-transparent"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/book-service" onClick={() => setMobileNavOpen(false)}>
                <Button className="w-full bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white">
                  Book a Walk
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zubo-primary/10 to-zubo-highlight-2/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-zubo-text mb-6 leading-tight">
            Cancellation &{" "}
            <span className="text-transparent bg-clip-text gradient-text bg-gradient-to-r from-zubo-primary to-zubo-highlight-2">
              Refund Policy
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed text-pretty max-w-3xl mx-auto">
            Understand our cancellation terms and refund process
          </p>
        </div>
      </section>

      {/* Policy Content */}
      {loading ? (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary" />
                <h3 className="text-lg font-semibold text-zubo-text mb-2">Loading cancellation policy</h3>
                <p className="text-sm text-gray-600">Please wait...</p>
              </div>
            </div>
          </div>
        </section>
      ) : error || !policy ? (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert className="border-destructive bg-destructive/10 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error || "Cancellation policy not found"}
              </AlertDescription>
            </Alert>
          </div>
        </section>
      ) : (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Policy Overview */}
            <Card className="mb-6 overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-zubo-primary/10 to-zubo-highlight-1/10 border-b border-zubo-primary/20">
                <CardTitle className="flex items-center gap-3 text-zubo-text">
                  <div className="w-10 h-10 rounded-lg bg-zubo-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-zubo-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">{policy.name}</span>
                    <div className="text-sm text-gray-600 font-normal">
                      Effective from {format(new Date(policy.effectiveFrom), "PPP")}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              {policy.description && (
                <CardContent className="p-6">
                  <p className="text-gray-700 leading-relaxed">{policy.description}</p>
                </CardContent>
              )}
            </Card>

            {/* Cancellation Rules */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold text-zubo-text mb-4">Refund Schedule</h2>

              {policy.rules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`overflow-hidden border-0 shadow-lg bg-gradient-to-r ${getRefundColor(rule.refundPercent)}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">{getRefundIcon(rule.refundPercent)}</div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-zubo-text">{formatTimeRange(rule)}</h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-zubo-text">{rule.refundPercent}%</div>
                            <div className="text-sm text-gray-600">
                              {rule.refundPercent === 100
                                ? "Full refund"
                                : rule.refundPercent === 0
                                  ? "No refund"
                                  : `Partial refund`}
                            </div>
                          </div>
                        </div>

                        {rule.description && <p className="text-gray-700 mb-2">{rule.description}</p>}

                        {rule.notes && <p className="text-sm text-gray-600 italic">{rule.notes}</p>}

                        {rule.refundPercent < 100 && rule.refundPercent > 0 && (
                          <div className="mt-3 text-sm text-gray-600">
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
              <Card className="border-0 shadow-lg bg-gradient-to-r from-zubo-accent/10 to-zubo-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-zubo-text">
                    <CheckCircle className="h-5 w-5 text-zubo-accent" />
                    Quality Guarantee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    If you are unsatisfied with the quality of service you received, you may be eligible for a full
                    refund.
                  </p>
                  <div className="mt-3 p-3 bg-zubo-accent/10 rounded-lg border border-zubo-accent/20">
                    <p className="text-xs text-gray-700">
                      <strong>Important:</strong> Contact our customer service team within 24 hours of the service with
                      details (description, photos, videos) to be eligible for a quality-based refund.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Time */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-zubo-primary/10 to-zubo-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-zubo-text">
                    <Clock className="h-5 w-5 text-zubo-primary" />
                    Refund Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                    Approved refunds are processed back to your original payment method.
                  </p>
                  <div className="space-y-2 text-xs text-gray-700">
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
            <Card className="border-0 shadow-lg bg-gradient-to-r from-zubo-highlight-1/10 to-zubo-highlight-1/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-zubo-highlight-1/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-zubo-highlight-1" />
                </div>
                <h3 className="font-semibold text-zubo-text mb-2">Questions About Cancellations?</h3>
                <p className="text-gray-700 text-sm mb-4">
                  If you have any questions about these charges or need assistance with cancellations, feel free to
                  contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => window.open("mailto:care@zubopets.com", "_blank")}
                    className="border-zubo-highlight-1 text-zubo-highlight-1 hover:bg-zubo-highlight-1 hover:text-white bg-transparent"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    care@zubopets.com
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918123168861"}`,
                        "_blank",
                      )
                    }
                    className="border-zubo-highlight-1 text-zubo-highlight-1 hover:bg-zubo-highlight-1 hover:text-white bg-transparent"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Alert className="mt-6 border-zubo-primary/20 bg-zubo-primary/10">
              <Info className="h-4 w-4 text-zubo-primary" />
              <AlertDescription className="text-gray-700">
                <strong>Please note:</strong> This policy applies to all bookings made after{" "}
                {format(new Date(policy.effectiveFrom), "PPP")}. Cancellation fees are calculated based on the time
                remaining until your scheduled service when you request cancellation.
              </AlertDescription>
            </Alert>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-20 bg-zubo-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Ready to Give Your Pet the Best Care?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join pet parents who trust Zubo Pets for their dog walking needs. Get started today and find the perfect
            walker for your furry friend.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/book-service">
              <Button
                size="lg"
                className="bg-white text-zubo-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                Book a Walk
              </Button>
            </Link>
            <Link href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918123168861"}`}>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-zubo-primary px-8 py-3 text-lg font-semibold bg-white/10 backdrop-blur-sm"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with a Human
              </Button>
            </Link>
            <Link href="tel:+918123168861">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-zubo-primary px-8 py-3 text-lg font-semibold bg-white/10 backdrop-blur-sm"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Us +91-81231-68861
              </Button>
            </Link>
          </div>
          <p className="text-white/90 text-sm">We're here for you 5 am – 10 pm</p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
