import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dklsjh786324#8362f")

// Paths that don't require authentication
const PUBLIC_PATHS = [
  "/api/auth/send-otp",
  "/api/send-contact-email",
  "/api/auth/verify-otp",
  "/api/sitters/verify-otp",
  "/api/company/details",
  "/api/services",
  "/api/caretakers",
  "/api/test-db",
  "/api/waitlist/submit",
  "/api/verify-token",
  "/api/cancellation-policy",
  "/api/user/onboarding",
  "/api/check-upcoming-booking",
  // Webhook paths (exclude from JWT verification)
  "/api/payment/webhook",
  "/api/twilio/webhook",
  "/api/check-booking-reminders",
  "/api/cron/deactivate-old-chat-rooms",
  "/api/check-payment-reminders"
  // Any other public endpoints
]

// Patterns to exclude from JWT verification
const EXCLUDED_PATTERNS = [
  /^\/api\/payment\/webhook/, // Razorpay webhooks
  /^\/api\/twilio\/webhook/, // Twilio webhooks
  /^\/api\/whatsapp/, // WhatsApp related endpoints
  /^\/api\/admin/, // Admin endpoints (might have different auth)
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for non-API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Check if path is in public paths (no auth required)
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Check if path matches excluded patterns
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(pathname))) {
    console.log(`🚫 Skipping JWT verification for excluded path: ${pathname}`)
    return NextResponse.next()
  }

  // Get Authorization header
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log(`❌ Missing or invalid Authorization header for: ${pathname}`)
    return NextResponse.json(
      { error: "Authentication required", message: "Missing or invalid Authorization header" },
      { status: 401 },
    )
  }

  const token = authHeader.substring(7) // Remove "Bearer " prefix

  try {
    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)


    // Add user info to headers for API routes to use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", payload.userId as string)
    requestHeaders.set("x-user-phone", payload.phone as string)
    requestHeaders.set("x-user-type", payload.userType as string)

    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.log(`❌ JWT verification failed for path: ${pathname}`, error)
    return NextResponse.json({ error: "Invalid token", message: "JWT verification failed" }, { status: 401 })
  }
}

export const config = {
  matcher: [
    /*
     * Match all API routes except:
     * - Static files
     * - Image optimization files
     * - Favicon
     */
    "/api/:path*",
  ],
}
