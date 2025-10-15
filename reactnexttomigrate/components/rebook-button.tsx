"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Repeat, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Booking } from "@/types/api"

interface RebookButtonProps {
  booking: Booking
}

export function RebookButton({ booking }: RebookButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRebook = async () => {
    setIsLoading(true)

    try {
      // Create URL parameters with all the booking details
      const params = new URLSearchParams({
        pet: booking.petId,
        service: booking.serviceId,
        // Don't include the old date - let user pick new date
        time: booking.time || "",
        recurring: booking.recurring.toString(),
        rebook: "true",
        originalBookingId: booking.id,
      })

      if (booking.recurring && booking.recurringPattern) {
        params.append("pattern", booking.recurringPattern)
      }

      if (booking.notes) {
        params.append("notes", booking.notes)
      }

      // Navigate to booking page with pre-filled data
      router.push(`/book-service?${params.toString()}`)

      toast({
        title: "Rebooking Started! 🔄",
        description: "Your previous booking details have been loaded. Please select a new date and time.",
      })
    } catch (error) {
      console.error("Error starting rebook:", error)
      toast({
        title: "Failed to start rebook",
        description: "Please try again or create a new booking manually.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-green-600 border-green-300 hover:bg-green-50 font-medium"
      onClick={(e) => {
        e.stopPropagation()
        handleRebook()
      }}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Repeat className="mr-2 h-4 w-4" />
          Rebook
        </>
      )}
    </Button>
  )
}
