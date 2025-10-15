import { NextResponse } from "next/server"

export async function GET() {
  // Mock company details
  const companyDetails = {
    id: "company_001",
    name: "PetCare Services",
    description:
      "PetCare is a premium pet care service provider offering a range of services including pet sitting, dog walking, grooming, and veterinary care. Our team of experienced and passionate pet lovers ensures your furry friends receive the best care possible.",
    logo: "/images/logo.png",
    contactEmail: "contact@petcare.example",
    contactPhone: "+1 (555) 123-4567",
    address: "123 Pet Street, Animalville, PA 12345",
    socialMedia: {
      facebook: "https://facebook.com/petcare",
      instagram: "https://instagram.com/petcare",
      twitter: "https://twitter.com/petcare",
    },
    services: [
      {
        id: "service_001",
        name: "Dog Walking",
        shortDescription: "Regular walks for your canine companion",
        price: 25,
        duration: 30,
      },
      {
        id: "service_002",
        name: "Pet Sitting",
        shortDescription: "In-home care when you're away",
        price: 45,
        duration: 60,
      },
      {
        id: "service_003",
        name: "Grooming",
        shortDescription: "Keep your pet clean and healthy",
        price: 60,
        duration: 90,
      },
      {
        id: "service_004",
        name: "Veterinary Visit",
        shortDescription: "Accompaniment to vet appointments",
        price: 50,
        duration: 120,
      },
    ],
    businessHours: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: "09:00", close: "16:00" },
      sunday: { open: "10:00", close: "14:00" },
    },
    founded: "2015",
    numberOfEmployees: 25,
    ratings: {
      average: 4.8,
      count: 523,
    },
    createdAt: "2015-03-15T10:00:00Z",
    updatedAt: "2023-06-20T14:30:00Z",
  }

  return NextResponse.json(companyDetails)
}
