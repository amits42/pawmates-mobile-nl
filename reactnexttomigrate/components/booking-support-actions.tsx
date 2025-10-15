"use client"

import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface BookingSupportActionsProps {
  booking: {
    id: number | string
  }
  variant?: "button" | "dropdown"
}

export default function BookingSupportActions({ booking }: BookingSupportActionsProps) {
  const router = useRouter()

  const handleGetHelp = () => {
    router.push(`/support?bookingId=${booking.id}`)
  }

  return (
    <Button
      onClick={handleGetHelp}
      variant="outline"
      size="sm"
      className="text-blue-600 border-blue-300 hover:bg-blue-50"
    >
      <HelpCircle className="mr-2 h-4 w-4" />
      Get Help
    </Button>
  )
}
