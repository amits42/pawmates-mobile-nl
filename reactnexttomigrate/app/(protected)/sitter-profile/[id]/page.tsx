"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent } from "@/components/ui/dialog"

import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Award,
  Heart,
  User,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  MessageCircle,
  Shield,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SitterProfile {
  id: string
  name: string
  email: string
  phone: string
  profilePicture?: string
  bio?: string
  rating: number
  reviewCount: number
  specialties: string[]
  training: string[]
  yearsOfExperience: number
  isAvailable: boolean
  hourlyRate?: number
  location?: {
    city: string
    state: string
  }
  videoUrl?: string
  verificationStatus: "verified" | "pending" | "unverified"
  joinedDate: string
  completedBookings: number
  responseTime: string
  languages: string[]
  certifications: string[]
  services: string[]
}

interface SitterReview {
  id: string
  userName: string
  rating: number
  comment: string
  date: string
  petName: string
  serviceName: string
}

export default function SitterProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [sitter, setSitter] = useState<SitterProfile | null>(null)
  const [reviews, setReviews] = useState<SitterReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const sitterId = params?.id as string

  useEffect(() => {
    if (sitterId && user?.id) {
      fetchSitterProfile()
    }
  }, [sitterId, user])

  // inside useEffect -> fetchSitterProfile
  const fetchSitterProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sitters/profile/${sitterId}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch sitter profile")
      }

      const data = await response.json()

      // 🔑 Map API sitter to UI shape
      const mappedSitter: SitterProfile = {
        id: data.sitter.id,
        name: data.sitter.name,
        email: data.sitter.email,
        phone: data.sitter.phone,
        profilePicture: data.sitter.profilePicture || data.sitter.photoUrl || "",
        bio: data.sitter.bio || "",
        rating: data.sitter.rating || 0,
        training: data.sitter.training,
        reviewCount: (data.reviews || []).length,
        specialties: data.sitter.specialties || [],
        yearsOfExperience: data.sitter.yearsOfExperience || 0,
        isAvailable: data.sitter.isActive || false,
        hourlyRate: data.sitter.hourlyRate || undefined,
        location: data.sitter.location || undefined,
        videoUrl: data.sitter.videoUrl || undefined,
        verificationStatus: data.sitter.isVerified ? "verified" : "unverified",
        joinedDate: data.sitter.createdAt,
        completedBookings: data.sitter.totalBookings || 0,
        responseTime: "—", // not available in API yet
        languages: [], // not in API yet
        certifications: [], // not in API yet
        services: data.sitter.services || [],
      }

      setSitter(mappedSitter)
      setReviews(data.reviews || [])
    } catch (error) {
      console.error("Error fetching sitter profile:", error)
      setError("Failed to load sitter profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }


  const handleChatWithSitter = async () => {
    if (!user?.phone) {
      toast({
        title: "Phone number required",
        description: "Please ensure your phone number is set in your profile",
        variant: "destructive",
      })
      return
    }

    if (!sitter?.phone) {
      toast({
        title: "Sitter contact not available",
        description: "Sitter phone number is not available",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const chatData = {
        userPhone: user.phone,
        sitterPhone: sitter.phone,
        userAlias: user.name || "Pet Owner",
        sitterAlias: sitter.name,
      }

      const response = await fetch("/api/whatsapp/setup-simple-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Chat Started! 🎉",
          description: `WhatsApp chat with ${sitter.name} has been set up. Check your WhatsApp!`,
        })
      } else {
        throw new Error(result.error || result.details || "Failed to start chat")
      }
    } catch (error) {
      console.error("❌ Error starting sitter chat:", error)
      toast({
        title: "Failed to start chat",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating)
          ? "fill-yellow-400 text-yellow-400"
          : i < rating
            ? "fill-yellow-200 text-yellow-400"
            : "text-gray-300"
          }`}
      />
    ))
  }

  const getVerificationBadge = (status: string) => {
    const config = {
      verified: {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Verified",
      },
      pending: {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: <Clock className="h-3 w-3" />,
        text: "Pending",
      },
      unverified: {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: <Shield className="h-3 w-3" />,
        text: "Unverified",
      },
    }

    const statusConfig = config[status as keyof typeof config] || config.unverified

    return (
      <Badge className={`${statusConfig.color} font-medium px-2 py-1 text-xs flex items-center gap-1`}>
        {statusConfig.icon}
        {statusConfig.text}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4 pb-20">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary-600" />
              <h3 className="text-lg font-semibold text-zubo-text-800 mb-2">Loading Zubo Walkers profile</h3>
              <p className="text-sm text-zubo-text-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !sitter) {
    return (
      <div className="min-h-screen bg-zubo-background-300">
        <div className="container mx-auto p-4 pb-20">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-zubo-text-600 hover:text-zubo-text-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <Alert className="border-destructive bg-destructive/10 max-w-md mx-auto">
            <AlertDescription className="text-destructive">{error || "Sitter profile not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zubo-background-300">
      <div className="container mx-auto p-4 pb-20 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zubo-text-600 hover:text-zubo-text-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-zubo-text-900 mb-2">Sitter Profile</h1>
            <p className="text-sm text-zubo-text-600">Get to know your pet sitter</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Profile Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Video Section */}
              {sitter.videoUrl && (
                <div className="relative bg-black aspect-video">
                  <video
                    className="w-full h-full object-cover"
                    src={sitter.videoUrl}
                    muted={isVideoMuted}
                    loop
                    playsInline
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    poster={sitter.profilePicture}
                  />

                  {/* Video Controls */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-black/50 hover:bg-black/70 text-white border-0"
                      onClick={() => {
                        const video = document.querySelector("video")
                        if (video) {
                          if (isVideoPlaying) {
                            video.pause()
                          } else {
                            video.play()
                          }
                        }
                      }}
                    >
                      {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-black/50 hover:bg-black/70 text-white border-0"
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                    >
                      {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Profile Info */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Avatar and Basic Info */}
                  <div className="flex flex-col items-center text-center md:items-start md:text-left">
                    <Avatar className="h-24 w-24 mb-4" onClick={() => setOpen(true)}>
                      <AvatarImage src={sitter.profilePicture || "/placeholder.svg"} alt={sitter.name} />
                      <AvatarFallback className="text-lg bg-zubo-primary-100 text-zubo-primary-700">
                        {sitter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogContent className="max-w-lg p-0 bg-transparent border-none shadow-none">
                        <img
                          src={sitter.profilePicture || "/placeholder.svg"}
                          alt={sitter.name}
                          className="w-full h-auto rounded-2xl"
                        />
                      </DialogContent>
                    </Dialog>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-zubo-text-900">{sitter.name}</h2>
                        {getVerificationBadge(sitter.verificationStatus)}
                      </div>

                      {typeof sitter.rating === "number" && sitter.rating > 0 && (
                        <div className="flex items-center gap-1">
                          {renderStars(sitter.rating)}
                          <span className="ml-2 text-sm text-zubo-text-600">
                            {sitter.rating.toFixed(1)} ({sitter.reviewCount} reviews)
                          </span>
                        </div>
                      )}

                      {sitter.location && (
                        <div className="flex items-center gap-1 text-sm text-zubo-text-600">
                          <MapPin className="h-4 w-4" />
                          {sitter.location.city}, {sitter.location.state}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats and Actions */}
                  <div className="flex-1 w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-3 bg-zubo-accent-50 rounded-lg">
                        <div className="text-lg font-bold text-zubo-accent-700">{sitter.yearsOfExperience}</div>
                        <div className="text-xs text-zubo-text-600">Years Experience</div>
                      </div>

                      {/* <div className="text-center p-3 bg-zubo-primary-50 rounded-lg">
                        <div className="text-lg font-bold text-zubo-primary-700">{sitter.completedBookings}</div>
                        <div className="text-xs text-zubo-text-600">Completed Jobs</div>
                      </div> */}




                    </div>


                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          {sitter.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                  <User className="h-5 w-5 text-zubo-primary-600" />
                  About {sitter.name.split(" ")[0]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zubo-text-700 leading-relaxed">{sitter.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Skills and Specialties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Specialties */}
            {sitter.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                    <Heart className="h-5 w-5 text-zubo-accent-600" />
                    Specialties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sitter.specialties.map((specialty, index) => (
                      <Badge
                        key={index}
                        className="bg-zubo-accent-50 text-zubo-accent-700 border-zubo-accent-200 px-3 py-1"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {sitter.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                    <Award className="h-5 w-5 text-zubo-primary-600" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sitter.services.map((service, index) => (
                      <Badge
                        key={index}
                        className="bg-zubo-primary-50 text-zubo-primary-700 border-zubo-primary-200 px-3 py-1"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Training and Verifications */}
            {Array.isArray((sitter as any).training) && (sitter as any).training.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                    <Shield className="h-5 w-5 text-zubo-highlight-1-600" />
                    Training & Verifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(sitter as any).training.map((item: string, idx: number) => (
                      <Badge
                        key={idx}
                        className="bg-zubo-highlight-1-50 text-zubo-highlight-1-700 border-zubo-highlight-1-200 px-3 py-1"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Languages */}
            {sitter.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-zubo-text-900">Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sitter.languages.map((language, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-zubo-highlight-1-200 text-zubo-highlight-1-700"
                      >
                        {language}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {sitter.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-zubo-text-900">Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sitter.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-zubo-highlight-2-50 rounded-lg">
                        <Award className="h-4 w-4 text-zubo-highlight-2-600" />
                        <span className="text-sm text-zubo-text-700">{cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-zubo-text-900">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b border-zubo-background-200 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-zubo-text-900">{review.userName}</span>
                            <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                          </div>
                          <div className="text-xs text-zubo-text-600">
                            {review.serviceName} for {review.petName} • {new Date(review.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-zubo-text-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  )
}
