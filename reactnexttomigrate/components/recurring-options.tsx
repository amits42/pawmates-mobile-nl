"use client"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Repeat } from "lucide-react"
import { useState, useEffect } from "react"

interface RecurringOptionsProps {
  selectedPattern: string | null
  onSelectPattern: (pattern: string) => void
  endDate: Date | undefined
  onSelectEndDate: (date: Date | undefined) => void
}

export function RecurringOptions({
  selectedPattern,
  onSelectPattern,
  endDate,
  onSelectEndDate,
}: RecurringOptionsProps) {
  const [repeatType, setRepeatType] = useState<"week" | "month" | null>("week")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [weekInterval, setWeekInterval] = useState<string>("1")
  const [monthInterval, setMonthInterval] = useState<string>("1")
  const [weekOfMonth, setWeekOfMonth] = useState<string>("1")
  const [monthDayOfWeek, setMonthDayOfWeek] = useState<string>("")

  const daysOfWeek = [
    { value: "sunday", label: "S", fullLabel: "Sunday" },
    { value: "monday", label: "M", fullLabel: "Monday" },
    { value: "tuesday", label: "T", fullLabel: "Tuesday" },
    { value: "wednesday", label: "W", fullLabel: "Wednesday" },
    { value: "thursday", label: "T", fullLabel: "Thursday" },
    { value: "friday", label: "F", fullLabel: "Friday" },
    { value: "saturday", label: "S", fullLabel: "Saturday" },
  ]

  const weekNumbers = [
    { value: "1", label: "1st" },
    { value: "2", label: "2nd" },
    { value: "3", label: "3rd" },
    { value: "4", label: "4th" },
    { value: "last", label: "Last" },
  ]

  const intervals = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString(),
  }))

  // Quick selection presets for weekly
  const quickSelections = [
    { label: "Every Day", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
    { label: "Weekdays", days: ["monday", "tuesday", "wednesday", "thursday", "friday"] },
    { label: "Weekends", days: ["saturday", "sunday"] },
  ]

  // Handle day selection
  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }

  // Handle quick selection
  const handleQuickSelection = (days: string[]) => {
    setSelectedDays(days)
  }

  useEffect(() => {
    if (!selectedPattern) return

    // Parse weekly pattern: "weekly_1_monday,tuesday,wednesday"
    if (selectedPattern.startsWith("weekly_")) {
      const [, interval, daysString] = selectedPattern.split("_")
      if (interval && daysString) {
        setRepeatType("week")
        setWeekInterval(interval)
        const days = daysString.split(",").filter(Boolean)
        setSelectedDays(days)
      }
    }
    // Parse monthly pattern: "monthly_1_2_monday"
    else if (selectedPattern.startsWith("monthly_")) {
      const [, interval, week, day] = selectedPattern.split("_")
      if (interval && week && day) {
        setRepeatType("month")
        setMonthInterval(interval)
        setWeekOfMonth(week)
        setMonthDayOfWeek(day)
      }
    }
  }, [selectedPattern])

  // Update pattern when selections change
  useEffect(() => {
    if (!repeatType) {
      onSelectPattern("")
      return
    }

    let pattern = ""

    switch (repeatType) {
      case "week":
        if (selectedDays.length > 0 && weekInterval) {
          pattern = `weekly_${weekInterval}_${selectedDays.join(",")}`
        }
        break
      case "month":
        if (monthDayOfWeek && monthInterval && weekOfMonth) {
          pattern = `monthly_${monthInterval}_${weekOfMonth}_${monthDayOfWeek}`
        }
        break
    }

    onSelectPattern(pattern)
  }, [repeatType, selectedDays, weekInterval, monthInterval, weekOfMonth, monthDayOfWeek, onSelectPattern])

  const getPatternDescription = () => {
    if (!selectedPattern) return ""

    if (selectedPattern.startsWith("weekly_")) {
      const [, interval, daysString] = selectedPattern.split("_")
      const days = daysString.split(",")
      const dayLabels = days.map((day) => daysOfWeek.find((d) => d.value === day)?.fullLabel).filter(Boolean)

      if (days.length === 7) {
        return interval === "1" ? "Every day" : `Every ${interval} weeks, all days`
      }

      if (
        days.length === 5 &&
        days.every((day) => ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day))
      ) {
        return interval === "1" ? "Every weekday" : `Every ${interval} weeks on weekdays`
      }

      if (days.length === 2 && days.every((day) => ["saturday", "sunday"].includes(day))) {
        return interval === "1" ? "Every weekend" : `Every ${interval} weeks on weekends`
      }

      const intervalText = interval === "1" ? "Every week" : `Every ${interval} weeks`
      return `${intervalText} on ${dayLabels.join(", ")}`
    }

    if (selectedPattern.startsWith("monthly_")) {
      const [, interval, week, day] = selectedPattern.split("_")
      const dayLabel = daysOfWeek.find((d) => d.value === day)?.fullLabel
      const weekLabel = weekNumbers.find((w) => w.value === week)?.label
      const intervalText = interval === "1" ? "month" : `${interval} months`
      return `Every ${intervalText} on the ${weekLabel} ${dayLabel}`
    }

    return selectedPattern
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-medium">How often do you need this service?</Label>

        {/* Repeat Type Selection - Mobile Optimized */}
        {/* <div className="space-y-3">
          <Label className="text-sm font-medium">Repeat every:</Label>
          <RadioGroup
            value={repeatType || ""}
            onValueChange={(value) => {
              setRepeatType(value as "week" | "month")
              // Reset selections when changing type
              setSelectedDays([])
              setWeekInterval("1")
              setMonthInterval("1")
              setWeekOfMonth("1")
              setMonthDayOfWeek("")
            }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-zubo-text-neutral-200 hover:bg-zubo-text-neutral-50">
              <RadioGroupItem value="week" id="repeat-week" className="h-5 w-5" />
              <Label htmlFor="repeat-week" className="cursor-pointer text-base font-medium">
                Week
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-zubo-text-neutral-200 hover:bg-zubo-text-neutral-50">
              <RadioGroupItem value="month" id="repeat-month" className="h-5 w-5" />
              <Label htmlFor="repeat-month" className="cursor-pointer text-base font-medium">
                Month
              </Label>
            </div>
          </RadioGroup>
        </div> */}

        {/* Weekly Options - Mobile Optimized */}
        {repeatType === "week" && (
          <Card className="border-zubo-accent-200 ">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6">
                {/* Week Interval - Mobile Friendly */}
                <div className="space-y-3">
                  {/* <Label className="text-sm font-medium">Every how many weeks?</Label>
                  <Select value={weekInterval} onValueChange={setWeekInterval}>
                    <SelectTrigger className="w-full sm:w-48 h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" className="text-base py-3">
                        1 week
                      </SelectItem>
                      <SelectItem value="2" className="text-base py-3">
                        2 weeks
                      </SelectItem>
                      <SelectItem value="3" className="text-base py-3">
                        3 weeks
                      </SelectItem>
                      <SelectItem value="4" className="text-base py-3">
                        4 weeks
                      </SelectItem>
                    </SelectContent>
                  </Select> */}
                  <p className="text-sm text-zubo-accent-700 bg-zubo-accent-100 p-2 rounded">
                    {weekInterval === "1" ? "Service every week" : `Service every ${weekInterval} weeks`}
                  </p>
                </div>

                {/* Quick Selection Buttons - Mobile Optimized */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Quick select:</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {quickSelections.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outline"
                        onClick={() => handleQuickSelection(preset.days)}
                        className={`h-12 text-base transition-all ${selectedDays.length === preset.days.length &&
                          preset.days.every((day) => selectedDays.includes(day))
                          ? "bg-zubo-accent text-white border-zubo-accent hover:bg-zubo-accent-700"
                          : "bg-white text-zubo-accent-700 border-zubo-accent-300 hover:bg-zubo-accent-100"
                          }`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Or select specific days:</Label>

                  {/* Single row with day shortcuts */}
                  <div className="grid grid-cols-7 gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`flex flex-col items-center justify-center aspect-square rounded-lg border-2 transition-all ${selectedDays.includes(day.value)
                          ? "border-zubo-accent-500 bg-zubo-accent-500 text-white"
                          : "border-zubo-text-neutral-300 bg-white text-zubo-text-700 hover:border-zubo-accent-300 hover:bg-zubo-accent-50"
                          }`}
                      >
                        <span className="text-sm sm:text-base font-semibold">{day.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Show full day names below for clarity */}
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {daysOfWeek.map((day) => (
                      <span key={day.value} className="text-[10px] sm:text-xs text-zubo-text-500">
                        {day.fullLabel.slice(0, 3)}
                      </span>
                    ))}
                  </div>

                  {selectedDays.length > 0 && (
                    <div className="p-3 bg-zubo-accent-100 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        Selected days:{" "}
                        {selectedDays.map((day) => daysOfWeek.find((d) => d.value === day)?.fullLabel).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Options - Mobile Optimized */}
        {repeatType === "month" && (
          <Card className="border-zubo-highlight-1-200 bg-zubo-highlight-1-50">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Mobile: Stack vertically, Desktop: Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Every</Label>
                    <Select value={monthInterval} onValueChange={setMonthInterval}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {intervals.slice(0, 6).map((interval) => (
                          <SelectItem key={interval.value} value={interval.value} className="text-base py-3">
                            {interval.label} {interval.value === "1" ? "month" : "months"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">On the</Label>
                    <Select value={weekOfMonth} onValueChange={setWeekOfMonth}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weekNumbers.map((week) => (
                          <SelectItem key={week.value} value={week.value} className="text-base py-3">
                            {week.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Day</Label>
                    <Select value={monthDayOfWeek} onValueChange={setMonthDayOfWeek}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value} className="text-base py-3">
                            {day.fullLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-3 bg-zubo-highlight-1-100 rounded-lg">
                  <p className="text-sm text-zubo-highlight-1-700">
                    <strong>Example:</strong> "Every 1 month on the 2nd Saturday" means the service will occur on the
                    second Saturday of every month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedPattern && (
        <div className="p-4 bg-blue-50 rounded-lg border border-zubo-primary-200">
          <div className="flex items-center gap-2 mb-3">
            <Repeat className="h-5 w-5 text-zubo-primary-600" />
            <span className="font-medium text-zubo-primary-900 text-base">Recurring Schedule</span>
          </div>
          <p className="text-sm sm:text-base text-zubo-primary-700 leading-relaxed">
            <strong>{getPatternDescription()}</strong>
            {endDate &&
              ` until ${endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
          </p>
        </div>
      )}
    </div>
  )
}
