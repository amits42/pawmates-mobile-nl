import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dklsjh786324#8362f")

export interface JWTPayload {
  userId: string
  phone: string
  userType: "OWNER" | "SITTER"
}

// SERVER-SIDE: Create JWT token (only used in API routes)
export async function createJWTToken(payload: JWTPayload): Promise<string> {
  try {
    const token = await new SignJWT({
      userId: payload.userId,
      phone: payload.phone,
      userType: payload.userType,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1y") // 1 year expiry
      .sign(JWT_SECRET)

    return token
  } catch (error) {
    console.error("❌ Error creating JWT token:", error)
    throw new Error("Failed to create JWT token")
  }
}

// SERVER-SIDE: Verify JWT token (only used in API routes)
export async function verifyJWTToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      userId: payload.userId as string,
      phone: payload.phone as string,
      userType: payload.userType as "OWNER" | "SITTER",
    }
  } catch (error) {
    console.error("❌ Error verifying JWT token:", error)
    return null
  }
}
