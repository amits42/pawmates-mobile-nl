// Centralized API configuration
// Update BASE_URL here to change the API endpoint for the entire app

const BASE_URL = "https://zubopets-webclient-dev.vercel.app"

export const API_CONFIG = {
  BASE_URL,
  ENDPOINTS: {
    // Auth endpoints
    SEND_OTP: `${BASE_URL}/api/auth/send-otp`,
    VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp`,
    VERIFY_TOKEN: `${BASE_URL}/api/verify-token`,

    // User endpoints
    USER_PROFILE: `${BASE_URL}/api/user/profile`,

    // Sitter endpoints
    SITTER_VERIFY_OTP: `${BASE_URL}/api/sitters/verify-otp`,
    SITTER_PROFILE: `${BASE_URL}/api/sitters/profile`,
  },
}

export default API_CONFIG
