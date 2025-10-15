"use client"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, MessageCircle, Phone, Mail, Clock } from "lucide-react"
import { useState } from "react"
import Footer from "@/components/footer"

// Custom WhatsApp SVG component
const WhatsAppIcon = ({ size = 24, bgColor = "#25D366", iconColor = "#FFFFFF" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="12" fill={bgColor} />
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.169-3.495-8.418" fill={iconColor} />
  </svg>
);

// Custom icons from base page for FAQ sections
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

const OnDemandVetIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    {/* Medical cross */}
    <path d="M28 16h8v32h-8z" />
    <path d="M16 28h32v8H16z" />
    {/* Stethoscope integrated into cross */}
    <path
      d="M20 20c-4 0-8 4-8 8v8c0 2 2 4 4 4s4-2 4-4v-8c0-2-2-4-4-4"
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

export default function FAQPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({})
  const [openQuestions, setOpenQuestions] = useState<{ [key: string]: boolean }>({})

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const toggleQuestion = (questionId: string) => {
    setOpenQuestions((prev) => {
      // Close all other questions when opening a new one
      const newState: { [key: string]: boolean } = {}
      Object.keys(prev).forEach((key) => {
        newState[key] = false
      })
      newState[questionId] = !prev[questionId]
      return newState
    })
  }

  const faqSections = [
    {
      id: "safety-trust",
      title: "Safety & Trust",
      icon: (
        <Image
          src="/landing-icons/policecheck.png"
          alt="ZuboPets"
          width={400}
          height={400}
          className="h-12 w-12"
          priority
        />
      ), //<VerifiedWalkersIcon className="w-8 h-8 text-white" />,
      questions: [
        {
          id: "same-walker",
          question: "Do I get the same walker every time? What if they can't make it?",
          answer:
            "Yes, your Zubo Walker stays consistent. If they are unavailable, we will assign a trusted backup and share their profile before the walk so there are no surprises.",
        },
        {
          id: "walker-safety",
          question: "How do I know the walker is safe? Are they verified or trained?",
          answer:
            "Your Zubo Walker is Aadhaar verified, holds a Police Clearance Certificate, and trains with a professional trainer. Refresher courses are conducted from time to time. We share a link to their profile ahead of the walk (with all details).",
        },
        {
          id: "insurance-cover",
          question: "Does your service offer medical accidental protection?",
          answer:
            "Yes. If an injury occurs during a Zubo walk, we support vet bills for your pet up to ₹5,000 per incident. We also carry cover for walker injury and third-party property damage.",
        },
      ],
    },
    {
      id: "walks-scheduling",
      title: "Walks & Scheduling",
      icon: (
        <Image
          src="/landing-icons/dog-walk.svg"
          alt="ZuboPets"
          width={400}
          height={400}
          className="h-12 w-12 text-white"
          priority
        />
      ), //<LiveTrackingIcon className="w-8 h-8 text-white" />,
      questions: [
        {
          id: "walk-duration",
          question: "How long are the walks? Can I change frequency or add extra ones?",
          answer:
            "Standard walks are ~ 45 minutes. You can change frequency or add extra walks by booking a recurring walk with us. Please message support if you need help.",
        },
        {
          id: "live-tracking",
          question: "Do I get live tracking or photos during the walk?",
          answer: "Yes. You receive live tracking and time-stamped photo updates from your Zubo Walker.",
        },
        {
          id: "meet-walker",
          question: "Can I meet the walker beforehand?",
          answer:
            "Yes. We share your Zubo Walker's profile before the walk. A quick meet and greet at handoff is welcome.",
        },
        {
          id: "off-leash",
          question: "Do you ever go off-leash or to dog parks?",
          answer:
            "Leash only for safety. If you prefer a visit to a vetted, enclosed dog park, please request it in advance.",
        },
        {
          id: "equipment",
          question: "Who provides the leash or harness and poop bags?",
          answer:
            "Please provide your dog's usual leash or harness for comfort. Your Zubo Walker carries backup gear and poop bags.",
        },
        {
          id: "training-cues",
          question: "Will you reinforce our training cues (heel or sit)?",
          answer:
            "Yes. Your Zubo Walker can reinforce your cues on request. The walk is primarily focused on safe exercise rather than formal training.",
        },
        {
          id: "booking-timing",
          question: "What's the cutoff for same-day or ASAP bookings? Early-morning or late-night walks?",
          answer:
            "We are happy to walk your dog between 5 am and 10 pm. Please follow the guideline below for booking timings.\n\nFor walks between:\n• 5 am to 12 pm, book by 8 pm the day before\n• 12 pm to 10 pm, book at least 4 hours in advance.",
        },
        {
          id: "plan-changes",
          question: "What if my plans change?",
          answer: (
            <>
              For your first rescheduling, please contact us and we’ll change your booking at no extra cost. After that, standard policies apply.{" "}
              
            </>
          ),
        },
        {
          id: "multiple-dogs",
          question: "Will the walker handle multiple dogs during a walk, or is it always one-on-one?",
          answer:
            "Walks are 1:1 for safety and focus. If you want two dogs from the same home walked together, please contact support. A 25% surcharge is added to the total cost.",
        },
      ],
    },
    {
      id: "health-behavior",
      title: "Health, Behavior & Emergencies",
      icon: (
        <Image
          src="/landing-icons/boarding-daycare.svg"
          alt="ZuboPets"
          width={400}
          height={400}
          className="h-12 w-12"
          priority
        />
      ), //<OnDemandVetIcon className="w-8 h-8 text-white" />,
      questions: [
        {
          id: "dog-injury",
          question: "What if my dog gets hurt during the walk?",
          answer:
            "Your Zubo Walker is trained in basic pet first aid and can contact a vet on demand, if you or your vet is unreachable. Vet bills are supported up to ₹5,000 per incident (please see details here).",
        },
        {
          id: "anxious-dogs",
          question: "My dog gets anxious or has special needs. Can the walker handle that?",
          answer:
            "Yes. Please add details in your pet profile and message your Zubo Walker in advance so they can plan the route and approach.",
        },
        {
          id: "puppies-seniors",
          question: "Do you take puppies or senior dogs?",
          answer:
            "Yes. Please share mobility or routine needs ahead of the walk and your Zubo Walker will adjust pace, route, and breaks.",
        },
        {
          id: "vaccination-requirements",
          question: "Do you need vaccination or flea or tick proof?",
          answer:
            "Rabies vaccination is required. Please keep medical records updated in your pet profile. Flea and tick prevention is strongly recommended.",
        },
        {
          id: "first-aid-training",
          question: "Are walkers trained in basic pet first aid?",
          answer: "Yes. Your Zubo Walker has first aid training and access to a vet on demand.",
        },
        {
          id: "weather-conditions",
          question: "How do you handle extreme heat or rain?",
          answer:
            "Your Zubo Walker carries a water bottle for your dog and will pace the route as needed. In extreme weather we will check with you to adjust timing, use covered areas or reschedule.",
        },
        {
          id: "dog-incidents",
          question: "If my dog bites or there is a scuffle, what exactly happens next?",
          answer:
            "Your Zubo Walker follows a safety protocol: separate, assess, provide first aid, inform you, and contact a vet if needed.",
        },
        {
          id: "behavioral-issues",
          question: "What if my dog refuses to walk, pulls hard, or tries to run?",
          answer:
            "Your Zubo Walker is trained to manage pulling and reactivity. If safety is at risk, they will return your pet home and update you. Please flag known issues in your pet profile.",
        },
      ],
    },
    {
      id: "home-access",
      title: "Home Access, Society Rules & Privacy",
      icon: (
        <Image
          src="/landing-icons/boarding-daycare.svg"
          alt="ZuboPets"
          width={400}
          height={400}
          className="h-12 w-12"
          priority
        />
      ), //<VerifiedWalkersIcon className="w-8 h-8 text-white" />,
      questions: [
        {
          id: "house-access",
          question: "How does the walker get into my house?",
          answer:
            "We do door-to-door handoffs. Your Zubo Walker will not enter your home. Please provide Pick-up and Drop-off codes for a secure exchange.",
        },
        {
          id: "society-rules",
          question: "Do you follow society's rules or security instructions?",
          answer:
            "Yes. Please message your Zubo Walker with society rules and security instructions and we will follow them.",
        },
        {
          id: "paw-wiping",
          question: "Do you wipe paws before re-entry, especially in monsoon?",
          answer: "Yes, if you ask us to and if your pet is comfortable.",
        },
        {
          id: "privacy-data",
          question: "Who can see my route or photos?",
          answer:
            "Your data is stored securely. We do not sell your data. Live tracking links and photos are shared only with you.",
        },
        {
          id: "multiple-updates",
          question: "Can multiple people get updates on their phones?",
          answer: "We currently support one number per profile.",
        },
      ],
    },
    {
      id: "miscellaneous",
      title: "Miscellaneous Questions",
      icon: (
        <Image
          src="/landing-icons/support.png"
          alt="ZuboPets"
          width={400}
          height={400}
          className="h-12 w-12"
          priority
        />
      ), //<PromptSupportIcon className="w-8 h-8 text-white" />,
      questions: [
        {
          id: "payment-plans",
          question: "How do I pay — per walk, or are there monthly plans?",
          answer:
            "You can pay per walk or set a weekly or monthly recurrence. Choose weekdays only, weekends only, or a custom schedule. Please message us any time to adjust your plan.",
        },
        {
          id: "why-endgate",
          question: "Why do I see “EndGate Technologies” or “Food Clock” when making a payment?",
          answer:
            "Zubo Pets is a brand of EndGate Technologies Pvt. Ltd.. Payments may appear under EndGate or Food Clock (another EndGate business). Your booking and support remain with Zubo Pets, and your payment is processed securely.",
        },
        {
          id: "service-areas",
          question: "Which parts of Bengaluru do you serve?",
          answer:
            "We currently cover select neighborhoods in South Bengaluru. Please see the live list on the site. If you are nearby or outside our zones, please join the waitlist so we can notify you as we expand.",
        },
        {
          id: "tips",
          question: "Do you accept tips?",
          answer:
            "Yes. After each walk you can rate and add a tip. 100% of tips go to your Zubo Walker. Thank you for supporting them.",
        },
        {
          id: "satisfaction-guarantee",
          question: "Any satisfaction guarantee?",
          answer:
            "We strive our best to give you and your pet a wonderful experience. If you feel we fell short, please contact us and we will refund your booking (Terms and Condition Apply. Please click here for more details)",
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-zubo-background">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Image
                  src="/logo/zubo-logo.svg"
                  alt="ZuboPets"
                  width={400}
                  height={400}
                  className="h-32 w-auto"
                  priority
                />
              </Link>
            </div>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Home
              </Link>
              <Link
                href="/#why-choose-us"
                className="text-zubo-text hover:text-zubo-primary transition-colors font-medium"
              >
                Why Choose Us
              </Link>
              <Link href="/#services" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                Services
              </Link>
              <Link
                href="/#how-it-works"
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
              <Link href="/#about" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
                About Zubo Pets
              </Link>
              <Link href="/faq" className="text-zubo-primary font-medium">
                FAQ
              </Link>
              <Link href="/#contact" className="text-zubo-text hover:text-zubo-primary transition-colors font-medium">
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
            {/* Mobile menu button */}
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
                href="/"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/#why-choose-us"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Why Choose Us
              </Link>
              <Link
                href="/#services"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/#how-it-works"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/public-cancellation-policy"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
              >
                Cancellation Policy
              </Link>
              <Link
                href="/#about"
                className="text-zubo-text hover:text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                About Zubo Pets
              </Link>
              <Link
                href="/faq"
                className="text-zubo-primary text-lg font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="/#contact"
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

      {/* Hero Section */}
      <section className="relative py-12 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zubo-primary/10 to-zubo-highlight-2/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-zubo-text mb-6 leading-tight">
            Frequently Asked{" "}
            <span className="text-transparent bg-clip-text gradient-text bg-gradient-to-r from-zubo-primary to-zubo-highlight-2">
              Questions
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed text-pretty max-w-3xl mx-auto">
            Got a question? Here's everything you need to know before booking your walk.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {faqSections.map((section) => (
              <Card
                key={section.id}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-zubo-background/30"
              >
                <CardHeader className="cursor-pointer" onClick={() => toggleSection(section.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-zubo-accent rounded-lg flex items-center justify-center">
                        {section.icon}
                      </div>
                      <CardTitle className="text-xl lg:text-2xl font-bold text-zubo-text">{section.title}</CardTitle>
                    </div>
                    <div className="text-zubo-primary">{openSections[section.id] ? "−" : "+"}</div>
                  </div>
                </CardHeader>

                {openSections[section.id] && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {section.questions.map((qa) => (
                        <div key={qa.id} className="border border-gray-200 rounded-lg">
                          <button
                            className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                            onClick={() => toggleQuestion(qa.id)}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-zubo-text text-pretty pr-4">{qa.question}</h4>
                              <div className="text-zubo-primary flex-shrink-0">{openQuestions[qa.id] ? "−" : "+"}</div>
                            </div>
                          </button>
                          {openQuestions[qa.id] && (
                            <div className="px-4 pb-4">
                              <p className="text-gray-600 leading-relaxed text-pretty whitespace-pre-line">
                                {qa.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
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
            <Link href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918123168861"}`} target="_blank"
              rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-zubo-primary px-8 py-3 text-lg font-semibold bg-white/10 backdrop-blur-sm w-64"
              >
                <WhatsAppIcon className="w-5 h-5 mr-2" />
                Text a Human
              </Button>
            </Link>
            <Link href="tel:+918123168861">
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
  )

}
