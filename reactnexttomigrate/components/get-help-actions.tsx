"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Mail, HelpCircle, Upload, X } from "lucide-react"

interface GetHelpActionsProps {
  booking: {
    id: number | string
    service_name?: string
    pet_name?: string
    service_date?: string
    service_time?: string
    status?: string
    total_amount?: number
  }
  userPhone?: string
  userAlias?: string
}

export default function GetHelpActions({ booking, userPhone, userAlias = "Pet Owner" }: GetHelpActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [helpType, setHelpType] = useState<"whatsapp" | "email">("whatsapp")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      setAttachedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setAttachedImage(null)
    setImagePreview(null)
  }

  const handleWhatsAppHelp = async () => {
    setIsLoading(true)

    try {
      // Create direct WhatsApp message with booking details
      const message = `Hi! I need help with my booking:

📋 *Booking Details:*
• Booking ID: #${booking.id}
• Service: ${booking.service_name || "Pet Care Service"}
• Pet: ${booking.pet_name || "My Pet"}
• Date: ${booking.service_date ? new Date(booking.service_date).toLocaleDateString() : "Not specified"}
• Time: ${booking.service_time || "Not specified"}
• Status: ${booking.status || "Unknown"}
• Amount: ₹${booking.total_amount || "Not specified"}

Please assist me with this booking. Thank you!`

      // Get admin WhatsApp number from environment
      const adminWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_SUPPORT || "918892743780"

      // Create WhatsApp URL with pre-filled message
      const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(message)}`

      // Open WhatsApp directly
      window.open(whatsappUrl, "_blank")

      toast({
        title: "Opening WhatsApp! 📱",
        description: "You'll be redirected to WhatsApp with your booking details pre-filled.",
      })

      setIsOpen(false)
    } catch (error) {
      console.error("Error opening WhatsApp:", error)
      toast({
        title: "Failed to open WhatsApp",
        description: "Please try again or contact support directly.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailHelp = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both subject and message",
        variant: "destructive",
      })
      return
    }

    // For now, just show a message that email functionality will be implemented
    toast({
      title: "Email functionality coming soon",
      description: "Email support will be available once SMTP is configured",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(true)
          }}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Get Help
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Get Help & Support
          </DialogTitle>
          <DialogDescription>Choose how you'd like to get help for booking #{booking.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={helpType}
            onValueChange={(value) => setHelpType(value as typeof helpType)}
            disabled={isLoading}
          >
            {/* WhatsApp Help Option */}
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 border-green-200 bg-green-50">
              <RadioGroupItem value="whatsapp" id="whatsapp-help" />
              <Label htmlFor="whatsapp-help" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">WhatsApp Support</div>
                    <div className="text-sm text-green-700">Instant chat with our admin support team</div>
                  </div>
                </div>
              </Label>
            </div>

            {/* Email Help Option */}
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 border-blue-200 bg-blue-50">
              <RadioGroupItem value="email" id="email-help" />
              <Label htmlFor="email-help" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-800">Email Support</div>
                    <div className="text-sm text-blue-700">Send detailed message with attachments</div>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* WhatsApp Help Content */}
          {helpType === "whatsapp" && (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">WhatsApp Admin Support</h4>
                <p className="text-sm text-green-700 mb-3">
                  Start a direct WhatsApp chat with our admin support team. We'll help you with any booking-related
                  questions or issues.
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Instant responses during business hours</li>
                  <li>• Share photos and documents easily</li>
                  <li>• Your phone number stays private</li>
                  <li>• Chat history saved in WhatsApp</li>
                </ul>
              </div>
            </div>
          )}

          {/* Email Help Content */}
          {helpType === "email" && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Email Support</h4>
                <p className="text-sm text-blue-700">
                  Send us a detailed message about your issue. Include screenshots or documents if needed.
                </p>
              </div>

              <div>
                <Label htmlFor="help-subject">Subject *</Label>
                <Input
                  id="help-subject"
                  placeholder="Brief description of your issue"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="help-message">Message *</Label>
                <Textarea
                  id="help-message"
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Attach Image (Optional)</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Attachment preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <Label
                        htmlFor="help-image-upload"
                        className="cursor-pointer text-sm text-gray-600 hover:text-gray-800"
                      >
                        Click to upload an image (Max 10MB)
                      </Label>
                      <Input
                        id="help-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={helpType === "whatsapp" ? handleWhatsAppHelp : handleEmailHelp}
              disabled={isLoading || (helpType === "email" && (!emailSubject.trim() || !emailMessage.trim()))}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {helpType === "whatsapp" ? "Starting chat..." : "Sending email..."}
                </>
              ) : (
                <>
                  {helpType === "whatsapp" ? (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {helpType === "whatsapp" ? "Start WhatsApp Chat" : "Send Email"}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
