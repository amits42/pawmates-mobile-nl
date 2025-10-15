"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Heart, CreditCard, CheckCircle, Lock, Sparkles } from "lucide-react"
import { getStoredUser } from "@/lib/auth"
import { format } from "date-fns"

// Razorpay types
declare global {
  interface Window {
    Razorpay: any
  }
}

export default function ReviewServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  // Booking and service details
  const [booking, setBooking] = useState<any>(null)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [existingTip, setExistingTip] = useState<any>(null)

  // Review form state
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [tipAmount, setTipAmount] = useState("")
  const [showTipSection, setShowTipSection] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => {
          setRazorpayLoaded(true)
          resolve(true)
        }
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
      })
    }

    loadRazorpay()
  }, [])

  // Handle client-side mounting and get user data
  useEffect(() => {
    setMounted(true)
    const userData = getStoredUser()
    if (userData) {
      setUser(userData)
    }
  }, [])

  // Fetch booking details when user and search params are available
  useEffect(() => {
    if (user && searchParams && mounted) {
      const bookingId = searchParams.get("bookingId")
      if (bookingId) {
        fetchBookingDetails(bookingId)
        checkExistingReviewAndTip(bookingId)
      }
    }
  }, [user, searchParams, mounted])

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings?userId=${user.id}`, {
        headers: {
          "X-User-ID": user.id,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bookings")
      }

      const bookings = await response.json()
      const foundBooking = bookings.find((b: any) => b.id === bookingId)

      if (!foundBooking) {
        throw new Error("Booking not found")
      }

      // Only allow review for completed bookings
      if (foundBooking.status !== "COMPLETED") {
        alert("You can only review completed services")
        router.push("/landing")
        return
      }

      setBooking(foundBooking)
    } catch (error) {
      console.error("Error fetching booking details:", error)
      alert("Failed to load booking details")
      router.push("/landing")
    }
  }

  const checkExistingReviewAndTip = async (bookingId: string) => {
    try {
      // Check for existing review
      const reviewResponse = await fetch(`/api/reviews?bookingId=${bookingId}`, {
        headers: {
          "X-User-ID": user.id,
        },
      })

      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json()
        if (reviewData.review) {
          setExistingReview(reviewData.review)
          setRating(reviewData.review.rating)
          setReviewText(reviewData.review.review_text || "")
        }
      }

      // Check for existing tip
      const tipResponse = await fetch(`/api/tips?bookingId=${bookingId}`, {
        headers: {
          "X-User-ID": user.id,
        },
      })

      if (tipResponse.ok) {
        const tipData = await tipResponse.json()
        if (tipData.tip) {
          setExistingTip(tipData.tip)
        }
      }
    } catch (error) {
      console.error("Error checking existing review/tip:", error)
    }
  }

  const handleSubmitReview = async () => {
    if (!booking || !rating) {
      alert("Please provide a rating")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/reviews", {
        method: existingReview ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          serviceId: booking.serviceId,
          sitterId: booking.sitterId,
          rating,
          reviewText: reviewText.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit review")
      }

      const result = await response.json()
      setExistingReview(result.review)
      alert("Review submitted successfully!")
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleTipPayment = async () => {
    if (!booking || !tipAmount || Number.parseFloat(tipAmount) <= 0) {
      alert("Please enter a valid tip amount")
      return
    }

    if (!razorpayLoaded) {
      alert("Payment system is loading. Please try again in a moment.")
      return
    }

    setLoading(true)
    try {
      // Create Razorpay order for tip
      const orderResponse = await fetch("/api/tips/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          serviceId: booking.serviceId,
          sitterId: booking.sitterId,
          tipAmount: Number.parseFloat(tipAmount),
        }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || "Failed to create tip order")
      }

      const orderData = await orderResponse.json()

      // Open Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Zubo Pets - Service Tip",
        description: `Tip for ${booking.serviceName}`,
        order_id: orderData.orderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: "#10B981",
        },
        handler: async (response: any) => {
          try {
            // Verify tip payment
            const verifyResponse = await fetch("/api/tips/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-User-ID": user.id,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking.id,
                tipAmount: Number.parseFloat(tipAmount),
              }),
            })

            if (!verifyResponse.ok) {
              throw new Error("Tip payment verification failed")
            }

            const verifyData = await verifyResponse.json()
            setExistingTip(verifyData.tip)
            alert("Tip sent successfully! Thank you for your generosity.")
            setTipAmount("")
            setShowTipSection(false)
          } catch (verifyError) {
            console.error("Tip payment verification error:", verifyError)
            alert("Tip payment was successful but verification failed. Please contact support.")
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error("Tip payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Tip payment failed: ${errorMessage}. Please try again.`)
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zubo-primary"></div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading booking details...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-zubo-text flex items-center justify-center">
          <Star className="mr-3 h-8 w-8 text-zubo-primary" />
          Review & Tip Service
          <Heart className="ml-3 h-6 w-6 text-zubo-highlight-2 animate-pulse" />
        </h1>
        <p className="text-zubo-text/70">Share your experience and show appreciation for great service</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Details */}
        <Card className="bg-gradient-to-r from-zubo-primary/10 to-zubo-primary/5 border-zubo-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-zubo-text">📋 Service Details</CardTitle>
            <CardDescription>Review the completed service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between p-2 bg-zubo-background/50 rounded-lg">
              <span className="font-medium">🛠️ Service:</span>
              <span>{booking.serviceName}</span>
            </div>
            <div className="flex justify-between p-2 bg-zubo-background/50 rounded-lg">
              <span className="font-medium">🐾 Pet:</span>
              <span>{booking.petName}</span>
            </div>
            <div className="flex justify-between p-2 bg-zubo-background/50 rounded-lg">
              <span className="font-medium">📅 Date:</span>
              <span>{format(new Date(booking.date), "PPP")}</span>
            </div>
            <div className="flex justify-between p-2 bg-zubo-background/50 rounded-lg">
              <span className="font-medium">⏰ Time:</span>
              <span>{booking.time}</span>
            </div>
            <div className="flex justify-between p-2 bg-zubo-background/50 rounded-lg">
              <span className="font-medium">💰 Amount Paid:</span>
              <span className="font-bold text-zubo-primary">₹{booking.totalPrice}</span>
            </div>
            <div className="flex justify-between p-2 bg-green-50 rounded-lg">
              <span className="font-medium">✅ Status:</span>
              <span className="text-green-600 font-medium">Completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Review Section */}
        <Card className="bg-gradient-to-r from-zubo-highlight-2/10 to-zubo-highlight-2/5 border-zubo-highlight-2/20">
          <CardHeader>
            <CardTitle className="flex items-center text-zubo-text">
              <Star className="mr-2 h-5 w-5 text-zubo-highlight-2" />
              {existingReview ? "Your Review" : "Rate This Service"}
            </CardTitle>
            <CardDescription>
              {existingReview ? "You have already reviewed this service" : "Help others by sharing your experience"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating Stars */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Rating *</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !existingReview && setRating(star)}
                    disabled={!!existingReview}
                    className={`p-1 transition-colors ${star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                      } ${existingReview ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <Label htmlFor="review" className="text-sm font-medium mb-2 block">
                Review (Optional)
              </Label>
              <Textarea
                id="review"
                placeholder="Share your experience with this service..."
                value={reviewText}
                onChange={(e) => !existingReview && setReviewText(e.target.value)}
                disabled={!!existingReview}
                rows={4}
                className="resize-none"
              />
            </div>

            {!existingReview && (
              <Button
                onClick={handleSubmitReview}
                disabled={loading || !rating}
                className="w-full bg-zubo-highlight-2 hover:bg-zubo-highlight-2/90"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Review...
                  </>
                ) : (
                  "Submit Review ⭐"
                )}
              </Button>
            )}

            {existingReview && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Review submitted successfully!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">Thank you for sharing your feedback.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tip Section */}
      <div className="mt-6">
        <Card className="bg-gradient-to-r from-zubo-accent/10 to-zubo-accent/5 border-zubo-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center text-zubo-text">
              <Heart className="mr-2 h-5 w-5 text-zubo-accent" />
              Show Appreciation with a Tip
            </CardTitle>
            <CardDescription>
              {existingTip
                ? "You have already sent a tip for this service"
                : "Send a tip to show appreciation for excellent service"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingTip ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Tip sent successfully!</span>
                </div>
                <div className="text-sm text-green-600">
                  <p>Amount: ₹{existingTip.tip_amount}</p>
                  <p>Sent on: {format(new Date(existingTip.created_at), "PPP")}</p>
                </div>
              </div>
            ) : !showTipSection ? (
              <Button onClick={() => setShowTipSection(true)} className="w-full bg-zubo-accent hover:bg-zubo-accent/90">
                💝 Send a Tip
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tipAmount" className="text-sm font-medium mb-2 block">
                    Tip Amount (₹) *
                  </Label>
                  <Input
                    id="tipAmount"
                    type="number"
                    placeholder="Enter tip amount"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    min="1"
                    step="1"
                  />
                </div>

                <div className="bg-zubo-accent/10 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-zubo-accent font-medium mb-2">
                    <Lock className="h-4 w-4" />
                    <span>Secure Payment</span>
                  </div>
                  <ul className="text-sm text-zubo-text/70 space-y-1">
                    <li>• Powered by Razorpay</li>
                    <li>• 256-bit SSL encryption</li>
                    <li>• Instant transfer to service provider</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowTipSection(false)
                      setTipAmount("")
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTipPayment}
                    disabled={loading || !tipAmount || Number.parseFloat(tipAmount) <= 0 || !razorpayLoaded}
                    className="flex-1 bg-zubo-accent hover:bg-zubo-accent/90"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : !razorpayLoaded ? (
                      "Loading Payment..."
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay ₹{tipAmount} <Sparkles className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
