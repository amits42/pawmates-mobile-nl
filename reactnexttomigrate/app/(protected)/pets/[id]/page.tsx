"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  PawPrint,
  Dog,
  Cat,
  Rabbit,
  Heart,
  Ruler,
  Calendar,
  ClipboardList,
  BookOpen,
  Stethoscope,
  Phone,
  MapPin,
  HeartPulse,
  Activity,
  ZoomIn,
} from "lucide-react"

type YesNo = "yes" | "no" | "not_sure" | "" | undefined | null

// Fields returned by GET /api/pets/[id] (supports snake_case or camelCase)
interface Pet {
  id: string
  userId?: string
  name: string
  type: string
  breed?: string
  age?: number
  weight?: number | null
  gender?: string
  description?: string
  medicalInfo?: string
  allergies?: string
  behavioralNotes?: string
  image?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  adoptionOrBirthday?: string
  microchipped?: YesNo
  spayedNeutered?: YesNo
  pottyTrained?: YesNo
  friendlyWithChildren?: YesNo
  friendlyWithDogs?: YesNo
  friendlyWithAnimals?: YesNo
  vetName?: string
  vetAddress?: string
  vetPhone?: string
  currentMedications?: string
  otherMedicalInfo?: string
}

function prettyYN(v: YesNo) {
  if (!v) return "Not provided"
  if (v === "not_sure") return "Not sure"
  return v === "yes" ? "Yes" : "No"
}

function ynBadgeClass(v: YesNo) {
  // Use your brand tokens; keep contrast and avoid non-brand colors
  if (v === "yes") return "bg-zubo-primary/10 text-zubo-primary ring-1 ring-zubo-primary/20"
  if (v === "no") return "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
  if (v === "not_sure") return "bg-muted text-muted-foreground"
  return "bg-muted text-muted-foreground"
}

function typeIcon(type?: string) {
  const t = (type || "").toLowerCase()
  if (t.includes("dog")) return Dog
  if (t.includes("cat")) return Cat
  if (t.includes("rabbit")) return Rabbit
  return PawPrint
}

function formatDate(d?: string) {
  if (!d) return "—"
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString()
}

function formatNumber(n?: number | null, unit?: string) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  return unit ? `${n} ${unit}` : `${n}`
}

function LabeledRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground text-right max-w-[70%]">{value}</div>
    </div>
  )
}

export default function PetDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const [pet, setPet] = useState<Pet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageOpen, setImageOpen] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/pets/${id}`, { cache: "no-store" })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || `Failed to fetch pet (${res.status})`)
        }
        const data = (await res.json()) as Pet
        if (active) setPet(data)
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load pet")
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  const TIcon = typeIcon(pet?.type)
  const imageSrc = pet?.image && pet.image.trim() !== "" ? pet.image : "/cute-pet-profile-photo.png"

  return (
    <main className="min-h-screen w-full bg-zubo-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-4 md:py-8">
        {/* Page header: keep Back for navigation; read-only profile */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-zubo-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* Hero (compact avatar + name + chips) */}
        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-zubo-primary/40 via-zubo-primary/20 to-transparent" />
          <div className="grid grid-cols-1">
            <div className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  {/* Avatar with expand-on-click */}
                  <Dialog open={imageOpen} onOpenChange={setImageOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-zubo-primary/20 hover:ring-zubo-primary/40 transition"
                        aria-label="View profile photo"
                        onClick={() => setImageOpen(true)}
                      >
                        {isLoading ? (
                          <Skeleton className="h-full w-full rounded-full" />
                        ) : (
                          <img
                            src={imageSrc || "/placeholder.svg"}
                            alt={pet?.name ? `${pet.name} photo` : "Pet photo"}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-0 right-0 m-1 inline-flex items-center justify-center rounded-full bg-zubo-primary p-1 text-white">
                          <ZoomIn className="size-3.5" />
                        </span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[min(96vw,900px)]">
                      <DialogHeader>
                        <DialogTitle>{pet?.name ? `${pet.name} photo` : "Pet photo"}</DialogTitle>
                      </DialogHeader>
                      <div className="relative">
                        <img
                          src={
                            pet?.image && pet.image.trim() !== ""
                              ? pet.image
                              : "/placeholder.svg?height=800&width=1200&query=pet%20photo%20expanded"
                          }
                          alt={pet?.name ? `${pet.name} enlarged photo` : "Pet photo"}
                          className="max-h-[70vh] w-full rounded-md object-contain bg-black/5"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Title + chips */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zubo-primary/10 text-zubo-primary ring-1 ring-zubo-primary/20">
                        <TIcon className="size-5" />
                      </div>
                      <CardTitle className="truncate text-2xl">{pet?.name || (isLoading ? "Loading…" : "—")}</CardTitle>
                    </div>

                    <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-zubo-primary/10 px-2 py-0.5 text-xs font-medium text-zubo-primary ring-1 ring-zubo-primary/20">
                        <PawPrint className="size-3 opacity-70" />
                        {pet?.type || "—"}
                      </span>
                      {pet?.breed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zubo-primary/10 px-2 py-0.5 text-xs font-medium text-zubo-primary ring-1 ring-zubo-primary/20">
                          <BookOpen className="size-3 opacity-70" />
                          {pet.breed}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Quick stats */}
              <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-md border border-zubo-primary/10 p-3 transition-colors hover:border-zubo-primary/20">
                  <div className="flex items-center gap-2 text-sm text-zubo-primary">
                    <Calendar className="size-4" />
                    Age
                  </div>
                  <div className="mt-1 text-base font-semibold">{formatNumber(pet?.age ?? undefined, "yrs")}</div>
                </div>
                <div className="rounded-md border border-zubo-primary/10 p-3 transition-colors hover:border-zubo-primary/20">
                  <div className="flex items-center gap-2 text-sm text-zubo-primary">
                    <Ruler className="size-4" />
                    Weight
                  </div>
                  <div className="mt-1 text-base font-semibold">
                    {formatNumber(
                      typeof pet?.weight === "number"
                        ? Math.round((pet.weight + Number.EPSILON) * 100) / 100
                        : undefined,
                      "kg",
                    )}
                  </div>
                </div>
                <div className="rounded-md border border-zubo-primary/10 p-3 transition-colors hover:border-zubo-primary/20">
                  <div className="flex items-center gap-2 text-sm text-zubo-primary">
                    <Heart className="size-4" />
                    Gender
                  </div>
                  <div className="mt-1 text-base font-semibold capitalize">{pet?.gender || "—"}</div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Content grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-5 w-1 rounded bg-zubo-primary" aria-hidden />
                <span className="text-zubo-primary">Overview</span>
              </CardTitle>
              <CardDescription>Basic information and notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <LabeledRow label="Name" value={pet?.name || "—"} />
                  <LabeledRow label="Type" value={pet?.type || "—"} />
                  <LabeledRow label="Breed" value={pet?.breed || "—"} />
                  <LabeledRow label="Adoption/Birthday" value={formatDate(pet?.adoptionOrBirthday)} />
                </div>
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <div className="text-sm text-muted-foreground">Description</div>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">
                    {pet?.description && pet.description.trim() !== "" ? pet.description : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-5 w-1 rounded bg-zubo-primary" aria-hidden />
                <span className="text-zubo-primary">Status</span>
              </CardTitle>
              <CardDescription>Key care attributes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Microchipped</span>
                <Badge className={cn("capitalize", ynBadgeClass(pet?.microchipped))}>
                  {prettyYN(pet?.microchipped)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Spayed / Neutered</span>
                <Badge className={cn("capitalize", ynBadgeClass(pet?.spayedNeutered))}>
                  {prettyYN(pet?.spayedNeutered)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Potty Trained</span>
                <Badge className={cn("capitalize", ynBadgeClass(pet?.pottyTrained))}>
                  {prettyYN(pet?.pottyTrained)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Medical */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-5 w-1 rounded bg-zubo-primary" aria-hidden />
                <span className="text-zubo-primary">Medical</span>
              </CardTitle>
              <CardDescription>Health, medications, and allergies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zubo-primary">
                    <ClipboardList className="size-4" />
                    Medical Info
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {pet?.medicalInfo && pet.medicalInfo.trim() !== "" ? pet.medicalInfo : "—"}
                  </p>
                </div>
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zubo-primary">
                    <HeartPulse className="size-4" />
                    Current Medications
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {pet?.currentMedications && pet.currentMedications.trim() !== "" ? pet.currentMedications : "—"}
                  </p>
                </div>
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zubo-primary">
                    <Activity className="size-4" />
                    Allergies
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {pet?.allergies && pet.allergies.trim() !== "" ? pet.allergies : "—"}
                  </p>
                </div>
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zubo-primary">
                    <BookOpen className="size-4" />
                    Other Medical Info
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {pet?.otherMedicalInfo && pet.otherMedicalInfo.trim() !== "" ? pet.otherMedicalInfo : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Behavior */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-5 w-1 rounded bg-zubo-primary" aria-hidden />
                <span className="text-zubo-primary">Behavior</span>
              </CardTitle>
              <CardDescription>Temperament and social cues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">With Children</span>
                <Badge className={cn("capitalize", ynBadgeClass(pet?.friendlyWithChildren))}>
                  {prettyYN(pet?.friendlyWithChildren)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">With Dogs</span>
                <Badge className={cn("capitalize", ynBadgeClass(pet?.friendlyWithDogs))}>
                  {prettyYN(pet?.friendlyWithDogs)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">With Other Animals</span>
                <Badge className={cn("capitalize", ynBadgeClass(pet?.friendlyWithAnimals))}>
                  {prettyYN(pet?.friendlyWithAnimals)}
                </Badge>
              </div>
              <div className="mt-4 rounded-md border border-zubo-primary/10 p-3">
                <div className="mb-1 text-sm font-medium text-zubo-primary">Behavioral Notes</div>
                <p className="text-sm leading-relaxed text-foreground">
                  {pet?.behavioralNotes && pet.behavioralNotes.trim() !== "" ? pet.behavioralNotes : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vet */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-5 w-1 rounded bg-zubo-primary" aria-hidden />
                <span className="text-zubo-primary">Vet Information</span>
              </CardTitle>
              <CardDescription>Primary veterinary contact and address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zubo-primary">
                    <Stethoscope className="size-4" />
                    Name
                  </div>
                  <div className="text-sm">{pet?.vetName || "—"}</div>
                </div>
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zubo-primary">
                    <MapPin className="size-4" />
                    Address
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{pet?.vetAddress || "—"}</div>
                </div>
                <div className="rounded-md border border-zubo-primary/10 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zubo-primary">
                    <Phone className="size-4" />
                    Phone
                  </div>
                  <div className="text-sm">{pet?.vetPhone || "—"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* Loading overlay to soften content pop-in */}
        {isLoading && (
          <div className="pointer-events-none fixed inset-0 z-10 bg-background/40 backdrop-blur-sm" aria-hidden />
        )}
      </div>
    </main>
  )
}
