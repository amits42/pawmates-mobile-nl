"use client"
import { useState } from "react"
import { MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { APPROVED_SOCIETIES } from "@/lib/societies"

export function SocietiesSheet() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSocieties = APPROVED_SOCIETIES.filter((society) => {
    const query = searchQuery.toLowerCase()
    return society.name.toLowerCase().includes(query) || society.pincode.includes(query)
  })

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="link" className="text-zubo-primary hover:underline text-sm p-0 h-auto font-normal">
          Check Service Areas
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-screen bg-zubo-background-100 border-zubo-background-300 p-0"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-2 text-zubo-text-900">
              <MapPin className="h-5 w-5 text-zubo-primary-700" />
              Where We Serve in Bengaluru
            </SheetTitle>
            <p className="text-sm text-zubo-text-600">
              We're currently serving these premium societies with plans to expand soon
            </p>
          </SheetHeader>

          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zubo-text-500" />
              <Input
                type="text"
                placeholder="Search by society name or pincode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-zubo-background-300 focus-visible:ring-zubo-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {filteredSocieties.length > 0 ? (
              <ul className="divide-y divide-zubo-background-300 rounded-xl border border-zubo-background-300 bg-white">
                {filteredSocieties.map((society, index) => (
                  <li key={index} className="flex items-start gap-3 p-4 hover:bg-zubo-background-50 transition-colors">
                    <div className="w-10 h-10 bg-zubo-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <MapPin className="h-5 w-5 text-zubo-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zubo-text-800">{society.name}</h3>
                    </div>

                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="h-12 w-12 text-zubo-text-400 mb-3" />
                <p className="text-zubo-text-600 font-medium">No societies found</p>
                <p className="text-sm text-zubo-text-500 mt-1">Try searching with a different name or pincode</p>
              </div>
            )}
          </div>

          <div className="border-t border-zubo-background-300 bg-white p-6">
            <SheetFooter>
              <SheetClose asChild>
                <Button className="w-full h-11 rounded-xl bg-zubo-primary-600 text-white hover:bg-zubo-primary-700 focus-visible:ring-2 focus-visible:ring-zubo-accent-600">
                  Close
                </Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
