"use client"

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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, MessageCircle , Phone} from "lucide-react"
import Image from "next/image"


export default function ProtectedFAQPage() {
  const faqSections = [
    {
      id: "safety-trust",
      title: "Safety & Trust",
      icon: <Image src="/landing-icons/policecheck.png" alt="Safety" width={48} height={48} className="h-12 w-12" />,
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
      icon: <Image src="/landing-icons/dog-walk.svg" alt="Walks" width={48} height={48} className="h-12 w-12" />,
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
            "We are happy to walk your dog between 5 am and 10 pm. Please follow the guideline below for booking timings.\n\nFor walks between:\n• 5 am to 12 pm, book by 8 pm the day before\n• 12 pm to 10 pm, book at least 4 hours in advance",
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
        <Image src="/landing-icons/boarding-daycare.svg" alt="Health" width={48} height={48} className="h-12 w-12" />
      ),
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
          alt="Home Access"
          width={48}
          height={48}
          className="h-12 w-12"
        />
      ),
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
      icon: <Image src="/landing-icons/support.png" alt="Support" width={48} height={48} className="h-12 w-12" />,
      questions: [
        {
          id: "payment-plans",
          question: "How do I pay — per walk, or are there monthly plans?",
          answer:
            "You can pay per walk or set a weekly or monthly recurrence. Choose weekdays only, weekends only, or a custom schedule. Please message us any time to adjust your plan.",
        },
        {
          id: "why-endgate",
          question: 'Why do I see "EndGate Technologies Pvt. Ltd." instead of "Zubo Pets" when paying?',
          answer:
            "Zubo Pets is a brand of EndGate Technologies Pvt. Ltd., which is the holding company. Everything you book and experience is with Zubo Pets.",
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
    <div className="min-h-screen bg-gradient-to-br from-zubo-background-50 via-white to-zubo-primary-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zubo-primary-100 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-zubo-primary-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zubo-text-800 mb-4">
            Frequently Asked{" "}
            <span className="text-transparent bg-clip-text gradient-text bg-gradient-to-r from-zubo-primary-600 to-zubo-highlight-1-600">
              Questions
            </span>
          </h1>
          <p className="text-lg text-zubo-text-600 max-w-2xl mx-auto">
            Find answers to common questions about our services, safety, and booking process.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {faqSections.map((section) => (
            <Card key={section.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-zubo-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {section.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold text-zubo-text-800">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((qa) => (
                    <AccordionItem key={qa.id} value={qa.id} className="border-b border-zubo-background-200">
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <span className="font-semibold text-zubo-text-700 pr-4">{qa.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-zubo-text-600 leading-relaxed pb-4 whitespace-pre-line">
                        {qa.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support Card */}
<Card className="mt-12 border-0 shadow-xl bg-gradient-to-r from-zubo-primary-500 to-zubo-primary-600">
  <CardContent className="p-8 text-center text-white">
    <MessageCircle className="h-12 w-12 mx-auto mb-4" />
    <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
    <p className="text-white/90 mb-6">
      We’re here for you 5 am – 10 pm.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
  {/* WhatsApp Button */}
  <a
    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918123168861"}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center px-8 py-3 bg-white text-zubo-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors w-64"
  >
    <WhatsAppIcon className="h-5 w-5 mr-2" />
    Text a Human
  </a>

  {/* Phone Call Button */}
  <a
    href="tel:+918123168861"
    className="inline-flex items-center justify-center px-8 py-3 border border-white text-white text-lg font-semibold rounded-lg hover:bg-white hover:text-zubo-primary bg-white/10 backdrop-blur-sm w-64 transition-colors"
  >
    <Phone className="w-5 h-5 mr-1" />
    Call Us
  </a>
</div>

  </CardContent>
</Card>
      </div>
    </div>
  )
}
