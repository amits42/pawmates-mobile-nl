"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface TimeSelectorProps {
  selectedTime: string | null
  onSelectTime: (time: string) => void
}

export function TimeSelector({ selectedTime, onSelectTime }: TimeSelectorProps) {
  // Generate time slots from 5:00 AM to 10:00 PM in 15-minute intervals
  const generateTimeSlots = () => {
    const slots = []
    const startHour = 5 // 5 AM
    const endHour = 22 // 10 PM

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

        // Convert to 12-hour format for display
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        const ampm = hour >= 12 ? "PM" : "AM"
        const displayTime = `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`

        slots.push({
          value: time24,
          display: displayTime,
        })
      }
    }

    return slots
  }

  const timeSlots = generateTimeSlots()

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Select Time</Label>
      <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
        <RadioGroup
          value={selectedTime || ""}
          onValueChange={onSelectTime}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
        >
          {timeSlots.map((slot) => (
            <div key={slot.value} className="flex items-center space-x-2">
              <RadioGroupItem value={slot.value} id={`time-${slot.value}`} className="peer sr-only" />
              <Label
                htmlFor={`time-${slot.value}`}
                className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
              >
                {slot.display}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <p className="text-xs text-muted-foreground">Service hours: 5:00 AM - 10:00 PM</p>
    </div>
  )
}
