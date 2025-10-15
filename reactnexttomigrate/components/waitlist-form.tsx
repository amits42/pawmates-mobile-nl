"use client"

import { useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"

export function WaitlistForm() {
  const [name, setName] = useState("")
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [petType, setPetType] = useState("")
  const [services, setServices] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleCheckbox = (service: string) => {
    setServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch("/api/waitlist/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emailOrPhone, petType, services }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setName("")
        setEmailOrPhone("")
        setPetType("")
        setServices([])
      } else {
        setError(data.message || "Something went wrong.")
      }
    } catch (err) {
      setError("Failed to submit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          placeholder="Your Name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zubo-primary focus:border-transparent"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Email or Phone"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zubo-primary focus:border-transparent"
          required
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
        />
      </div>
      <div>
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zubo-primary focus:border-transparent"
          value={petType}
          onChange={(e) => setPetType(e.target.value)}
        >
          <option value="">Pet Type</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-2 text-left">Services interested in:</p>
        <div className="flex flex-wrap gap-2">
          {["Grooming", "Vet Visits", "Boarding", "Training"].map((service) => (
            <label className="flex items-center" key={service}>
              <input
                type="checkbox"
                className="mr-2"
                checked={services.includes(service)}
                onChange={() => handleCheckbox(service)}
              />
              <span className="text-sm">{service}</span>
            </label>
          ))}
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-zubo-primary hover:bg-zubo-primary hover:opacity-90 text-white"
        disabled={loading}
      >
        {loading ? "Joining..." : "Join Waitlist"}
      </Button>
      {success && <p className="text-green-600 text-sm text-center">Thank you! You're on the waitlist.</p>}
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </form>
  )
}
