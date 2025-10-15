"use client"

import { useState } from "react"
import { Clock, X, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MarketTimePicker } from "@/components/market-time-picker"

interface MultiTimeSelectorProps {
  value: string[]
  onChange: (times: string[]) => void
  maxTimes?: number
  step?: number
  min?: string
  max?: string
  label?: string
  serviceDate?: string
}

export function MultiTimeSelector({
  value = [],
  onChange,
  maxTimes = 4,
  step = 15,
  min = "05:00",
  max = "22:00",
  label = "Select Times",
  serviceDate,
}: MultiTimeSelectorProps) {
  const [tempTime, setTempTime] = useState<string>("")
  const [validationError, setValidationError] = useState<string>("")

  const formatTime = (time: string) => {
    const [h, m] = time.split(":")
    const hour = Number(h)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${m} ${ampm}`
  }

  const handleTimeSelect = (time: string) => {
    if (!time) {
      setValidationError("Please select a time")
      return
    }

    if (value.includes(time)) {
      setValidationError("This time is already added")
      return
    }

    if (value.length >= maxTimes) {
      setValidationError(`Maximum ${maxTimes} time slots allowed`)
      return
    }

    // Add the time and sort
    const newTimes = [...value, time].sort()
    onChange(newTimes)
    setValidationError("")
    setTempTime("") // Reset for next selection
  }

  const handleRemoveTime = (timeToRemove: string) => {
    onChange(value.filter((t) => t !== timeToRemove))
  }

  const canAddMore = value.length < maxTimes

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-zubo-text-800">{label}</Label>

      {canAddMore && (
        <MarketTimePicker
          value={tempTime}
          onChange={handleTimeSelect}
          step={step}
          min={min}
          max={max}
          serviceDate={serviceDate}
          buttonLabel={value.length === 0 ? "Select time" : "Add more time"}
        />
      )}

      {/* Validation error */}
      {validationError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-sm text-red-800">{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Selected times display */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-zubo-text-600">
            Selected Times ({value.length}/{maxTimes})
          </div>
          <div className="flex flex-wrap gap-2">
            {value.map((time) => (
              <Badge
                key={time}
                variant="secondary"
                className="h-9 px-3 bg-zubo-primary-100 text-zubo-primary-800 border border-zubo-primary-200 hover:bg-zubo-primary-200"
              >
                <Clock className="h-3 w-3 mr-1.5" />
                {formatTime(time)}
                <button
                  type="button"
                  onClick={() => handleRemoveTime(time)}
                  className="ml-2 hover:text-zubo-primary-900 focus:outline-none"
                  aria-label="Remove time"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Max times reached message */}
      {!canAddMore && (
        <Alert className="border-zubo-highlight-1-200 bg-zubo-highlight-1-50">
          <AlertDescription className="text-sm text-zubo-text-700">
            Maximum of {maxTimes} time slots reached. Remove a time to add a different one.
          </AlertDescription>
        </Alert>
      )}

      {/* {value.length === 0 && serviceDate && (
        <Alert className="border-zubo-accent-200 bg-zubo-accent-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs text-zubo-text-700">
            <strong>Booking Policy:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              <li>Morning services (5 AM - 12 PM): Book by 8 PM the day before</li>
              <li>Afternoon/Evening (12 PM - 10 PM): Book at least 4 hours in advance</li>
            </ul>
          </AlertDescription>
        </Alert>
      )} */}
    </div>
  )
}
