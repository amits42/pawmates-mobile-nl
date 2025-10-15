"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CreditCard,
  Lock,
  Shield,
  CheckCircle,
  Clock,
  MapPin,
  ArrowLeft,
  Tag,
  X,
  FileText,
  RefreshCw,
  XCircle,
  IndianRupee,
  Mail,
  MessageCircle,
} from "lucide-react"
import { getStoredUser } from "@/lib/auth"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

// Razorpay types
declare global {
  interface Window {
    Razorpay: any
  }
}

const PaymentPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const paramsProcessed = useRef(false)
  const [user, setUser] = useState<any>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  const [couponSheetOpen, setCouponSheetOpen] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [originalPrice, setOriginalPrice] = useState(0)
  const [couponError, setCouponError] = useState("")
  const [shakeAnimation, setShakeAnimation] = useState(false)

  const [policySheetOpen, setPolicySheetOpen] = useState(false)
  const [policyData, setPolicyData] = useState<any>(null)
  const [policyLoading, setPolicyLoading] = useState(false)

  const [bookingDetails, setBookingDetails] = useState({
    pet: "",
    service: "",
    date: null as Date | null,
    time: "",
    times: [] as string[],
    recurring: false,
    pattern: "",
    endDate: null as Date | null,
  })

  const [servicePrice, setServicePrice] = useState(0)
  const [serviceName, setServiceName] = useState("")
  const [petName, setPetName] = useState("")
  const [existingBooking, setExistingBooking] = useState<any>(null)
  const [isExistingBooking, setIsExistingBooking] = useState(false)

  const [paymentOption, setPaymentOption] = useState<"pay-now" | "pay-later">("pay-now")

  const [isRecurringPayment, setIsRecurringPayment] = useState(false)
  const [recurringBookingId, setRecurringBookingId] = useState<string | null>(null)
  const [recurringBookingDetails, setRecurringBookingDetails] = useState<any | null>(null)

  const [sessionDetails, setSessionDetails] = useState<any>(null)

  const getFinalPrice = () => {
    if (appliedCoupon) {
      return appliedCoupon.finalAmount
    }
    return servicePrice
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

  const getRefundLabel = (refundPercent: number) => {
    if (refundPercent === 100) return "Full refund"
    if (refundPercent === 0) return "No refund"
    return "Partial refund"
  }

  const formatTimeRange = (rule: any) => {
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

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      setShakeAnimation(true)
      setTimeout(() => setShakeAnimation(false), 600)
      return
    }

    setCouponLoading(true)
    setCouponError("")

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "",
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          bookingAmount: originalPrice || servicePrice,
          userId: user?.id,
        }),
      })

      const result = await response.json()

      if (result.valid) {
        setAppliedCoupon(result)
        setCouponSheetOpen(false)
        console.log("✅ Coupon applied:", result)
      } else {
        setCouponError(result.error || "Invalid coupon code")
        setShakeAnimation(true)
        setTimeout(() => setShakeAnimation(false), 600)
      }
    } catch (error) {
      console.error("❌ Error validating coupon:", error)
      setCouponError("Failed to validate coupon. Please try again.")
      setShakeAnimation(true)
      setTimeout(() => setShakeAnimation(false), 600)
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  const fetchCancellationPolicy = async () => {
    setPolicyLoading(true)
    try {
      const response = await fetch("/api/cancellation-policy")
      if (response.ok) {
        const data = await response.json()
        setPolicyData(data.policy)
      }
    } catch (error) {
      console.error("Error fetching cancellation policy:", error)
    } finally {
      setPolicyLoading(false)
    }
  }

  useEffect(() => {
    if (policySheetOpen && !policyData) {
      fetchCancellationPolicy()
    }
  }, [policySheetOpen])

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

  // Handle client-side mounting and parse search params
  useEffect(() => {
    setMounted(true)

    // Get user data
    const userData = getStoredUser()
    if (userData) {
      setUser(userData)
    }

    // Parse search params only once
    if (searchParams && !paramsProcessed.current) {
      const bookingId = searchParams.get("bookingId")
      const payExisting = searchParams.get("payExisting") === "true"

      if (payExisting && bookingId) {
        // This is an existing booking that needs payment
        console.log("💳 Existing booking payment flow for:", bookingId)
        setIsExistingBooking(true)
      } else {
        // This is a new booking flow
        console.log("💳 New booking payment flow")
        setIsExistingBooking(false)

        const pet = searchParams.get("pet") || ""
        const service = searchParams.get("service") || ""
        const dateStr = searchParams.get("date")
        const time = searchParams.get("time") || ""
        const recurring = searchParams.get("recurring") === "true"
        const pattern = searchParams.get("pattern") || ""
        const endDateStr = searchParams.get("endDate")
        // Get address from params if present
        const address = searchParams.get("address") || null
        const sessions = Number.parseInt(searchParams?.get("sessions") || "1")

        const timesStr = searchParams.get("times")
        let times: string[] = []
        if (timesStr) {
          try {
            times = JSON.parse(timesStr)
          } catch (e) {
            console.error("Failed to parse times:", e)
            times = []
          }
        }

        setBookingDetails({
          pet,
          service,
          date: dateStr ? new Date(dateStr) : null,
          time,
          times,
          recurring,
          pattern,
          endDate: endDateStr ? new Date(endDateStr) : null,
        })

        // Store address in a ref for later use in bookingData
        if (address) {
          addressRef.current = address
        } else {
          addressRef.current = null
        }

        // Set the price based on recurring or single booking
        if (recurring) {
          fetchServiceDetails(service, true, sessions)

          // For new recurring bookings, you may want to calculate price client-side or fetch from backend if needed
          // For now, leave as is (or fetchServiceDetails if needed)
        } else if (service) {
          // Fetch service details to get the price for single booking
          fetchServiceDetails(service, false)
        }
      }

      const payRecurring = searchParams.get("payRecurring") === "true"
      const recurringBookingIdParam = searchParams.get("recurringBookingId")

      if (payRecurring && recurringBookingIdParam) {
        console.log("💳 Recurring session payment flow for:", recurringBookingIdParam)
        setIsRecurringPayment(true)
        setRecurringBookingId(recurringBookingIdParam)
        fetchSessionDetails(recurringBookingIdParam)
        // All session details will be fetched from backend, not from URL
      }

      paramsProcessed.current = true
    }
  }, [])

  // Add a separate effect to handle existing booking fetch when user becomes available
  useEffect(() => {
    if (user && isExistingBooking && searchParams) {
      const bookingId = searchParams.get("bookingId")
      if (bookingId && !existingBooking) {
        console.log("👤 User loaded, now fetching existing booking details")
        fetchExistingBookingDetails(bookingId)
      }
    }
  }, [user, isExistingBooking, existingBooking])

  // Set service price from recurringBookingDetails when in recurring payment mode
  useEffect(() => {
    if (isRecurringPayment && recurringBookingDetails) {
      let price = 0
      if (typeof recurringBookingDetails.session_price === "number") {
        price = recurringBookingDetails.session_price
      } else if (typeof recurringBookingDetails.price === "number") {
        price = recurringBookingDetails.price
      } else if (typeof recurringBookingDetails.session_price === "string") {
        price = Number.parseFloat(recurringBookingDetails.session_price)
      } else if (typeof recurringBookingDetails.price === "string") {
        price = Number.parseFloat(recurringBookingDetails.price)
      }
      console.log("[Recurring Payment] Setting servicePrice:", price, "from", recurringBookingDetails)
      setServicePrice(price)
      setOriginalPrice(price)
    }
  }, [isRecurringPayment, recurringBookingDetails])

  useEffect(() => {
    if (servicePrice > 0 && originalPrice === 0) {
      setOriginalPrice(servicePrice)
    }
  }, [servicePrice, originalPrice])

  const fetchExistingBookingDetails = async (bookingId: string) => {
    try {
      console.log("🔍 Fetching existing booking details for:", bookingId)

      // Get user ID for the API call
      const userId = user?.id
      if (!userId) {
        console.log("⏳ User not yet available, will retry when user loads")
        return // Don't throw error, just return - the useEffect will retry
      }

      // Fetch the specific booking by ID
      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          "X-User-ID": userId,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch booking")
      }

      const booking = await response.json()

      if (!booking) {
        throw new Error("Booking not found")
      }

      console.log("✅ Found existing booking:", booking)

      setExistingBooking(booking)
      setServicePrice(booking.totalPrice || 0)
      setOriginalPrice(booking.totalPrice || 0)
      setServiceName(booking.serviceName || "Unknown Service")
      setPetName(booking.petName || "Unknown Pet")

      // Set booking details for display
      setBookingDetails({
        pet: booking.petId,
        service: booking.serviceId,
        date: booking.date ? new Date(booking.date) : null,
        time: booking.time,
        times: booking.times || [],
        recurring: booking.recurring || false,
        pattern: booking.recurringPattern || "",
        endDate: booking.recurringEndDate ? new Date(booking.recurringEndDate) : null,
      })
    } catch (error) {
      console.error("❌ Error fetching existing booking:", error)
      // Only show alert if user is available (real error)
      if (user?.id) {
        alert("Failed to load booking details. Please try again.")
      }
    }
  }

  const fetchSessionDetails = async (recurringBookingIdParam: string) => {
    const response = await fetch(`/api/bookings/recurring/session/${recurringBookingIdParam}`, {})
    if (!response.ok) {
      throw new Error("Failed to fetch session")
    }

    const sessions = await response.json()
    setRecurringBookingDetails(sessions.session)
  }

  const fetchServiceDetails = async (serviceId: string, isRecurring: boolean, sessions: number) => {
    try {
      const response = await fetch("/api/services")
      const services = await response.json()
      const selectedService = services.find((s: any) => s.id === serviceId)

      if (selectedService) {
        if (isRecurring && sessions) {
          const totalPrice = selectedService.price * sessions
          setServicePrice(totalPrice)
          setOriginalPrice(totalPrice)
        } else {
          setServicePrice(selectedService.price)
          setOriginalPrice(selectedService.price)
        }
        setServiceName(selectedService.name)
        console.log("💰 Service price loaded:", selectedService.price)
      }
    } catch (error) {
      console.error("❌ Error fetching service details:", error)
      setServicePrice(500) // Fallback price
      setOriginalPrice(500)
    }
  }

  // Ref to store address param for new bookings
  const addressRef = useRef<string | null>(null)

  const handleRazorpayPayment = async () => {
    // Handle payment for both new and existing bookings
    if (!razorpayLoaded) {
      alert("Payment system is loading. Please try again in a moment.")
      return
    }

    setLoading(true)
    if (!isExistingBooking && paymentOption === "pay-later") {
      // Handle pay later for new bookings - create booking without payment
      try {
        setLoading(true)
        console.log("📝 Creating pay-later booking...")

        // Validate required booking details
        if (!bookingDetails.pet || !bookingDetails.service || !bookingDetails.date) {
          throw new Error("Please complete all booking details")
        }

        if (bookingDetails.recurring) {
          if (!bookingDetails.times || bookingDetails.times.length === 0) {
            throw new Error("Please select at least one time slot")
          }
        } else {
          if (!bookingDetails.time) {
            throw new Error("Please select a time slot")
          }
        }

        const finalBookingPrice = getFinalPrice()

        // Prepare booking data
        const bookingData: any = {
          petId: bookingDetails.pet,
          serviceId: bookingDetails.service,
          date: bookingDetails.date?.toISOString().split("T")[0],
          ...(bookingDetails.recurring ? { times: bookingDetails.times } : { time: bookingDetails.time }),
          duration: 60,
          totalPrice: finalBookingPrice,
          recurring: bookingDetails.recurring,
          recurringPattern: bookingDetails.pattern || null,
          recurringEndDate: bookingDetails.endDate?.toISOString().split("T")[0] || null,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          userPhone: user?.phone,
          paymentOption: "pay-later",
        }
        // Only add address if present (for new bookings)
        if (addressRef.current) {
          bookingData.addressId = addressRef.current
        }

        // Create booking with pay-later option
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": user?.id || "",
          },
          body: JSON.stringify(bookingData),
        })

        if (!response.ok) {
          throw new Error("Failed to create booking")
        }

        const result = await response.json()

        if (appliedCoupon) {
          try {
            await fetch("/api/coupons/apply", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-User-ID": user?.id || "",
              },
              body: JSON.stringify({
                couponCode: appliedCoupon.coupon.code,
                bookingId: result.bookingId,
                discountAmount: appliedCoupon.discountAmount,
              }),
            })
            console.log("✅ Coupon applied to pay-later booking")
          } catch (couponError) {
            console.error("⚠️ Failed to apply coupon (non-critical):", couponError)
          }
        }

        const notificationResponse = await fetch("/api/bookings/send-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: result.bookingId,
            isRecurring: false,
            serviceOtp: result.serviceOtp,
            startOtp: result.startOtp,
            payLater: true,
            endOtp: result.endOtp,
            phone: user?.phone,
          }),
        })

        const notificationResult = await notificationResponse.json()
        console.log("📱 Notification result:", notificationResult)

        console.log("✅ Pay-later booking created:", result.bookingId)

        // Redirect to success page with same message as immediate payment
        router.push(`/booking-details/${result.bookingId}`)
      } catch (error) {
        console.error("❌ Pay-later booking error:", error)
        alert(`Failed to create booking: ${error instanceof Error ? error.message : "Unknown error"}`)
        setLoading(false)
      }
      return
    }

    try {
      console.log("💳 Starting Razorpay payment process...")

      let bookingData: any

      if (isRecurringPayment && recurringBookingDetails) {
        bookingData = {
          recurringBookingId: recurringBookingDetails.id,
          mainBookingId: recurringBookingDetails.main_booking_id,
          petId: recurringBookingDetails.pet_id,
          serviceId: recurringBookingDetails.service_id,
          date: recurringBookingDetails.session_date,
          times: recurringBookingDetails.session_times || [],
          couponCode: recurringBookingDetails.coupon_code || null,
          totalPrice: getFinalPrice(),
          recurring: true,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          userPhone: user?.phone,
          isExistingBooking: true,
        }
      } else if (isExistingBooking && existingBooking) {
        // For existing bookings, use the existing booking data
        bookingData = {
          bookingId: existingBooking.id,
          petId: existingBooking.petId,
          serviceId: existingBooking.serviceId,
          date: existingBooking.date,
          couponCode: existingBooking.couponCode || null,
          times: existingBooking.times || [],
          duration: existingBooking.duration || 60,
          totalPrice: getFinalPrice(),
          recurring: existingBooking.recurring,
          recurringPattern: existingBooking.recurringPattern,
          recurringEndDate: existingBooking.recurringEndDate,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          userPhone: user?.phone,
          isExistingBooking: true,
        }
      } else {
        // For new bookings, validate required booking details
        if (!bookingDetails.pet || !bookingDetails.service || !bookingDetails.date) {
          throw new Error("Please complete all booking details")
        }

        if (bookingDetails.recurring) {
          if (!bookingDetails.times || bookingDetails.times.length === 0) {
            throw new Error("Please select at least one time slot")
          }
        } else {
          if (!bookingDetails.time) {
            throw new Error("Please select a time slot")
          }
        }

        bookingData = {
          petId: bookingDetails.pet,
          serviceId: bookingDetails.service,
          date: bookingDetails.date?.toISOString().split("T")[0],
          ...(bookingDetails.recurring ? { times: bookingDetails.times } : { time: bookingDetails.time }),
          duration: 60,
          totalPrice: getFinalPrice(),
          recurring: bookingDetails.recurring,
          recurringPattern: bookingDetails.pattern || null,
          recurringEndDate: bookingDetails.endDate?.toISOString().split("T")[0] || null,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          userPhone: user?.phone,
        }
        // Only add address if present (for new bookings)
        if (addressRef.current) {
          bookingData.addressId = addressRef.current
        }
      }

      // Add coupon information to booking data if applied
      if (appliedCoupon) {
        bookingData.couponCode = appliedCoupon.coupon.code
        bookingData.originalAmount = appliedCoupon.originalAmount
        bookingData.discountAmount = appliedCoupon.discountAmount
      }

      console.log("📋 Creating Razorpay order...")

      // Step 1: Create Razorpay order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "",
        },
        body: JSON.stringify({ bookingData }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || "Failed to create payment order")
      }

      const orderData = await orderResponse.json()
      console.log("✅ Razorpay order created:", orderData.orderId)

      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: orderData.theme,
        handler: async (response: any) => {
          console.log("💳 Payment successful:", response.razorpay_payment_id)

          try {
            // Step 3: Verify payment on server
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingData,
              }),
            })

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed")
            }

            const verifyData = await verifyResponse.json()
            console.log("✅ Payment verified:", verifyData.bookingId)

            if (appliedCoupon) {
              try {
                await fetch("/api/coupons/apply", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-User-ID": user?.id || "",
                  },
                  body: JSON.stringify({
                    couponCode: appliedCoupon.coupon.code,
                    bookingId: verifyData.bookingId || null,
                    recurringBookingId: verifyData.recurringBookingId || null,
                    discountAmount: appliedCoupon.discountAmount,
                  }),
                })
                console.log("✅ Coupon applied after payment verification")
              } catch (couponError) {
                console.error("⚠️ Failed to apply coupon (non-critical):", couponError)
              }
            }

            // Step 4: Send WhatsApp notification
            try {
              const notificationResponse = await fetch("/api/bookings/send-confirmation", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  bookingId: verifyData.bookingId || verifyData.recurringBookingId,
                  isRecurring: verifyData.bookingId ? false : true,
                  serviceOtp: verifyData.serviceOtp,
                  startOtp: verifyData.startOtp,
                  endOtp: verifyData.endOtp,
                  phone: user?.phone,
                }),
              })

              const notificationResult = await notificationResponse.json()
              console.log("📱 Notification result:", notificationResult)
            } catch (notificationError) {
              console.error("⚠️ Notification failed (non-critical):", notificationError)
            }

            // Step 5: Redirect to success page
            if (verifyData.bookingId) {
              router.push(`/booking-details/${verifyData.bookingId || verifyData.recurringBookingId}`)
            } else if (verifyData.recurringBookingId) {
              router.push(
                `/recurring-session?recurringBookingId=${verifyData.bookingId || verifyData.recurringBookingId}`,
              )
            }
          } catch (verifyError) {
            console.error("❌ Payment verification error:", verifyError)
            alert("Payment was successful but verification failed. Please contact support.")
          }
        },
        modal: {
          ondismiss: () => {
            console.log("💳 Payment modal dismissed")
            setLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error("❌ Payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Payment failed: ${errorMessage}. Please try again.`)
      setLoading(false)
    }
  }

  const handleBackNavigation = () => {
    // Don't preserve state for existing bookings - start fresh
    if (isExistingBooking || isRecurringPayment) {
      router.push("/book-service")
      return
    }

    // For new bookings, preserve all the booking details in URL params
    const params = new URLSearchParams()

    if (bookingDetails.pet) params.set("pet", bookingDetails.pet)
    if (bookingDetails.service) params.set("service", bookingDetails.service)
    if (bookingDetails.date) params.set("date", bookingDetails.date.toISOString().split("T")[0])
    if (addressRef.current) params.set("address", addressRef.current)
    params.set("recurring", bookingDetails.recurring.toString())

    if (bookingDetails.recurring) {
      if (bookingDetails.times.length > 0) params.set("times", JSON.stringify(bookingDetails.times))
      if (bookingDetails.pattern) params.set("pattern", bookingDetails.pattern)
      if (bookingDetails.endDate) params.set("endDate", bookingDetails.endDate.toISOString().split("T")[0])
      const sessions = searchParams?.get("sessions")
      if (sessions) params.set("sessions", sessions)
      const totalPrice = searchParams?.get("totalPrice")
      if (totalPrice) params.set("totalPrice", totalPrice)
    } else {
      if (bookingDetails.time) params.set("time", bookingDetails.time)
    }

    router.push(`/book-service?${params.toString()}`)
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zubo-background to-zubo-primary/5">
        <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-zubo-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-zubo-text font-medium">Loading secure payment...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zubo-background to-zubo-primary/5">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={handleBackNavigation} className="text-zubo-text hover:text-zubo-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-zubo-primary" />
              <span className="font-semibold text-zubo-text">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-zubo-primary to-zubo-highlight-2 rounded-full mb-6">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-zubo-text">Complete Your Payment</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Secure, fast, and trusted by pet parents across Bengaluru
          </p>

          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Razorpay Secured</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm sticky top-24">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-green-800">
                    <Shield className="mr-2 h-5 w-5" />
                    Secure Payment
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Protected by Razorpay's advanced security
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {!isExistingBooking && !isRecurringPayment && (
                    <div>
                      <h3 className="font-semibold text-zubo-text mb-4 flex items-center">
                        <Tag className="mr-2 h-4 w-4" />
                        Coupon Code
                      </h3>

                      {appliedCoupon ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800">Coupon Applied!</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeCoupon}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm text-green-700">
                            <div className="flex justify-between">
                              <span>Code: {appliedCoupon.coupon.code}</span>
                              <span className="font-medium">-₹{appliedCoupon.discountAmount}</span>
                            </div>
                            {appliedCoupon.coupon.description && (
                              <p className="mt-1 text-xs">{appliedCoupon.coupon.description}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setCouponSheetOpen(true)}
                          className="w-full border-dashed border-zubo-primary/30 text-zubo-primary hover:bg-zubo-primary/5"
                        >
                          <Tag className="mr-2 h-4 w-4" />
                          Apply Coupon Code
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="bg-zubo-primary p-6 rounded-lg text-white space-y-3">
                    {appliedCoupon ? (
                      <>
                        <div className="flex justify-between items-center pb-3 border-b border-white/20">
                          <span className="text-white/80">Subtotal</span>
                          <span className="font-medium">₹{originalPrice}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-white/20">
                          <span className="text-white/80">Discount ({appliedCoupon.coupon.code})</span>
                          <span className="font-medium text-green-300">-₹{appliedCoupon.discountAmount}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-lg font-semibold">Payable Amount</span>
                          <div className="text-right">
                            <div className="text-white/60 text-sm line-through">₹{originalPrice}</div>
                            <div className="text-3xl font-bold">₹{getFinalPrice()}</div>
                          </div>
                        </div>
                        <div className="text-center pt-2">
                          <span className="text-sm text-green-300">You save ₹{appliedCoupon.discountAmount}!</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center pb-3 border-b border-white/20">
                          <span className="text-white/80">Subtotal</span>
                          <span className="font-medium">₹{servicePrice}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-lg font-semibold">Payable Amount</span>
                          <span className="text-3xl font-bold">₹{servicePrice}</span>
                        </div>
                      </>
                    )}

                    <div className="pt-4 border-t border-white/20">
                      <button
                        onClick={() => setPolicySheetOpen(true)}
                        className="flex items-center gap-2 text-white/90 hover:text-white text-sm transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="underline">Cancellation and Refund Policy</span>
                      </button>
                    </div>
                  </div>

                  {!isExistingBooking && !isRecurringPayment && (
                    <div>
                      <h3 className="font-semibold text-zubo-text mb-4">Payment Options</h3>
                      <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="space-y-3">
                        <div className="flex items-center space-x-3 p-4 border-2 border-zubo-primary/20 rounded-lg hover:border-zubo-primary/40 transition-colors">
                          <RadioGroupItem value="pay-now" id="pay-now" />
                          <Label htmlFor="pay-now" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 font-medium text-zubo-text">Pay Now</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Secure instant payment to confirm your booking
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <RadioGroupItem value="pay-later" id="pay-later" />
                          <Label htmlFor="pay-later" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 font-medium text-zubo-text">Pay Later</div>
                            <div className="text-sm text-gray-600 mt-1">Book now, pay after service completion</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-zubo-text mb-4">Accepted Payment Methods</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: CreditCard, label: "Cards" },
                        { icon: MapPin, label: "UPI" },
                        { icon: Shield, label: "Net Banking" },
                        { icon: CheckCircle, label: "Wallets" },
                      ].map((method, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <method.icon className="h-4 w-4 text-zubo-primary" />
                          <span className="text-sm font-medium">{method.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-3">
                      <Lock className="h-4 w-4" />
                      <span>Security Promise</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Bank-grade 256-bit encryption
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        PCI DSS Level 1 compliant
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Zero card data storage
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Instant refund guarantee
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button
                    onClick={handleRazorpayPayment}
                    className="w-full bg-gradient-to-r from-zubo-primary to-zubo-highlight-2 hover:from-zubo-primary/90 hover:to-zubo-highlight-2/90 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    disabled={loading || (!razorpayLoaded && (paymentOption === "pay-now" || isExistingBooking))}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        {isRecurringPayment
                          ? "Processing Session Payment..."
                          : isExistingBooking
                            ? "Processing Payment..."
                            : paymentOption === "pay-later"
                              ? "Creating Booking..."
                              : "Processing Payment..."}
                      </div>
                    ) : isRecurringPayment ? (
                      <div className="flex items-center justify-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay ₹{getFinalPrice()} for Session #
                        {recurringBookingDetails?.sequence_number || recurringBookingDetails?.sequenceNumber || ""}
                      </div>
                    ) : isExistingBooking ? (
                      <div className="flex items-center justify-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay ₹{getFinalPrice()} Securely
                      </div>
                    ) : paymentOption === "pay-later" ? (
                      <div className="flex items-center justify-center">
                        <Clock className="h-5 w-5 mr-2" />
                        {(() => {
                          const sessions = Number.parseInt(searchParams?.get("sessions") || "1")
                          return sessions > 1 ? `Create ${sessions} Sessions (Pay Later)` : `Create Booking (Pay Later)`
                        })()}
                      </div>
                    ) : !razorpayLoaded ? (
                      "Loading Payment System..."
                    ) : (
                      <div className="flex items-center justify-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        {(() => {
                          const sessions = Number.parseInt(searchParams?.get("sessions") || "1")
                          return sessions > 1
                            ? `Pay ₹${getFinalPrice()} for ${sessions} Sessions`
                            : `Pay ₹${getFinalPrice()} Securely`
                        })()}
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <div className="lg:col-span-1">
                <Card className="border-0 shadow-lg bg-zubo-background/50 mt-6">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-zubo-text mb-2">Need Help?</h4>
                    <p className="text-sm text-gray-600 mb-3">Our support team is available 24/7</p>

                    <a
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918123168861"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white bg-transparent"
                      >
                        Contact Support
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={couponSheetOpen} onOpenChange={setCouponSheetOpen}>
        <SheetContent side="bottom" className="h-[400px] bg-white">
          <SheetHeader>
            <SheetTitle className="flex items-center text-zubo-text">
              <Tag className="mr-2 h-5 w-5 text-zubo-primary" />
              Apply Coupon Code
            </SheetTitle>
          </SheetHeader>

          <div className="py-6 space-y-4">
            <div>
              <Label htmlFor="coupon-input" className="text-sm font-medium text-zubo-text mb-2 block">
                Enter Coupon Code
              </Label>
              <div className={`transition-transform duration-150 ${shakeAnimation ? "animate-shake" : ""}`}>
                <Input
                  id="coupon-input"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    if (couponError) setCouponError("")
                  }}
                  placeholder="Enter coupon code"
                  className={`border-zubo-background-300 focus:border-zubo-primary focus:ring-zubo-primary transition-colors ${couponError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                  disabled={couponLoading}
                />
              </div>
              {couponError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-fade-in">
                  <X className="h-4 w-4" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            <div className="bg-zubo-background/50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Booking Amount:</span>
                <span className="font-medium">₹{originalPrice || servicePrice}</span>
              </div>
            </div>
          </div>

          <SheetFooter className="gap-3">
            <SheetClose asChild>
              <Button
                variant="outline"
                disabled={couponLoading}
                onClick={() => {
                  setCouponError("")
                  setCouponCode("")
                }}
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              onClick={validateCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="bg-zubo-primary hover:bg-zubo-primary/90"
            >
              {couponLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Validating...
                </div>
              ) : (
                "Apply Coupon"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={policySheetOpen} onOpenChange={setPolicySheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="flex items-center text-zubo-text">
              <FileText className="mr-2 h-5 w-5 text-zubo-primary" />
              Refund & Cancellation Policy
            </SheetTitle>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {policyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-zubo-primary border-t-transparent"></div>
              </div>
            ) : policyData ? (
              <>
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-zubo-primary/10 to-zubo-highlight-1/10 border-b border-zubo-primary/20">
                    <CardTitle className="flex items-center gap-3 text-zubo-text">
                      <div className="w-10 h-10 rounded-lg bg-zubo-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-zubo-primary" />
                      </div>
                      <div>
                        <span className="font-semibold">{policyData.name}</span>
                        <div className="text-sm text-gray-600 font-normal">
                          Effective from {format(new Date(policyData.effectiveFrom), "PPP")}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {policyData.description && (
                    <CardContent className="p-6">
                      <p className="text-gray-700 leading-relaxed">{policyData.description}</p>
                    </CardContent>
                  )}
                </Card>

                <div>
                  <h4 className="font-semibold text-zubo-text mb-4">Refund Schedule</h4>
                  <div className="space-y-4">
                    {policyData.rules.map((rule: any) => (
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
                                  <div className="text-sm text-gray-600">{getRefundLabel(rule.refundPercent)}</div>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-zubo-accent/10 to-zubo-accent/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-zubo-text text-base">
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
                          <strong>Important:</strong> Contact our customer service team within 24 hours of the service
                          with details (description, photos, videos) to be eligible for a quality-based refund.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-r from-zubo-primary/10 to-zubo-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-zubo-text text-base">
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

                {/* <Card className="border-0 shadow-lg bg-gradient-to-r from-zubo-highlight-1/10 to-zubo-highlight-1/20">
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
                        size="sm"
                        onClick={() => window.open("mailto:care@zubopets.com", "_blank")}
                        className="border-zubo-highlight-1 text-zubo-highlight-1 hover:bg-zubo-highlight-1 hover:text-white bg-transparent"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        care@zubopets.com
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
                </Card> */}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Failed to load cancellation policy. Please try again.
              </div>
            )}
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline" className="w-full bg-transparent">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default PaymentPage
