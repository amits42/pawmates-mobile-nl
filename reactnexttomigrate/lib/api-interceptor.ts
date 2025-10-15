import { getStoredToken, getStoredUser } from "@/lib/auth"

let originalFetch: typeof fetch | undefined

// API interceptor that adds JWT tokens to requests
function interceptedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window === "undefined") {
    throw new Error("interceptedFetch should only be called on the client")
  }

  originalFetch = originalFetch || window.fetch

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

  const isApiCall = url.startsWith("/api/")

  if (!isApiCall) {
    return originalFetch(input, init)
  }

  console.log("🔄 API Interceptor: Intercepting request to", url)

  const token = getStoredToken()
  const user = getStoredUser()

  const headers = new Headers(init?.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
    console.log("🔐 API Interceptor: Added Authorization header")
  } else {
    console.log("⚠️ API Interceptor: No token available")
  }

  const newInit: RequestInit = {
    ...init,
    headers,
  }

  console.log(
    "📤 API Interceptor: Making request with headers:",
    Object.fromEntries(headers.entries())
  )

  return originalFetch(input, newInit)
}

// Install the interceptor safely
export function installAPIInterceptor() {
  if (typeof window !== "undefined" && window.fetch !== interceptedFetch) {
    console.log("🚀 Installing API interceptor")
    originalFetch = window.fetch
    window.fetch = interceptedFetch
  }
}

// Uninstall the interceptor if needed
export function uninstallAPIInterceptor() {
  if (typeof window !== "undefined" && originalFetch) {
    console.log("🛑 Uninstalling API interceptor")
    window.fetch = originalFetch
  }
}
