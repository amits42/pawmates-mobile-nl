"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Service } from "@/types/api"

interface ServiceSelectorProps {
  services: Service[]
  selectedServiceId: string | null
  onSelectService: (id: string) => void
}

export function ServiceSelector({ services, selectedServiceId, onSelectService }: ServiceSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((service) => (
        <Card
          key={service.id}
          className={`cursor-pointer transition-all border-zubo-text-neutral-200 hover:border-zubo-primary-300 ${selectedServiceId === service.id ? "ring-2 ring-zubo-primary-500 border-zubo-primary-500" : ""}`}
          onClick={() => onSelectService(service.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <Badge variant="outline" className="text-zubo-accent-700 border-zubo-accent-300">
                ₹{service.price}
              </Badge>
            </div>
            <CardDescription>{service.duration} mins</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{service.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
