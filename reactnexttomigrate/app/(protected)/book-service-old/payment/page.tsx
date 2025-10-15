"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { CreditCard, Lock, Sparkles, Shield, CheckCircle } from "lucide-react"
import { getStoredUser } from "@/lib/auth"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// Razorpay types
declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const paramsProcessed = useRef(false)
  const [user, setUser] = useState<any>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  const [bookingDetails, setBookingDetails] = useState({
    pet: "",
    service: "",
    date: null as Date | null,
    time: "",
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
      const bookingId = searchParams.get("bookingId");
      const payExisting = searchParams.get("payExisting") === "true";

      if (payExisting && bookingId) {
        // This is an existing booking that needs payment
        console.log("💳 Existing booking payment flow for:", bookingId);
        setIsExistingBooking(true);
      } else {
        // This is a new booking flow
        console.log("💳 New booking payment flow");
        setIsExistingBooking(false);

        const pet = searchParams.get("pet") || "";
        const service = searchParams.get("service") || "";
        const dateStr = searchParams.get("date");
        const time = searchParams.get("time") || "";
        const recurring = searchParams.get("recurring") === "true";
        const pattern = searchParams.get("pattern") || "";
        const endDateStr = searchParams.get("endDate");
        // Get address from params if present
        const address = searchParams.get("address") || null;
        const sessions = Number.parseInt(searchParams?.get("sessions") || "1")

        setBookingDetails({
          pet,
          service,
          date: dateStr ? new Date(dateStr) : null,
          time,
          recurring,
          pattern,
          endDate: endDateStr ? new Date(endDateStr) : null,
        });

        // Store address in a ref for later use in bookingData
        if (address) {
          addressRef.current = address;
        } else {
          addressRef.current = null;
        }

        // Set the price based on recurring or single booking
        if (recurring) {
          fetchServiceDetails(service, true, sessions);

          // For new recurring bookings, you may want to calculate price client-side or fetch from backend if needed
          // For now, leave as is (or fetchServiceDetails if needed)
        } else if (service) {
          // Fetch service details to get the price for single booking
          fetchServiceDetails(service, false);
        }
      }

      const payRecurring = searchParams.get("payRecurring") === "true";
      const recurringBookingIdParam = searchParams.get("recurringBookingId");

      if (payRecurring && recurringBookingIdParam) {
        console.log("💳 Recurring session payment flow for:", recurringBookingIdParam);
        setIsRecurringPayment(true);
        setRecurringBookingId(recurringBookingIdParam);
        fetchSessionDetails(recurringBookingIdParam);
        // All session details will be fetched from backend, not from URL
      }

      paramsProcessed.current = true;
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
      let price = 0;
      if (typeof recurringBookingDetails.session_price === 'number') {
        price = recurringBookingDetails.session_price;
      } else if (typeof recurringBookingDetails.price === 'number') {
        price = recurringBookingDetails.price;
      } else if (typeof recurringBookingDetails.session_price === 'string') {
        price = parseFloat(recurringBookingDetails.session_price);
      } else if (typeof recurringBookingDetails.price === 'string') {
        price = parseFloat(recurringBookingDetails.price);
      }
      console.log('[Recurring Payment] Setting servicePrice:', price, 'from', recurringBookingDetails);
      setServicePrice(price);
    }
  }, [isRecurringPayment, recurringBookingDetails]);

  const fetchExistingBookingDetails = async (bookingId: string) => {
    try {
      console.log("🔍 Fetching existing booking details for:", bookingId)

      // Get user ID for the API call
      const userId = user?.id
      if (!userId) {
        console.log("⏳ User not yet available, will retry when user loads")
        return // Don't throw error, just return - the useEffect will retry
      }

      // Fetch all bookings with user ID parameter
      const queryParams = new URLSearchParams({ userId })
      const response = await fetch(`/api/bookings?${queryParams.toString()}`, {
        headers: {
          "X-User-ID": userId,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bookings")
      }

      const bookings = await response.json()
      const booking = bookings.find((b: any) => b.id === bookingId)

      if (!booking) {
        throw new Error("Booking not found")
      }

      console.log("✅ Found existing booking:", booking)

      setExistingBooking(booking)
      setServicePrice(booking.totalPrice || 0)
      setServiceName(booking.serviceName || "Unknown Service")
      setPetName(booking.petName || "Unknown Pet")

      // Set booking details for display
      setBookingDetails({
        pet: booking.petId,
        service: booking.serviceId,
        date: booking.date ? new Date(booking.date) : null,
        time: booking.time,
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
          const totalPrice = selectedService.price * sessions;
          setServicePrice(totalPrice)
        } else {
          setServicePrice(selectedService.price)
        }
        setServiceName(selectedService.name)
        console.log("💰 Service price loaded:", selectedService.price)
      }
    } catch (error) {
      console.error("❌ Error fetching service details:", error)
      setServicePrice(500) // Fallback price
    }
  }


  // Ref to store address param for new bookings
  const addressRef = useRef<string | null>(null);

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
        if (!bookingDetails.pet || !bookingDetails.service || !bookingDetails.date || !bookingDetails.time) {
          throw new Error("Please complete all booking details")
        }

        // Prepare booking data
        const bookingData: any = {
          petId: bookingDetails.pet,
          serviceId: bookingDetails.service,
          date: bookingDetails.date?.toISOString().split("T")[0],
          time: bookingDetails.time,
          duration: 60,
          totalPrice: servicePrice,
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
          bookingData.addressId = addressRef.current;
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

        const notificationResponse = await fetch("/api/bookings/send-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: result.bookingId,
            isRecurring: bookingDetails.recurring ? true : false,
            serviceOtp: result.serviceOtp,
            startOtp: result.startOtp,
            endOtp: result.endOtp,
            phone: user?.phone,
          }),
        })

        const notificationResult = await notificationResponse.json()
        console.log("📱 Notification result:", notificationResult)

        console.log("✅ Pay-later booking created:", result.bookingId)

        // Redirect to success page with same message as immediate payment
        router.push(`/my-bookings?success=true&bookingId=${result.bookingId}`)
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
          time: recurringBookingDetails.session_time,
          totalPrice: recurringBookingDetails.session_price,
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
          time: existingBooking.time,
          duration: existingBooking.duration || 60,
          totalPrice: existingBooking.totalPrice,
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
        if (!bookingDetails.pet || !bookingDetails.service || !bookingDetails.date || !bookingDetails.time) {
          throw new Error("Please complete all booking details")
        }

        bookingData = {
          petId: bookingDetails.pet,
          serviceId: bookingDetails.service,
          date: bookingDetails.date?.toISOString().split("T")[0],
          time: bookingDetails.time,
          duration: 60,
          totalPrice: servicePrice,
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
          bookingData.addressId = addressRef.current;
        }
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
            router.push(`/my-bookings?success=true&bookingId=${verifyData.bookingId || verifyData.recurringBookingId}`)
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

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zubo-accent-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text flex items-center justify-center">
          <CreditCard className="mr-3 h-8 w-8 text-zubo-accent-600" />
          Secure Payment
          <Sparkles className="ml-3 h-6 w-6 text-zubo-highlight-2-500 animate-bounce" />
        </h1>
        <p className="text-zubo-text-600">Complete your booking payment securely with Razorpay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Summary */}
        <div>
          <Card className="card-hover bg-gradient-to-r from-zubo-primary-50 to-zubo-primary-100 border-zubo-primary-200">
            <CardHeader>
              <CardTitle className="flex items-center text-zubo-primary-800">📋 Booking Summary</CardTitle>
              <CardDescription className="text-zubo-primary-600">Review your booking details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRecurringPayment && recurringBookingDetails ? (
                <>
                  <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                    <span className="font-medium">🔄 Session:</span>
                    <span>#{recurringBookingDetails.sequence_number || recurringBookingDetails.sequenceNumber}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                    <span className="font-medium">📅 Date:</span>
                    <span>
                      {recurringBookingDetails.session_date
                        ? format(new Date(recurringBookingDetails.session_date), "PPP")
                        : "Not scheduled"}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                    <span className="font-medium">⏰ Time:</span>
                    <span>{recurringBookingDetails.session_time}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                    <span className="font-medium">🛠️ Service:</span>
                    <span>{recurringBookingDetails.service_name || recurringBookingDetails.serviceName}</span>
                  </div>
                </>
              ) : (
                <>
                  {bookingDetails.date && (
                    <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                      <span className="font-medium">📅 Date:</span>
                      <span>{format(bookingDetails.date, "PPP")}</span>
                    </div>
                  )}
                  {bookingDetails.time && (
                    <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                      <span className="font-medium">⏰ Time:</span>
                      <span>{bookingDetails.time}</span>
                    </div>
                  )}
                  {serviceName && (
                    <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                      <span className="font-medium">🛠️ Service:</span>
                      <span>{serviceName}</span>
                    </div>
                  )}
                  {petName && (
                    <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                      <span className="font-medium">🐾 Pet:</span>
                      <span>{petName}</span>
                    </div>
                  )}
                  {bookingDetails.recurring && (
                    <>
                      <div className="flex justify-between p-2 bg-zubo-background-50/50 rounded-lg">
                        <span className="font-medium">🔄 Recurring:</span>
                        <span>
                          {bookingDetails.pattern}{" "}
                          {bookingDetails.endDate && `until ${format(bookingDetails.endDate, "PPP")}`}
                        </span>
                      </div>
                      {(() => {
                        const sessions = Number.parseInt(searchParams?.get("sessions") || "1")
                        const singlePrice = servicePrice / sessions
                        return sessions > 1 ? (
                          <div className="p-3 bg-zubo-background-50/70 rounded-lg border border-zubo-primary-200">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">📅 Sessions:</span>
                                <span className="font-bold">{sessions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">💰 Per Session:</span>
                                <span>₹{Math.round(singlePrice)}</span>
                              </div>
                            </div>
                          </div>
                        ) : null
                      })()}
                    </>
                  )}
                </>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold p-3 bg-gradient-to-r from-zubo-accent-100 to-zubo-accent-200 rounded-lg">
                <span>💳 Total Amount:</span>
                <span className="text-zubo-accent-700">₹{servicePrice}</span>
              </div>

              <div className="text-xs text-zubo-primary-700 bg-zubo-primary-100 p-2 rounded">
                💡 Secure payment powered by Razorpay - India's most trusted payment gateway
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div>
          <Card className="card-hover bg-gradient-to-r from-zubo-accent-50 to-zubo-accent-100 border-zubo-accent-200">
            <CardHeader>
              <CardTitle className="flex items-center text-zubo-accent-800">
                <Shield className="mr-2 h-5 w-5" />
                Secure Payment
              </CardTitle>
              <CardDescription className="text-zubo-accent-600">
                Pay securely with Razorpay - supports all payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Only show payment options for new bookings, not for existing or recurring */}
                {!isExistingBooking && !isRecurringPayment && (
                  <div>
                    <h3 className="font-medium text-zubo-accent-800 mb-3">Choose Payment Option</h3>
                    <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="flex flex-col gap-3">
                      <div className="flex items-center space-x-2 p-3 border border-zubo-accent-200 rounded-lg hover:bg-zubo-accent-50">
                        <RadioGroupItem value="pay-now" id="pay-now" />
                        <Label htmlFor="pay-now" className="flex-1 cursor-pointer">
                          <div className="font-medium">Pay Now</div>
                          <div className="text-sm text-zubo-accent-600">
                            Complete payment immediately and confirm booking
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border border-zubo-accent-200 rounded-lg hover:bg-zubo-accent-50">
                        <RadioGroupItem value="pay-later" id="pay-later" />
                        <Label htmlFor="pay-later" className="flex-1 cursor-pointer">
                          <div className="font-medium">Pay Later</div>
                          <div className="text-sm text-zubo-accent-600">
                            Create booking now, pay when service is completed
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-zubo-background-50/50 rounded">
                    <CheckCircle className="h-4 w-4 text-zubo-accent-600" />
                    <span>Credit/Debit Cards</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-zubo-background-50/50 rounded">
                    <CheckCircle className="h-4 w-4 text-zubo-accent-600" />
                    <span>Net Banking</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-zubo-background-50/50 rounded">
                    <CheckCircle className="h-4 w-4 text-zubo-accent-600" />
                    <span>UPI</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-zubo-background-50/50 rounded">
                    <CheckCircle className="h-4 w-4 text-zubo-accent-600" />
                    <span>Wallets</span>
                  </div>
                </div>
              </div>

              <div className="bg-zubo-accent-100 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-zubo-accent-800 font-medium mb-2">
                  <Lock className="h-4 w-4" />
                  <span>Security Features</span>
                </div>
                <ul className="text-sm text-zubo-accent-700 space-y-1">
                  <li>• 256-bit SSL encryption</li>
                  <li>• PCI DSS compliant</li>
                  <li>• No card details stored</li>
                  <li>• Instant refund support</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleRazorpayPayment}
                className="w-full bg-gradient-to-r from-zubo-accent-600 to-zubo-accent-700 hover:from-zubo-accent-700 hover:to-zubo-accent-800 transition-all duration-300 hover:scale-105 shadow-lg"
                disabled={loading || (!razorpayLoaded && (paymentOption === "pay-now" || isExistingBooking))}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zubo-background-50 mr-2"></div>
                    {isRecurringPayment
                      ? "Processing Session Payment..."
                      : isExistingBooking
                        ? "Processing Payment..."
                        : paymentOption === "pay-now"
                          ? "Processing Payment..."
                          : "Creating Booking..."}
                  </>
                ) : isRecurringPayment ? (
                  `💳 Pay ₹${servicePrice} for Session #${recurringBookingDetails?.sequence_number || recurringBookingDetails?.sequenceNumber || ''} ✨`
                ) : isExistingBooking ? (
                  `💳 Pay ₹${servicePrice} Securely ✨`
                ) : paymentOption === "pay-later" ? (
                  (() => {
                    const sessions = Number.parseInt(searchParams?.get("sessions") || "1")
                    return sessions > 1
                      ? `📝 Create ${sessions} Sessions (Pay Later) ✨`
                      : `📝 Create Booking (Pay Later) ✨`
                  })()
                ) : !razorpayLoaded ? (
                  "Loading Payment System..."
                ) : (
                  (() => {
                    const sessions = Number.parseInt(searchParams?.get("sessions") || "1")
                    return sessions > 1
                      ? `💳 Pay ₹${servicePrice} for ${sessions} Sessions ✨`
                      : `💳 Pay ₹${servicePrice} Securely ✨`
                  })()
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
