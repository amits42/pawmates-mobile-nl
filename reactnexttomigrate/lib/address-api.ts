// Dedicated address API functions - no dependency on lib/api.ts

const API_BASE = "/api"

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "An error occurred" }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken") || localStorage.getItem("petcare_auth_token")
}

// Generic API call function for address operations
async function addressApiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("No authentication token found")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }

  console.log(`🏠 Address API Call: ${options.method || "GET"} ${endpoint}`)

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  return handleResponse<T>(response)
}

// Address API functions
export async function fetchUserAddresses() {
  return addressApiCall("/user/address")
}

export async function createUserAddress(addressData: any) {
  return addressApiCall("/user/address", {
    method: "POST",
    body: JSON.stringify(addressData),
  })
}

export async function updateUserAddress(addressData: any) {
  if (addressData.id) {
    // Update existing address by ID
    return addressApiCall(`/user/address/${addressData.id}`, {
      method: "PUT",
      body: JSON.stringify(addressData),
    })
  } else {
    // Create new address
    return addressApiCall("/user/address", {
      method: "POST",
      body: JSON.stringify(addressData),
    })
  }
}

export async function deleteUserAddress(addressId: string) {
  return addressApiCall(`/user/address/${addressId}`, {
    method: "DELETE",
  })
}

export async function setDefaultAddress(addressId: string) {
  return addressApiCall(`/user/address/${addressId}/set-default`, {
    method: "PUT",
  })
}
