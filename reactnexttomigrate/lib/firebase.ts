import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getMessaging } from "firebase/messaging"

const firebaseConfig = {
  apiKey: "AIzaSyB3fPxtEGMU9DnyJAkG-hYUkBezOrV4pHk",
  authDomain: "pawmates-53cb4.firebaseapp.com",
  projectId: "pawmates-53cb4",
  storageBucket: "pawmates-53cb4.firebasestorage.app",
  messagingSenderId: "287567425574",
  appId: "1:287567425574:web:c9c51bc3771e9deec4b6e7",
  measurementId: "G-X08SW1GCTM",
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Initialize messaging (for web notifications)
let messaging: any = null
if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.log("Messaging not supported in this environment")
  }
}

export { messaging }

// Helper function to generate chat room ID from booking
export const getChatRoomId = (bookingId: string) => `booking_${bookingId}`

// Helper function to get user display name
export const getUserDisplayName = (userType: "pet_owner" | "sitter" | "admin", userName?: string) => {
  switch (userType) {
    case "pet_owner":
      return userName ? `${userName} (Owner)` : "Pet Owner"
    case "sitter":
      return userName ? `${userName} (Sitter)` : "Zubo Walkers "
    case "admin":
      return "Support Team"
    default:
      return "User"
  }
}
