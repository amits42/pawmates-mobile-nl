import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { name, email, address, phone } = await request.json()

    if (!name || !email || !address) {
      return NextResponse.json({ success: false, message: "Name, email, and address are required" }, { status: 400 })
    }

    // In a real application, you would save this to a database
    // For now, we'll just return success
    console.log("User onboarding data:", { name, email, address, phone })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name,
        email,
        address,
        phone,
      },
    })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 })
  }
}
