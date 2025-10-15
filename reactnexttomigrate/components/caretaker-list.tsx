"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import type { Caretaker } from "@/types/api"

interface CaretakerListProps {
  caretakers: Caretaker[]
  selectedCaretakerId: string | null
  onSelectCaretaker: (id: string) => void
  userLocation: { lat: number; lng: number } | null
}

export function CaretakerList({
  caretakers,
  selectedCaretakerId,
  onSelectCaretaker,
  userLocation,
}: CaretakerListProps) {
  if (caretakers.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No caretakers available for the selected time and date.</p>
        <p className="text-sm text-muted-foreground mt-2">Try selecting a different time or date.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {caretakers.map((caretaker) => (
        <Card
          key={caretaker.id}
          className={`cursor-pointer transition-all ${selectedCaretakerId === caretaker.id ? "ring-2 ring-primary" : ""}`}
          onClick={() => onSelectCaretaker(caretaker.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{caretaker.name}</CardTitle>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">{caretaker.rating}</span>
                  <span className="text-sm text-muted-foreground ml-1">({caretaker.reviews} reviews)</span>
                </div>
              </div>
              <Badge variant="outline">${caretaker.price}/hr</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={caretaker.image || "/placeholder.svg"}
                  alt={caretaker.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-sm">{caretaker.bio}</p>
                <div className="flex flex-wrap gap-1">
                  {caretaker.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Location: </span>
                  <span>{caretaker.location.address}</span>
                  {caretaker.location.distance && (
                    <span className="text-muted-foreground ml-2">({caretaker.location.distance} km away)</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
