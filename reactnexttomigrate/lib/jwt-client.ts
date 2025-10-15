interface JWTPayload {
  exp: number
  iat: number
  [key: string]: any
}

/**
 * Decodes a JWT token (header.payload.signature) **without** verifying the
 * signature.  Suitable for client-side expiry checks.
 */
export function decodeJWTToken(token: string): JWTPayload | null {
  try {
    const [, base64Payload] = token.split(".")
    if (!base64Payload) return null

    // base64url → base64
    const base64 = base64Payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(base64)
    return JSON.parse(json) as JWTPayload
  } catch (error) {
    console.error("Error decoding JWT token:", error)
    return null
  }
}

/**
 * Returns true iff the token has **not** expired.
 * NOTE: This does NOT validate the token signature – do that on the server.
 */
export function isValidJWTToken(token: string): boolean {
  const decoded = decodeJWTToken(token)
  if (!decoded || typeof decoded.exp !== "number") return false
  return Date.now() < decoded.exp * 1000
}
