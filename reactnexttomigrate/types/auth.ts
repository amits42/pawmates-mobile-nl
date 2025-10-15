export interface User {
  id: string
  phone: string
  name?: string
  email?: string
  userType?: "pet_owner" | "sitter" | "admin"
  profilePicture?: string
  isAuthenticated?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Sitter {
  id: string
  userId: string
  phone: string
  name?: string
  email?: string
  bio?: string
  experience?: string
  rating?: number
  totalBookings?: number
  isVerified?: boolean
  services?: string[]
  hourlyRate?: number
  yearsOfExperience?: number
  specialties?: string[]
  profilePicture?: string
  availability?: Record<string, any>
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  isAuthenticated?: boolean
}

export interface VerifyOTPResponse {
  success: boolean
  message: string
  user?: User
  sitter?: Sitter
  token?: string
  isNewUser?: boolean
}

export interface AuthContextType {
  user: User | null
  sitter: Sitter | null
  login: (phone: string, userType?: "pet_owner" | "sitter") => Promise<void>
  verifyOTP: (phone: string, otp: string, userType?: "pet_owner" | "sitter") => Promise<boolean>
  logout: () => void
  loading: boolean
  isNewUser: boolean
  updateUserProfile: (userData: Partial<User>) => Promise<void>
  updateSitterProfile: (sitterData: Partial<Sitter>) => Promise<void>
}
