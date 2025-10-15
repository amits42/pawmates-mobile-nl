import { toZonedTime } from "date-fns-tz"

/**
 * Validates if a booking time is allowed based on advance booking requirements
 *
 * Rules:
 * - For services between 5 AM to 12 PM: must book by 8 PM the day before
 * - For services between 12 PM to 10 PM: must book at least 4 hours in advance
 *
 * All times are in IST (Asia/Kolkata timezone)
 */
export function isTimeSlotBookable(
  serviceDate: Date | string,
  serviceTime: string,
): {
  isBookable: boolean
  reason?: string
} {
  // Convert service date to IST
  const serviceDateIST = toZonedTime(
    typeof serviceDate === "string" ? new Date(serviceDate) : serviceDate,
    "Asia/Kolkata",
  )

  // Parse service time (format: "HH:MM")
  const [hours, minutes] = serviceTime.split(":").map(Number)

  // Create full service datetime in IST
  const serviceDateTime = new Date(serviceDateIST)
  serviceDateTime.setHours(hours, minutes, 0, 0)

  // Get current time in IST
  const nowIST = toZonedTime(new Date(), "Asia/Kolkata")

  // Determine which rule applies based on service time
  const isMorningService = hours >= 5 && hours < 12 // 5 AM to 12 PM
  const isEveningService = hours >= 12 && hours < 22 // 12 PM to 10 PM

  if (isMorningService) {
    // Rule: Must book by 8 PM the day before
    const dayBefore = new Date(serviceDateIST)
    dayBefore.setDate(dayBefore.getDate() - 1)
    dayBefore.setHours(20, 0, 0, 0) // 8 PM

    if (nowIST > dayBefore) {
      return {
        isBookable: false,
        reason: "Morning services (5 AM - 12 PM) must be booked by 8 PM the day before",
      }
    }
  } else if (isEveningService) {
    // Rule: Must book at least 4 hours in advance
    const fourHoursBefore = new Date(serviceDateTime)
    fourHoursBefore.setHours(fourHoursBefore.getHours() - 4)

    if (nowIST > fourHoursBefore) {
      return {
        isBookable: false,
        reason: "Afternoon/evening services (12 PM - 10 PM) must be booked at least 4 hours in advance",
      }
    }
  } else {
    // Service time outside allowed hours (before 5 AM or after 10 PM)
    return {
      isBookable: false,
      reason: "Services are only available between 5 AM and 10 PM",
    }
  }

  // Additional check: service must be in the future
  if (serviceDateTime <= nowIST) {
    return {
      isBookable: false,
      reason: "Service time must be in the future",
    }
  }

  return { isBookable: true }
}

/**
 * Filters a list of time slots to only include bookable times
 */
export function filterBookableTimes(serviceDate: Date | string, timeSlots: string[]): string[] {
  return timeSlots.filter((time) => {
    const { isBookable } = isTimeSlotBookable(serviceDate, time)
    return isBookable
  })
}

/**
 * Generates all possible time slots between min and max time with given step
 */
export function generateTimeSlots(minTime = "05:00", maxTime = "22:00", step = 15): string[] {
  const slots: string[] = []
  const [minHour, minMinute] = minTime.split(":").map(Number)
  const [maxHour, maxMinute] = maxTime.split(":").map(Number)

  let currentMinutes = minHour * 60 + minMinute
  const maxMinutes = maxHour * 60 + maxMinute

  while (currentMinutes <= maxMinutes) {
    const hours = Math.floor(currentMinutes / 60)
    const minutes = currentMinutes % 60
    slots.push(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`)
    currentMinutes += step
  }

  return slots
}
