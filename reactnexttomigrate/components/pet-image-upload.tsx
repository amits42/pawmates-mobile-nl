"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X } from "lucide-react"
import { uploadImageToBlob } from "@/lib/image-utils"

interface PetImageUploadProps {
  currentImage?: string
  onImageChange: (imageUrl: string) => void
  petName?: string
}

export function PetImageUpload({ currentImage, onImageChange, petName }: PetImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10MB")
      return
    }

    setUploading(true)
    try {
      console.log("📸 Selected file:", file.name, file.size)

      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Upload to blob storage
      const imageUrl = await uploadImageToBlob(file)
      onImageChange(imageUrl)

      console.log("✅ Image upload complete:", imageUrl)
    } catch (error) {
      console.error("❌ Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
      setPreviewUrl(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-slate-700 flex items-center">
        <Camera className="h-4 w-4 mr-1 text-blue-600" />
        Pet Photo
      </Label>

      <div className="flex items-center gap-4">
        {/* Image Preview */}
        <div className="relative">
          {previewUrl ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt={petName || "Pet photo"}
                className="w-full h-full object-cover"
                onError={() => {
                  console.error("❌ Error loading image:", previewUrl)
                  setPreviewUrl(null)
                }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                disabled={uploading}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
              <Camera className="h-8 w-8 text-slate-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {previewUrl ? "Change Photo" : "Upload Photo"}
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 mt-1">Max 10MB • JPG, PNG, GIF</p>
        </div>
      </div>
    </div>
  )
}
