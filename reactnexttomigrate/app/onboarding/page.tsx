"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, PawPrintIcon as Paw, Shield, Calendar, Heart } from "lucide-react"

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slides = [
    {
      title: "Welcome to PetCare",
      description:
        "Your trusted companion for premium pet care services. We provide professional care for your beloved pets when you need it most.",
      icon: <Paw className="h-16 w-16 text-blue-600" />,
      image:
        "https://images.unsplash.com/photo-1583511616658-bc05551d0982?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Image of a dog
    },
    {
      title: "Secure & Reliable",
      description:
        "Our verified caretakers are professionals who love pets. Book with confidence knowing your pets are in safe hands.",
      icon: <Shield className="h-16 w-16 text-blue-600" />,
      image:
        "https://images.unsplash.com/photo-1543463122-d2072222192c?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Image of a cat and dog
    },
    {
      title: "Easy Booking",
      description:
        "Book pet care services in minutes. Choose from a variety of services, select your preferred caretaker, and schedule at your convenience.",
      icon: <Calendar className="h-16 w-16 text-blue-600" />,
      image:
        "https://images.unsplash.com/photo-1598133894008-61857ab872dd?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Image of a person with a dog
    },
  ]

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      router.push("/login")
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const goToLogin = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden shadow-lg border-blue-200">
          <div className="relative">
            <div className="absolute top-4 right-4 z-10 flex space-x-1">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentSlide ? "bg-blue-600" : "bg-blue-200"
                  } transition-all duration-300`}
                />
              ))}
            </div>

            <div className="transition-all duration-500 ease-in-out">
              <div className="p-6 pt-12 bg-gradient-to-b from-blue-100 to-white text-center">
                <div className="mx-auto mb-6 flex justify-center">{slides[currentSlide].icon}</div>
                <h1 className="text-2xl font-bold text-blue-800 mb-4">{slides[currentSlide].title}</h1>
                <div className="mb-6 h-48 flex items-center justify-center">
                  <img
                    src={slides[currentSlide].image || "/placeholder.svg"}
                    alt={slides[currentSlide].title}
                    className="max-h-full rounded-lg shadow-md"
                  />
                </div>
                <p className="text-blue-700 mb-8">{slides[currentSlide].description}</p>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="border-blue-300 text-blue-700 bg-transparent"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {currentSlide < slides.length - 1 ? (
                    <Button onClick={nextSlide} className="bg-blue-600 hover:bg-blue-700">
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={goToLogin} className="bg-blue-600 hover:bg-blue-700">
                      Get Started
                      <Heart className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="link" onClick={goToLogin} className="text-blue-600">
            Skip Introduction
          </Button>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Powered by{" "}
              <a
                href="https://www.endgateglobal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
              >
                Endgate Global
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
