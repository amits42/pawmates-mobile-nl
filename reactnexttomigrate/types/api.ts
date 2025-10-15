// User Profile Types
export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  profilePicture?: string
  address?: Address
  addresses?: Address[] // Add support for multiple addresses
  pets?: Pet[]
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: string
  userId: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  latitude?: number
  longitude?: number
  landmark?: string
  isDefault: boolean
  isActive: boolean // Add isActive field
  createdAt: string
  updatedAt: string
}

// Pet Types
export interface Pet {
  id: string
  userId: string
  name: string
  type: string
  breed: string
  age: number
  weight: number
  gender: "male" | "female" | "unknown"
  description?: string
  medicalInfo?: string
  allergies?: string
  behavioralNotes?: string
  image?: string
  isActive: boolean
  // New enhanced fields
  adoptionOrBirthday?: string
  microchipped?: "yes" | "no" | "not_sure"
  spayedNeutered?: "yes" | "no" | "not_sure"
  pottyTrained?: "yes" | "no" | "not_sure"
  friendlyWithChildren?: "yes" | "no" | "not_sure"
  friendlyWithDogs?: "yes" | "no" | "not_sure"
  friendlyWithAnimals?: "yes" | "no" | "not_sure"
  vetName?: string
  vetAddress?: string
  vetPhone?: string
  currentMedications?: string
  otherMedicalInfo?: string
  createdAt: string
  updatedAt: string
}

// Service Types
export interface Service {
  id: string
  name: string
  description: string
  shortDescription?: string
  price: number
  duration: number
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Caretaker Types
export interface Caretaker {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  profilePicture?: string
  bio?: string
  rating: number
  reviewCount: number
  specialties: string[]
  yearsOfExperience: number
  isAvailable: boolean
  hourlyRate: number
  location?: {
    latitude: number
    longitude: number
  }
  createdAt: string
  updatedAt: string
}

// Booking Types
export interface Booking {
  id: string
  userId: string
  petId: string
  serviceId: string
  caretakerId: string
  addressId: string
  date: string
  time: string
  duration: number
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled"
  totalPrice: number
  paymentId?: string
  paymentStatus: "pending" | "paid" | "refunded" | "failed"
  notes?: string
  recurring: boolean
  recurringPattern?: string
  recurringEndDate?: string
  serviceOtp?: string
  otpExpiry?: string
  otpVerified?: boolean
  // Enhanced OTP fields
  startOtp?: string
  endOtp?: string
  createdAt: string
  updatedAt: string
}

export interface ServiceItem {
  name: string
  description: string
  icon: string // Changed back to string to avoid type resolution issues
}

export interface Founder {
  name: string
  bio: string
  imageUrl: string
}

export interface SocialMedia {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  tiktok?: string
}

export interface CompanyInfo {
  id: string
  companyName: string
  tagline: string
  description: string
  mission?: string
  contactEmail: string
  contactPhone: string
  address: string
  operatingHours?: string
  services: ServiceItem[]
  founders: Founder[]
  socialMedia: SocialMedia
  createdAt: Date
  updatedAt: Date
}

// Upcoming Booking Type (simplified for UI)
export interface UpcomingBooking {
  id: string
  date: string
  time: string
  service: string
  petName: string
  caretakerName: string
  location: string
  status: string
  serviceOtp?: string
  startOtp?: string
  endOtp?: string
}

// Company Details Type
export interface CompanyDetails {
  id: string
  name: string
  description: string
  logo?: string
  contactEmail: string
  contactPhone: string
  address: string
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
  services: {
    id: string
    name: string
    shortDescription: string
    price: number
    duration: number
  }[]
  businessHours?: {
    [day: string]: { open: string; close: string }
  }
  founded?: string
  numberOfEmployees?: number
  ratings?: {
    average: number
    count: number
  }
  createdAt: string
  updatedAt: string
}

// Service OTP Type - Enhanced
export interface ServiceOTP {
  id: string
  bookingId: string
  type: "START" | "END"
  otp: string
  createdAt: string
  expiresAt?: string
  usedAt?: string
  isUsed: boolean
}

// Notification Log Type
export interface NotificationLog {
  id: string
  userId: string
  type: "sms" | "email" | "whatsapp" | "push"
  content: string
  sentAt: string
  deliveredAt?: string
  readAt?: string
  status: "sent" | "delivered" | "failed" | "read"
  metadata?: any
}
