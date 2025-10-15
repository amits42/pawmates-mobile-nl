import Ably from "ably"

let ablyServerClient: Ably.Rest | null = null

export function getAblyServerClient(): Ably.Rest {
  if (!ablyServerClient) {
    ablyServerClient = new Ably.Rest({
      key: process.env.ABLY_API_KEY || "",
    })
  }
  return ablyServerClient
}

// Publish to a SPECIFIC user's channel - this ensures only the target user receives the update
export async function publishServiceUpdate(userId: string, event: string, data: any): Promise<void> {
  try {
    const client = getAblyServerClient()

    // USER-SPECIFIC CHANNEL - only this user will receive the update
    const userChannel = client.channels.get(`booking-updates:${userId}`)

    const payload = {
      ...data,
      userId, // Always include the target user ID for verification
      timestamp: new Date().toISOString(),
    }

    await userChannel.publish(event, payload)

    console.log(`✅ Published ${event} to user-specific channel booking-updates:${userId}`, payload)
  } catch (error) {
    console.error("❌ Failed to publish service update:", error)
  }
}

// Optional: Publish to multiple users (e.g., for group bookings or admin notifications)
export async function publishServiceUpdateToMultipleUsers(userIds: string[], event: string, data: any): Promise<void> {
  try {
    const client = getAblyServerClient()

    // Publish to each user's individual channel
    const publishPromises = userIds.map(async (userId) => {
      const userChannel = client.channels.get(`booking-updates:${userId}`)

      const payload = {
        ...data,
        userId,
        timestamp: new Date().toISOString(),
      }

      return userChannel.publish(event, payload)
    })

    await Promise.all(publishPromises)

    console.log(`✅ Published ${event} to ${userIds.length} user-specific channels`, data)
  } catch (error) {
    console.error("❌ Failed to publish service update to multiple users:", error)
  }
}
