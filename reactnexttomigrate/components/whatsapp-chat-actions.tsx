"use client"

import { toast } from "sonner"

interface ChatActionsProps {
  phoneNumber: string
  petSitterPhoneNumber?: string
}

export const handleChatWithUs = async (phoneNumber: string) => {
  const encodedPhoneNumber = encodeURIComponent(phoneNumber)
  const message = encodeURIComponent("Hi! I'm interested in learning more about your services.")
  const whatsappURL = `https://wa.me/${encodedPhoneNumber}?text=${message}`

  try {
    window.open(whatsappURL, "_blank")
    toast({
      title: "Chat Started! 🎉",
      description: "Check your WhatsApp to continue.",
    })
  } catch (error) {
    console.error("Error opening WhatsApp:", error)
    toast.error("Could not open WhatsApp. Please try again.")
  }
}

export const handleChatWithSitter = async (phoneNumber: string, petSitterPhoneNumber?: string) => {
  if (!petSitterPhoneNumber) {
    toast.error("Zubo Walkers phone number is not available.")
    return
  }

  const encodedPhoneNumber = encodeURIComponent(petSitterPhoneNumber)
  const message = encodeURIComponent("Hi! I'm interested in discussing the pet sitting service.")
  const whatsappURL = `https://wa.me/${encodedPhoneNumber}?text=${message}`

  try {
    window.open(whatsappURL, "_blank")
    toast({
      title: "Zubo Walkers Chat Started! 🎉",
      description: "Check your WhatsApp for setup messages. This creates a 3-way chat with your Zubo Walkers.",
    })
  } catch (error) {
    console.error("Error opening WhatsApp:", error)
    toast.error("Could not open WhatsApp. Please try again.")
  }
}

const WhatsAppChatActions = ({ phoneNumber, petSitterPhoneNumber }: ChatActionsProps) => {
  return (
    <>
      <button onClick={() => handleChatWithUs(phoneNumber)}>Chat with Us</button>
      {petSitterPhoneNumber && (
        <button onClick={() => handleChatWithSitter(phoneNumber, petSitterPhoneNumber)}>Chat with Zubo Walkers</button>
      )}
    </>
  )
}

export default WhatsAppChatActions
