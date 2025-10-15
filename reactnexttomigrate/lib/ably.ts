import Ably from "ably"

let ablyClient: Ably.Realtime | null = null

export function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({
      key: process.env.NEXT_PUBLIC_ABLY_KEY || "",
      clientId: typeof window !== "undefined" ? `user_${Date.now()}` : undefined,
    })
  }
  return ablyClient
}

export function getAblyChannel(channelName: string): Ably.RealtimeChannel {
  const client = getAblyClient()
  return client.channels.get(channelName)
}

// Channel names - USER-SPECIFIC channels for security and efficiency
export const CHANNELS = {
  // Each user gets their own private channel for booking updates
  BOOKING_UPDATES: (userId: string) => `booking-updates:${userId}`,
  // Optional: Service-specific channel for detailed updates
  SERVICE_UPDATES: (bookingId: string) => `service-updates:${bookingId}`,
} as const

// Event types
export const EVENTS = {
  SERVICE_STARTED: "service:started",
  SERVICE_ENDED: "service:ended",
  BOOKING_STATUS_CHANGED: "booking:status_changed",
} as const

export type ServiceUpdateEvent = {
  bookingId: string
  sessionId?: string
  status: "ONGOING" | "COMPLETED"
  startedAt?: string
  endedAt?: string
  sitterName?: string
  petName?: string
  service?: string
  userId: string // Ensure we always include the target user ID
}

export type BookingUpdateEvent = {
  bookingId: string
  status: string
  updatedAt: string
  userId: string
}
