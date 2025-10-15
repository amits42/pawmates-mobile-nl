"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Timekeeper from "react-timekeeper"
import { Clock, Check, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { isTimeSlotBookable } from "@/lib/booking-time-validator"

type Props = {
  value: string | null // expected "HH:mm" 24h
  onChange: (value: string) => void
  step?: number // minute step on apply (default 15)
  min?: string // "HH:mm" lower bound (default "05:00")
  max?: string // "HH:mm" upper bound (default "22:00")
  className?: string
  label?: string
  serviceDate?: string
  buttonLabel?: string
  availableSlots?: string[] // Array of available time slots in "H:mm" or "HH:mm" format
  disabled?: boolean // Disable the picker
}

function toMins(hhmm: string) {
  const [h, m] = hhmm.split(":").map((n) => Number.parseInt(n, 10))
  return h * 60 + m
}
function pad2(n: number) {
  return String(n).padStart(2, "0")
}
function roundToStep(hhmm: string, step: number) {
  const mins = toMins(hhmm)
  const rounded = Math.round(mins / step) * step
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return `${pad2(h)}:${pad2(m)}`
}
function format12(hhmm: string) {
  const [h24, m] = hhmm.split(":").map((n) => Number.parseInt(n, 10))
  const mer = h24 >= 12 ? "PM" : "AM"
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${pad2(m)} ${mer}`
}

export function MarketTimePicker({
  value,
  onChange,
  step = 15,
  min = "05:00",
  max = "22:00",
  className,
  label = "Time",
  serviceDate,
  buttonLabel = "Select time",
  availableSlots,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [temp, setTemp] = useState<string>(value || "08:00")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  useEffect(() => {
    if (value) setTemp(value)
  }, [value])

  const minMins = useMemo(() => toMins(min), [min])
  const maxMins = useMemo(() => toMins(max), [max])

  const allHoursWithAvailability = useMemo(() => {
    const hours = []
    const availableHourSet = new Set(
      availableSlots?.map((slot) => {
        const [hour] = slot.split(":")
        return Number.parseInt(hour, 10)
      }) || [],
    )

    const isRecurring = !availableSlots || availableSlots.length === 0

    for (let hour = 5; hour <= 21; hour++) {
      const time24 = `${pad2(hour)}:00`
      const isAvailable = isRecurring || availableHourSet.has(hour)
      const validation = isTimeSlotBookable(serviceDate || "", time24)
      const isBookable = isAvailable && validation.isBookable

      hours.push({
        hour24: hour,
        hour12: hour % 12 || 12,
        meridiem: hour >= 12 ? "PM" : "AM",
        time24,
        display: format12(time24),
        isAvailable,
        isBookable,
        reason: validation.reason,
      })
    }

    return hours
  }, [availableSlots, serviceDate])

  const withinRange = useMemo(() => {
    const t = toMins(temp)
    return t >= minMins && t <= maxMins
  }, [temp, minMins, maxMins])

  const isSelectedTimeAvailable = useMemo(() => {
    if (!availableSlots || availableSlots.length === 0) return true

    const [selectedHour] = temp.split(":")
    const selectedHourNum = Number.parseInt(selectedHour, 10)

    return availableSlots.some((slot) => {
      const [hour] = slot.split(":")
      return Number.parseInt(hour, 10) === selectedHourNum
    })
  }, [temp, availableSlots])

  const selectedTimeValidation = useMemo(() => {
    return isTimeSlotBookable(serviceDate || "", temp)
  }, [temp, serviceDate])

  const isValid = withinRange && isSelectedTimeAvailable && selectedTimeValidation.isBookable

  function apply() {
    const rounded = roundToStep(temp, 60)
    const t = toMins(rounded)
    if (t < minMins || t > maxMins) return

    onChange(rounded)
    setOpen(false)
  }

  const handleQuickSelect = (time24: string, isBookable: boolean) => {
    if (!isBookable) return
    setTemp(time24)
    onChange(time24)
    setOpen(false)
  }

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  useEffect(() => {
    if (allHoursWithAvailability.length > 0) {
      setTimeout(handleScroll, 100)
    }
  }, [allHoursWithAvailability])

  return (
    <div className={cn("w-full", className)}>
      <div className="text-sm font-medium text-zubo-text-800 mb-2">{label}</div>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          "h-12 w-full rounded-lg border border-zubo-background-300 bg-white px-3 text-left flex items-center justify-between hover:bg-zubo-background-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zubo-accent-600",
          disabled && "opacity-50 cursor-not-allowed hover:bg-white",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-content-center rounded-md bg-zubo-primary-600 text-white">
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-zubo-text-900 font-semibold">
            {disabled ? "Select a date first" : value ? format12(value) : buttonLabel}
          </div>
        </div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] max-h-screen border-t border-zubo-background-300 bg-white p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="p-6 pb-3">
              <SheetTitle className="flex items-center gap-2 text-zubo-text-900">
                <Clock className="h-5 w-5 text-zubo-primary-700" />
                Pick a time
              </SheetTitle>
              <div className="text-xs text-zubo-text-600">
                {allHoursWithAvailability.filter((h) => h.isBookable).length > 0
                  ? `${allHoursWithAvailability.filter((h) => h.isBookable).length} available slots • Swipe to browse`
                  : `Service window: ${format12(min)} – ${format12(max)} • Hour selection only`}
              </div>
            </SheetHeader>

            {allHoursWithAvailability.length > 0 && (
              <div className="px-6 pb-4">
                <div className="text-xs font-medium text-zubo-text-700 mb-2">Time Slots (5 AM - 10 PM)</div>
                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={scrollLeft}
                    className={cn(
                      "hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zubo-background-300 shadow-sm hover:bg-zubo-background-50 transition-opacity flex-shrink-0 z-10",
                      !showLeftArrow && "opacity-0 pointer-events-none",
                    )}
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-4 w-4 text-zubo-text-700" />
                  </button>

                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-x-auto scrollbar-hide"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    <div className="flex gap-2 pb-2 min-w-max">
                      {allHoursWithAvailability.map((slot) => {
                        const isSelected = temp.startsWith(pad2(slot.hour24))

                        return (
                          <button
                            key={slot.hour24}
                            type="button"
                            onClick={() => handleQuickSelect(slot.time24, slot.isBookable)}
                            disabled={!slot.isBookable}
                            className={cn(
                              "flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                              isSelected && slot.isBookable
                                ? "bg-zubo-primary-600 text-white ring-2 ring-zubo-primary-600 ring-offset-2 shadow-md"
                                : slot.isBookable
                                  ? "bg-zubo-primary-50 text-zubo-primary-700 border border-zubo-primary-200 hover:bg-zubo-primary-100 hover:shadow-sm"
                                  : "bg-zubo-background-100 text-zubo-text-400 border border-zubo-background-200 line-through cursor-not-allowed opacity-60",
                            )}
                          >
                            {slot.display}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={scrollRight}
                    className={cn(
                      "hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zubo-background-300 shadow-sm hover:bg-zubo-background-50 transition-opacity flex-shrink-0 z-10",
                      !showRightArrow && "opacity-0 pointer-events-none",
                    )}
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-4 w-4 text-zubo-text-700" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 sm:px-6 pb-2">
              <div className="mx-auto max-w-sm rounded-2xl border border-zubo-highlight-2-100 bg-gradient-to-br from-zubo-primary-50 to-zubo-accent-50 p-2 sm:p-4">
                <div className="rounded-xl border border-zubo-background-300 bg-white p-2 sm:p-4">
                  <Timekeeper
                    time={temp}
                    onChange={(data: any) => {
                      if (data?.formatted24) {
                        const [hour] = data.formatted24.split(":")
                        setTemp(`${hour}:00`)
                      }
                    }}
                    hour24Mode={false}
                    switchToMinuteOnHourSelect={false}
                    coarseMinutes={60}
                    forceCoarseMinutes={true}
                    doneButton={false}
                    config={{
                      TIMEPICKER_BACKGROUND: "#ffffff",
                      DONE_BUTTON_COLOR: "#2563eb",
                    }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zubo-background-300 bg-white p-3">
                    <div className="text-xs text-zubo-text-500">Selected</div>
                    <div className="text-lg font-extrabold text-zubo-primary-700">{format12(temp)}</div>
                  </div>
                  <div className="rounded-lg border border-zubo-background-300 bg-white p-3">
                    <div className="text-xs text-zubo-text-500">Will apply</div>
                    <div className="text-lg font-semibold text-zubo-text-900">{format12(roundToStep(temp, 60))}</div>
                  </div>
                </div>

                {!selectedTimeValidation.isBookable && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{selectedTimeValidation.reason}</span>
                  </div>
                )}

                {!isSelectedTimeAvailable && availableSlots && availableSlots.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>This time slot is not available. Please select from the available slots above.</span>
                  </div>
                )}

                {/* {!withinRange && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Time is outside service hours. Please choose between {format12(min)} and {format12(max)}.
                    </span>
                  </div>
                )} */}
              </div>
            </div>

            <SheetFooter className="border-t border-zubo-background-300 bg-white p-4">
              <div className="mx-auto flex w-full max-w-4xl gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-lg border-zubo-background-300 bg-transparent"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={apply}
                  disabled={!isValid}
                  className="h-11 flex-1 rounded-xl bg-zubo-primary-600 text-white hover:bg-zubo-primary-700 focus-visible:ring-2 focus-visible:ring-zubo-accent-600 disabled:bg-zubo-background-300"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply time
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
