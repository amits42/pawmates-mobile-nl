"use client"
import Image from "next/image"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Shield, Users, MapPin, Phone, Eye, UserCheck, MessageCircle, Stethoscope } from "lucide-react"
import { useState } from "react"
import { Menu } from "lucide-react"
import Footer from "@/components/footer"
import { APPROVED_SOCIETIES } from "@/lib/societies"
import { WaitlistForm } from "@/components/waitlist-form"
import { SocietiesSheet } from "@/components/societies-sheet"

// Custom WhatsApp SVG component
const WhatsAppIcon = ({ size = 24, bgColor = "#25D366", iconColor = "#FFFFFF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill={bgColor} />
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.169-3.495-8.418"
      fill={iconColor}
    />
  </svg>
)
const DogWalkingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" />
    <path d="M22 18h4c1.1 0 2 .9 2 2v8l2 12h-3l-1.5-9L24 40v12h-3V40l-1.5-9L18 40h-3l2-12v-8c0-1.1.9-2 2-2z" />
    <path d="M42 32c-2.2 0-4 1.8-4 4v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4c0-2.2-1.8-4-4-4z" />
    <path d="M38 42v8c0 1.1.9 2 2 2s2-.9 2-2v-8" />
    <path d="M44 42v8c0 1.1.9 2 2 2s2-.9 2-2v-8" />
    <path d="M42 28c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
    <path
      d="M28 32c2 0 4 2 6 4s4 2 6 0c1-1 2-1 3 0s1 3 0 4c-3 3-7 3-10 0s-7-3-10 0c-1 1-1 3 0 4s2 1 3 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const GroomingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    <circle cx="32" cy="28" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M26 24c0-1.1.9-2 2-2s2 .9 2 2" />
    <path d="M34 24c0-1.1.9-2 2-2s2 .9 2 2" />
    <path d="M28 32c1 1 2 1 4 1s3 0 4-1" />
    <path d="M20 20c0-2 2-4 4-2l4 4" />
    <path d="M40 20c0-2 2-4 4-2l4 4" transform="scale(-1,1) translate(-64,0)" />
    <path d="M45 15l3-3c.5-.5 1.3-.5 1.8 0l1.4 1.4c.5.5.5 1.3 0 1.8l-3 3" />
    <path d="M47 13l2 2" />
    <circle cx="18" cy="22" r="1" />
    <circle cx="46" cy="22" r="1" />
  </svg>
)

const VetIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    <path d="M28 16h8v32h-8z" />
    <path d="M16 28h32v8H16z" />
    <path
      d="M20 20c-4 0-8 4-8 8v16c0 2 2 4 4 4h4c2 0 4-2 4-4V28c0-4-2-8-4-8z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M44 20c4 0 8 4 8 8v16c0 2-2 4-4 4h-4c-2 0-4-2-4-4V28c0-4 2-8 4-8z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="18" cy="22" r="2" fill="currentColor" />
    <circle cx="46" cy="22" r="2" fill="currentColor" />
  </svg>
)

const BoardingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    <path d="M12 40h40v12c0 2-2 4-4 4H16c-2 0-4-2-4-4V40z" />
    <path d="M8 40h48l-8-16H16L8 40z" />
    <path d="M32 8l16 16H16L32 8z" />
    <rect x="28" y="44" width="8" height="8" rx="1" />
    <path d="M42 36c2 0 4 2 4 4v4h-4c-1 0-2-1-2-2v-2c0-2 1-4 2-4z" />
    <path d="M44 32c1 0 2 1 2 2v2h-2v-4z" />
    <circle cx="48" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
    <path d="M50 16c1-1 2-1 3 0l2 2" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
)

const TrainingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    <path d="M40 32c-2 0-4 2-4 4v8c0 1 1 2 2 2h4c1 0 2-1 2-2v-8c0-2-2-4-4-4z" />
    <path d="M36 46v6c0 1 1 2 2 2s2-1 2-2v-6" />
    <path d="M42 46v6c0 1 1 2 2 2s2-1 2-2v-6" />
    <circle cx="40" cy="28" r="2" />
    <path d="M40 24c1 0 2-1 2-2v-4c0-1-1-2-2-2s-2 1-2 2v4c0 1 1 2 2 2z" />
    <path d="M20 20v8c0 2 2 4 4 4h4c1 0 2-1 2-2V20c0-2-2-4-4-4h-2c-2 0-4 2-4 4z" />
    <path d="M18 32h8v4h-8z" />
    <path d="M14 28c0-1 1-2 2-2h2v8h-2c-1 0-2-1-2-2v-4z" />
    <path d="M12 24c1-1 2-1 3 0l2 2c1 1 1 2 0 3l-2 2c-1 1-2 1-3 0" />
  </svg>
)

const LiveTrackingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    {/* Map pin outline */}
    <path
      d="M32 8c-8.8 0-16 7.2-16 16 0 12 16 24 16 24s16-12 16-24c0-8.8-7.2-16-16-16z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    {/* Dog collar tag (circle with hole) in center */}
    <circle cx="32" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="24" r="2" fill="currentColor" />
    {/* Signal waves above */}
    <path d="M28 12c2-2 6-2 8 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M26 8c4-4 8-4 12 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M24 4c6-6 10-6 16 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const OnDemandVetIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    {/* Medical cross */}
    <path d="M28 16h8v32h-8z" />
    <path d="M16 28h32v8H16z" />
    {/* Stethoscope integrated into cross */}
    <path
      d="M20 20c-4 0-8 4-8 8v8c0 2 2 4 4 4s4-2 4-4v-8c0-2 2-4 4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M44 20c4 0 8 4 8 8v8c0 2-2 4-4 4s-4-2-4-4v-8c0-2-2-4-4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="16" cy="36" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="48" cy="36" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    {/* Heartbeat line through cross */}
    <path
      d="M20 32h6l2-4 4 8 4-8 2 4h6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const PromptSupportIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    {/* Chat bubble outline */}
    <path
      d="M16 16h32c4 0 8 4 8 8v16c0 4-4 8-8 8H24l-8 8V24c0-4 4-8 8-8z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    {/* Smiley face headset agent */}
    <circle cx="32" cy="28" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="28" cy="26" r="1.5" fill="currentColor" />
    <circle cx="36" cy="26" r="1.5" fill="currentColor" />
    <path d="M28 32c1 2 3 2 4 2s3 0 4-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {/* Headset */}
    <path d="M24 24c0-4 4-8 8-8s8 4 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M22 28h4v4h-4z" rx="1" />
    <path d="M38 28h4v4h-4z" rx="1" />
    {/* Lightning bolt in corner */}
    <path d="M46 18l-3 4h2l-3 4" fill="currentColor" />
  </svg>
)

const TrainedWalkersIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    {/* Person walking */}
    <circle cx="20" cy="12" r="3" />
    <path d="M18 18h4c1 0 2 1 2 2v6l2 10h-2l-2-8-2 8v10h-2V36l-2-8-2 8h-2l2-10v-6c0-1 1-2 2-2z" />
    {/* Dog */}
    <path d="M42 32c-2 0-4 2-4 4v4c0 1 1 2 2 2h4c1 0 2-1 2-2v-4c0-2-2-4-4-4z" />
    <path d="M38 42v6c0 1 1 2 2 2s2-1 2-2v-6" />
    <path d="M44 42v6c0 1 1 2 2 2s2-1 2-2v-6" />
    <circle cx="42" cy="28" r="2" />
    {/* Leash morphing into ribbon/badge */}
    <path d="M24 28c4 0 8 2 12 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M36 32c2 0 4-2 6-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Badge/ribbon symbol */}
    <path d="M48 20l4 4-2 6-4-2-4 2-2-6z" fill="currentColor" />
    <circle cx="50" cy="24" r="2" fill="white" />
  </svg>
)

const VerifiedWalkersIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    {/* Shield outline */}
    <path d="M32 8l-16 4v16c0 12 16 20 16 20s16-8 16-20V12L32 8z" fill="none" stroke="currentColor" strokeWidth="2" />
    {/* Checkmark at center */}
    <path
      d="M24 28l6 6 12-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Subtle dog head silhouette inside shield */}
    <path d="M28 40c0-2 2-4 4-4s4 2 4 4c0 1-1 2-2 2h-4c-1 0-2-1-2-2z" fill="currentColor" opacity="0.3" />
    <circle cx="30" cy="38" r="1" fill="currentColor" opacity="0.3" />
    <circle cx="34" cy="38" r="1" fill="currentColor" opacity="0.3" />
  </svg>
)

export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const teamMembers = [
    {
      name: "Raghav",
      role: "Co-Founder",
      bio: "Pet parent to a pug, Olly. Inspired to start Zubo Pets after realizing the gap in trustworthy pet services. Focused on building the company from the ground up with pets at the center.",
      imageUrl: "/raghav-final-pik.JPG",
    },
    {
      name: "Rahul",
      role: "Co-Founder",
      bio: "Passionate about creating tech-enabled services for urban India. Leads all operations, ensuring every walk runs smoothly and every pet parent feels confident.",
      imageUrl: "/rahul-with-a-dog.JPG",
    },
    {
      name: "Ayyappa",
      role: "Growth Lead",
      bio: "The glue across strategy and execution. Works closely with the founders to drive growth, partnerships, and customer experience.",
      imageUrl: "/ayyappa-with-a-dog.JPG",
    },
  ]

  const howItWorksSteps = [
    {
      title: "Book your walk",
      subtitle: "Select your preferred day and time",
      description: "We share your walker details two hours prior to the walk",
      image: "/Step_1.jpg",
    },
    {
      title: "Meet your Zubo Walker",
      subtitle: "Greet your walker with your pet",
      description: "Get real-time updates via WhatsApp",
      image: "/Step_2.jpg",
    },
    {
      title: "Meet your happy pet at the door",
      subtitle: "Safely greet your pet at the end of walk",
      description: "Review your walk with us!",
      image: "/step_3.jpg",
    },
  ]

  return (
    <div className="min-h-screen bg-zubo-background">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo/zubo-logo.svg"
                alt="ZuboPets"
                width={400}
                height={400}
                className="h-32 w-auto"
                priority
              />
            </div>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#home" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Home
              </Link>
              <Link
                href="#why-choose-us"
                className="text-zubo-text hover:text-zubo-primary transition-colors font-medium"
              >
                Why Choose Zubo Pets
              </Link>
              <Link href="#services" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Services
              </Link>
              <Link
                href="#how-it-works"
                className="text-zubo-text hover:text-zubo-primary transition-colors font-medium"
              >
                How It Works
              </Link>
              <Link
                href="/public-cancellation-policy"
                className="text-zubo-text hover:text-zubo-primary transition-colors font-medium"
              >
                Cancellation Policy
              </Link>
              <Link href="#about" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                About Zubo Pets
              </Link>
              <Link href="/faq" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                FAQ
              </Link>
              <Link href="#contact" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Contact
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white bg-transparent"
                >
                  Login/Sign Up
                </Button>
              </Link>
              <Link href="/book-service">
                <Button className="bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white">
                  Book a Walk
                </Button>
              </Link>
            </div>
            {/* Burger menu for mobile */}
            <button
              className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-zubo-primary"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-8 w-8 text-zubo-primary" />
            </button>
          </div>
        </div>
        {/* Mobile sliding panel */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            <div
              className="absolute inset-0 h-screen bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] h-full min-h-screen bg-white shadow-lg p-6 flex flex-col gap-6 animate-slide-in-right overflow-y-auto">
              <button
                className="absolute top-4 right-4 p-2 rounded focus:outline-none focus:ring-2 focus:ring-zubo-primary"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <span className="text-2xl">&times;</span>
              </button>
              <Link
                href="#home"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Home
              </Link>
              <Link
                href="#why-choose-us"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Why Choose Zubo Pets
              </Link>
              <Link
                href="#services"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Services
              </Link>
              <Link
                href="#how-it-works"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/public-cancellation-policy"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Cancellation Policy
              </Link>
              <Link
                href="#about"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                About Zubo Pets
              </Link>
              <Link
                href="faq"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="#contact"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Contact
              </Link>

              <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white bg-transparent"
                >
                  Login/Sign Up
                </Button>
              </Link>
              <Link href="/book-service" onClick={() => setMobileNavOpen(false)}>
                <Button className="w-full bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white">
                  Book a Walk
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative py-8 lg:py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zubo-primary/10 to-zubo-highlight-2/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-zubo-text mb-6 leading-tight">
                <span className="block sm:inline">Trusted Dog Walking in</span>{" "}
                <span className="text-transparent bg-clip-text gradient-text bg-gradient-to-r from-zubo-primary to-zubo-highlight-2 block sm:inline">
                  Bengaluru
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed text-pretty">
                Verified and trained walkers with live tracking. From ₹149/walk
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                <Link href="/book-service">
                  <Button
                    size="lg"
                    className="bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all w-64"
                  >
                    Book a Walk
                  </Button>
                </Link>
                <Link
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918123168861"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-zubo-primary text-zubo-primary hover:bg-zubo-primary hover:text-white bg-transparent w-64 text-lg font-semibold"
                  >
                    <WhatsAppIcon className="w-5 h-5 mr-2" />
                    Text a Human
                  </Button>
                </Link>
              </div>
              <SocietiesSheet />
              <div className="mt-8 p-4 bg-white/50 rounded-lg backdrop-blur-sm">
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <Badge variant="secondary" className="bg-zubo-accent/20 text-zubo-text border-zubo-accent">
                    <Shield className="w-3 h-3 mr-1" />
                    ₹5,000 Cover
                  </Badge>
                  <Badge variant="secondary" className="bg-zubo-accent/20 text-zubo-text border-zubo-accent">
                    <Eye className="w-3 h-3 mr-1" />
                    Aadhaar Verified
                  </Badge>
                  <Badge variant="secondary" className="bg-zubo-accent/20 text-zubo-text border-zubo-accent">
                    <Stethoscope className="w-3 h-3 mr-1" />
                    On-Demand Vet
                  </Badge>
                  <Badge variant="secondary" className="bg-zubo-accent/20 text-zubo-text border-zubo-accent">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Police Check
                  </Badge>
                  <Badge variant="secondary" className="bg-zubo-accent/20 text-zubo-text border-zubo-accent">
                    <Users className="w-3 h-3 mr-1" />
                    Trained
                  </Badge>
                  <Badge variant="secondary" className="bg-zubo-accent/20 text-zubo-text border-zubo-accent">
                    <Heart className="w-3 h-3 mr-1" />
                    1:1 Care
                  </Badge>
                  <Badge variant="secondary" className="bg-zubo-accent/20 text-zubo-text border-zubo-accent">
                    <MapPin className="w-3 h-3 mr-1" />
                    Live Tracking
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/professional-zubo-walker-in-uniform-walking-dog-in.jpg"
                alt="Zubo walker with dog in Bengaluru"
                width={400}
                height={500}
                className="rounded-2xl shadow-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white" id="why-choose-us">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-zubo-text mb-4 text-balance">Why Choose Zubo Pets?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
              Every walk should feel safe and stress-free. Here’s how we make that happen.
            </p>
          </div>

          <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 hidden">
            {/* Desktop grid layout - existing cards */}
            {/* <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-primary/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-primary rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">Pet Safety First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed mb-4">
                  Our company's DNA is to prioritize your pet's safety above all else. We do this by training our dog
                  walkers, equipping them with extra gear, and partnering with a vet on-demand to ensure your furry
                  friend is always in safe hands.
                </CardDescription>
              </CardContent>
            </Card> */}

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-highlight-1/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                  <Image
                    src="/landing-icons/policecheck.png"
                    alt="ZuboPets"
                    width={400}
                    height={400}
                    className="h-12 w-12"
                    priority
                  />

                  {/* <Shield className="h-6 w-6 text-white" /> */}
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">Police Check</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed mb-4">
                  Each Zubo Walker has obtained a police clearance certificate prior to starting with Zubo Pets.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-accent/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-highlight-2 rounded-lg flex items-center justify-center mb-4">
                  <Image
                    src="/landing-icons/Aadhar-Black2.png"
                    alt="ZuboPets"
                    width={400}
                    height={400}
                    className="h-12 w-12"
                    priority
                  />

                  {/* <UserCheck className="h-6 w-6 text-white" /> */}
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">Aadhaar Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Zubo team verifies the identity of each service provider using Aadhaar and conducts in-person
                  interviews.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-highlight-2/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                  <Image
                    src="/landing-icons/Trained.png"
                    alt="ZuboPets"
                    width={400}
                    height={400}
                    className="h-12 w-12"
                    priority
                  />
                  {/* <TrainedWalkerIcon className="h-12 w-12 text-white" /> */}
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">Trained Walkers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed mb-4">
                  We partner with leading local trainers to ensure each of our dog walker goes through dedicated
                  training to ensure they provide the safest walk for your fur baby
                </CardDescription>
                <Link href="#" className="text-zubo-primary hover:underline text-sm">
                  More About Training
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-primary/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                  <Image
                    src="/landing-icons/vet.svg"
                    alt="ZuboPets"
                    width={400}
                    height={400}
                    className="h-12 w-12"
                    priority
                  />

                  {/* <OnDemandVetIcon className="h-12 w-12 text-white" /> */}
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">On-demand Vet</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed mb-4">
                  While we hope an emergency never occurs during a service, but in the event of the unforeseen
                  circumstance, we have partnered with a local vet to provide on-demand care and consultation
                </CardDescription>
                <Link href="#" className="text-zubo-primary hover:underline text-sm">
                  More About On-Demand Vet
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-highlight-1/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-highlight-1 rounded-lg flex items-center justify-center mb-4">
                  <Image
                    src="/landing-icons/tracking.png"
                    alt="ZuboPets"
                    width={400}
                    height={400}
                    className="h-12 w-12"
                    priority
                  />
                  {/* <LiveTrackingIcon className="h-12 w-12 text-white" /> */}
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">Live Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  All our Zubo Walkers come with a tracking device to track your pet's location during walks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-accent/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                  <Image
                    src="/landing-icons/support.png"
                    alt="ZuboPets"
                    width={400}
                    height={400}
                    className="h-12 w-12"
                    priority
                  />

                  {/* <PromptSupportIcon className="h-12 w-12 text-white" /> */}
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">Prompt Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  We will always ensure you reach our support team with one click; whether via WhatsApp or a Phone call
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-zubo-primary/20 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-zubo-primary rounded-lg flex items-center justify-center mb-4">
                  <OnDemandVetIcon className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-zubo-text">₹5,000 Cover</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed mb-4">
                  All walks with your Zubo Walker are covered for an accidental injury of upto ₹5,000 per incident.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden">
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {/* <Card className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start border-0 shadow-lg bg-gradient-to-br from-zubo-primary/20 to-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-zubo-primary rounded-lg flex items-center justify-center mb-4">
                    <Heart className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-zubo-text leading-tight">Pet Safety First</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed break-words">
                    Our company's DNA is to prioritize your pet's safety above all else through training, extra gear,
                    and vet partnerships.
                  </CardDescription>
                </CardContent>
              </Card> */}

              <Card className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start border-0 shadow-lg bg-gradient-to-br from-zubo-highlight-1/20 to-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                    <Image
                      src="/landing-icons/policecheck.png"
                      alt="ZuboPets"
                      width={400}
                      height={400}
                      className="h-12 w-12"
                      priority
                    />
                    {/* <Shield className="h-6 w-6 text-white" /> */}
                  </div>
                  <CardTitle className="text-lg font-semibold text-zubo-text leading-tight">Police Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed break-words">
                    Each Zubo Walker has obtained a police clearance certificate prior to starting with Zubo Pets.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start border-0 shadow-lg bg-gradient-to-br from-zubo-accent/20 to-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-zubo-highlight-2 rounded-lg flex items-center justify-center mb-4">
                    <Image
                      src="/landing-icons/Aadhar-Black2.png"
                      alt="ZuboPets"
                      width={400}
                      height={400}
                      className="h-12 w-12"
                      priority
                    />{" "}
                  </div>
                  <CardTitle className="text-lg font-semibold text-zubo-text leading-tight">Aadhaar Verified</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed break-words">
                    Zubo team verifies the identity of each service provider using Aadhaar and conducts in-person
                    interviews.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start border-0 shadow-lg bg-gradient-to-br from-zubo-highlight-2/20 to-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                    <Image
                      src="/landing-icons/Trained.png"
                      alt="ZuboPets"
                      width={400}
                      height={400}
                      className="h-12 w-12"
                      priority
                    />

                    {/* <TrainedWalkerIcon className="h-8 w-8 text-white" /> */}
                  </div>
                  <CardTitle className="text-lg font-semibold text-zubo-text leading-tight">Trained Walkers</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed break-words">
                    We partner with leading local trainers to ensure each walker provides the safest walk for your fur
                    baby.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start border-0 shadow-lg bg-gradient-to-br from-zubo-primary/20 to-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                    <Image
                      src="/landing-icons/vet.svg"
                      alt="ZuboPets"
                      width={400}
                      height={400}
                      className="h-12 w-12"
                      priority
                    />

                    {/* <OnDemandVetIcon className="h-12 w-12 text-white" /> */}
                  </div>
                  <CardTitle className="text-lg font-semibold text-zubo-text leading-tight">On-demand Vet</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed break-words">
                    We have partnered with a local vet to provide on-demand care and consultation for emergencies.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start border-0 shadow-lg bg-gradient-to-br from-zubo-highlight-1/20 to-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-zubo-highlight-1 rounded-lg flex items-center justify-center mb-4">
                    <Image
                      src="/landing-icons/tracking.png"
                      alt="ZuboPets"
                      width={400}
                      height={400}
                      className="h-12 w-12"
                      priority
                    />

                    {/* <LiveTrackingIcon className="h-8 w-8 text-white" /> */}
                  </div>
                  <CardTitle className="text-lg font-semibold text-zubo-text leading-tight">Live Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed break-words">
                    Your Zubo Walker shares live location updates on WhatsApp so you always know where they are with
                    your pet.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start border-0 shadow-lg bg-gradient-to-br from-zubo-accent/20 to-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-zubo-accent rounded-lg flex items-center justify-center mb-4">
                    <Image
                      src="/landing-icons/support.png"
                      alt="ZuboPets"
                      width={400}
                      height={400}
                      className="h-12 w-12"
                      priority
                    />

                    {/* <PromptSupportIcon className="h-8 w-8 text-white" /> */}
                  </div>
                  <CardTitle className="text-lg font-semibold text-zubo-text leading-tight">Prompt Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed break-words">
                    We ensure you reach our support team with one click; whether via WhatsApp or a Phone call.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start border-0 shadow-lg bg-gradient-to-br from-zubo-primary/20 to-white">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-zubo-primary rounded-lg flex items-center justify-center mb-4">
                    <OnDemandVetIcon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-zubo-text leading-tight">₹5,000 Cover</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed break-words">
                    All walks with your Zubo Walker are covered for an accidental injury of upto ₹5,000 per incident.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">← More reasons →</p>
          </div>


          <section id="services" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-zubo-text mb-4">Our Services</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Start with dog walking today. More trusted services for your pet are coming soon.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0 border-2 border-zubo-primary">
                  <CardHeader>
                    <div className="w-16 h-16 bg-zubo-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image
                        src="/landing-icons/Walking.png"
                        alt="ZuboPets"
                        width={400}
                        height={400}
                        className="h-12 w-12"
                        priority
                      />
                      {/* <DogWalkingIcon className="h-12 w-12 text-white" /> */}
                    </div>
                    <CardTitle className="text-lg font-semibold text-zubo-text">
                      <Link href="/book-service" className="hover:text-zubo-primary">
                        Dog Walking
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 mb-4">
                      Book a verified, trained, and trusted dog walkers
                    </CardDescription>
                    <Link href="/book-service">
                      <Button className="bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white">
                        Book Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0 opacity-60">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image
                        src="/landing-icons/Grooming.png"
                        alt="ZuboPets"
                        width={400}
                        height={400}
                        className="h-12 w-12"
                        priority
                      />
                      {/* <GroomingIcon className="h-12 w-12 text-white" /> */}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-500">Grooming</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="mb-4">
                      Coming Soon
                    </Badge>
                    <CardDescription className="text-gray-500">
                      Professional grooming services for your pet
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0 opacity-60">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image
                        src="/landing-icons/vet.svg"
                        alt="ZuboPets"
                        width={400}
                        height={400}
                        className="h-12 w-12"
                        priority
                      />
                      {/* <VetIcon className="h-12 w-12 text-white" /> */}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-500">Vet Visits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="mb-4">
                      Coming Soon
                    </Badge>
                    <CardDescription className="text-gray-500">Vet visits and pet healthcare services</CardDescription>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0 opacity-60">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image
                        src="/landing-icons/boarding-daycare.svg"
                        alt="ZuboPets"
                        width={400}
                        height={400}
                        className="h-12 w-12"
                        priority
                      />
                      {/* <BoardingIcon className="h-12 w-12 text-white" /> */}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-500">Boarding & Daycare</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="mb-4">
                      Coming Soon
                    </Badge>
                    <CardDescription className="text-gray-500">Safe boarding and daycare services</CardDescription>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow bg-white border-0 opacity-60">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image
                        src="/landing-icons/training.svg"
                        alt="ZuboPets"
                        width={400}
                        height={400}
                        className="h-12 w-12"
                        priority
                      />
                      {/* <TrainingIcon className="h-12 w-12 text-white" /> */}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-500">Training</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="mb-4">
                      Coming Soon
                    </Badge>
                    <CardDescription className="text-gray-500">Professional pet training services</CardDescription>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center mt-12">
                <p className="text-gray-600 mb-4">Interested in our upcoming services?</p>
                <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg mb-6">
                  <WaitlistForm />
                </div>
                <p className="text-sm text-gray-500">No spamming, promise!</p>
              </div>
            </div>
          </section>

          <section className="py-20 bg-white" id="how-it-works">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-zubo-text mb-4">How It Works</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">From booking to happy tails in 3 simple steps.</p>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  {howItWorksSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-lg cursor-pointer transition-all ${activeStep === index ? "bg-zubo-primary text-white shadow-lg" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      onMouseEnter={() => setActiveStep(index)}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${activeStep === index ? "bg-white text-zubo-primary" : "bg-zubo-primary text-white"
                            }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                          <p
                            className={`font-medium mb-2 ${activeStep === index ? "text-zubo-highlight-1" : "text-zubo-primary"}`}
                          >
                            {step.subtitle}
                          </p>
                          <p className={activeStep === index ? "text-white/90" : "text-gray-600"}>{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Image
                    src={howItWorksSteps[activeStep].image || "/placeholder.svg"}
                    alt={howItWorksSteps[activeStep].title}
                    width={400}
                    height={300}
                    className="rounded-lg shadow-lg object-cover"
                  />
                </div>
              </div>

              <div className="lg:hidden">
                {/* <h2 className="text-3xl font-bold text-zubo-text mb-8 text-center">How It Works</h2> */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                  {howItWorksSteps.map((step, index) => (
                    <div key={index} className="min-w-[300px] flex-shrink-0 snap-start">
                      <Card className="border-0 shadow-lg bg-white h-full">
                        <CardContent className="p-6">
                          <div className="w-8 h-8 bg-zubo-primary text-white rounded-full flex items-center justify-center font-bold mb-4">
                            {index + 1}
                          </div>
                          <Image
                            src={step.image || "/placeholder.svg"}
                            alt={step.title}
                            width={250}
                            height={180}
                            className="rounded-lg object-contain w-full h-64 mb-4 bg-gray-50"
                          />
                          <h3 className="text-xl font-semibold text-zubo-text mb-2">{step.title}</h3>
                          <p className="font-medium text-zubo-primary mb-2">{step.subtitle}</p>
                          <p className="text-gray-600 text-sm">{step.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-4 space-x-2">
                  {howItWorksSteps.map((_, index) => (
                    <div key={index} className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">← See All Steps →</p>
              </div>

              <div className="text-center mt-12">
                <Link href="/book-service">
                  <Button
                    size="lg"
                    className="bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white px-8 py-3 text-lg font-semibold"
                  >
                    Book a Walk
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gray-50 hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-zubo-text mb-8 text-balance">
                  What Pet Parents Say
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">Real experiences from our happy customers</p>
              </div>
              {/* Testimonials will be added after beta walks */}
            </div>
          </section>

          <section id="about" className="py-20 bg-zubo-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-zubo-text mb-8 text-balance">About Zubo Pets</h2>
                <div className="max-w-4xl mx-auto text-lg text-gray-600 leading-relaxed space-y-6">
                  <p className="text-pretty">
                    Zubo Pets is brought to you by the founding team of{" "}
                    <Link
                      href="https://www.foodclock.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zubo-highlight-2 hover:text-white transition-colors underline"
                    >
                      Food Clock
                    </Link>
                    , a corporate food solution start-up recognized by{" "}
                    <Link
                      href="https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/ListofStartups_03112023.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zubo-highlight-2 hover:text-white transition-colors underline"
                    >
                      DPIIT, Government of India
                    </Link>{" "}
                    for its innovation. Currently, Food Clock serves clients such as Gartner, Ernst & Young, CRED,
                    Talent Sprint, Delivery, Zoom Car, Redbus, Rubrik, Polaris, Total Energies, Livspace, and 50+
                    companies.
                    <br />
                    <br />
                    At Zubo Pets, we're on a mission to make pet care truly trustworthy. We know how hard it can be for
                    pet parents to find professionally trained and reliable caretakers consistently. That's why every
                    Zubo Pets walker goes through police clearance checks, Aadhaar verification, and professional
                    training. We also provide financial coverage for unforeseen medical circumstances and live tracking
                    for complete peace of mind. For us, your pets always come first.
                    <br />
                    <br />
                  </p>

                  <p className="text-pretty">
                    The idea was born from personal experience. Our co-founder's journey of caring for his dog showed us
                    how much stress pet parents go through to find dependable help. We built Zubo Pets to change that.
                  </p>
                </div>
              </div>

              <div className="mb-16">
                <h3 className="text-2xl font-bold text-zubo-text text-center mb-12">Our Team</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {teamMembers.map((member, index) => (
                    <Card
                      key={index}
                      className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-zubo-background text-center"
                    >
                      <CardContent className="p-6">
                        <Image
                          src={member.imageUrl || "/placeholder.svg"}
                          alt={member.name}
                          width={150}
                          height={150}
                          className="rounded-full object-cover w-32 h-32 mx-auto mb-4 border-4 border-zubo-highlight-1 shadow-md"
                        />
                        <CardTitle className="text-xl font-semibold text-zubo-primary mb-1">{member.name}</CardTitle>
                        <p className="text-zubo-accent font-medium mb-3">{member.role}</p>
                        <CardDescription className="text-zubo-text leading-relaxed text-pretty">
                          {member.bio}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-zubo-background inline-block">
                  <CardContent className="p-6">

                    <CardTitle className="text-xl font-semibold text-zubo-primary mb-3">Developer and Designer</CardTitle>
                    <CardDescription className="text-zubo-text leading-relaxed text-pretty">
                      Talented minds behind our platform and brand experience that bring Zubo Pets to life with
                      technology and design that make pet care seamless.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-20 bg-zubo-primary">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Ready to Give Your Pet the Best Care?</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join pet parents who trust Zubo Pets for their dog walking needs. Get started today and find the perfect
                walker for your furry friend.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/book-service">
                  <Button
                    size="lg"
                    className="bg-white text-zubo-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold w-64"
                  >
                    Book a Walk
                  </Button>
                </Link>
                <Link
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918123168861"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-zubo-primary px-8 py-3 text-lg font-semibold bg-white/10 backdrop-blur-sm w-64"
                  >
                    <WhatsAppIcon size={24} />
                    Text a Human
                  </Button>
                </Link>
                <Link href="tel:+91-8123168861">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-zubo-primary px-8 py-3 text-lg font-semibold bg-white/10 backdrop-blur-sm w-64"
                  >
                    <Phone className="w-5 h-5 mr-1 -m3-3" />
                    Call Us
                  </Button>
                </Link>
              </div>
              <p className="text-white/90 text-sm">We’re here for you 5 am – 10 pm</p>
            </div>
          </section>

          <Footer />
        </div>
      </section>
    </div>
  )
}
