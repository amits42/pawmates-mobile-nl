export interface Society {
  name: string
  pincode: string
  city: string
  state: string
  // Approximate coordinates for map centering
  coordinates?: {
    lat: number
    lng: number
  }
}

export const APPROVED_SOCIETIES: Society[] = [
  {
    name: "Sjr Blue Waters",
    pincode: "560068",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.88616722729644, lng: 77.66831477697728 },
  },
  {
    name: "SNN Raj Eternia",
    pincode: "560068",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.9155, lng: 77.6763 },
  },
  {
    name: "Purva Skywood",
    pincode: "560068",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.8925, lng: 77.6608 },
  },
  {
    name: "RBD Stillwaters Apartments & Private Residences",
    pincode: "560102",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.89773894, lng: 77.66551193 },
  },
  {
    name: "Purva Skydale",
    pincode: "560068",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.8938, lng: 77.6665 },
  },
  {
    name: "Sobha Cinnamon and Saffron Apartment",
    pincode: "560068",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.894, lng: 77.667 },
  },
  {
    name: "Tropical Paradise Villas",
    pincode: "560068",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.89444, lng: 77.65948 },
  },
  {
    name: "ND Passion Elite",
    pincode: "560068",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.8885, lng: 77.6689 },
  },
  {
    name: "ND Passion Apartments",
    pincode: "560102",
    city: "Bangalore",
    state: "Karnataka",
    coordinates: { lat: 12.8945, lng: 77.664 },
  },
]

export const SOCIETIES = APPROVED_SOCIETIES

export const SUPPORTED_PINCODES = Array.from(new Set(APPROVED_SOCIETIES.map((s) => s.pincode)))

export function getSocietiesByPincode(pincode: string): Society[] {
  return APPROVED_SOCIETIES.filter((s) => s.pincode === pincode)
}

export function isSocietyApproved(societyName: string): boolean {
  return APPROVED_SOCIETIES.some((s) => s.name.toLowerCase() === societyName.toLowerCase())
}
