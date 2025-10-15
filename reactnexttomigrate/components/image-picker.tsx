"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ImageIcon, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface ImagePickerProps {
  isOpen: boolean
  onClose: () => void
  onImageSelect: (imageData: {
    file: File
    preview: string
    name: string
  }) => void
}

export default function ImagePicker({ isOpen, onClose, onImageSelect }: ImagePickerProps) {
  const [selectedImage, setSelectedImage] = useState<{
    file: File
    preview: string
    name: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage({
          file,
          preview: e.target.result as string,
          name: file.name,
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      // Simulate file input change
      const fakeEvent = {
        target: { files: [file] },
      } as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(fakeEvent)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleConfirm = () => {
    if (selectedImage) {
      onImageSelect(selectedImage)
      onClose()
      setSelectedImage(null)
    }
  }

  const handleCancel = () => {
    setSelectedImage(null)
    onClose()
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Share Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedImage ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Choose an image</p>
              <p className="text-sm text-gray-500 mb-4">Click to browse or drag and drop</p>
              <p className="text-xs text-gray-400">Supports: JPG, PNG, GIF (max 5MB)</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage.preview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm">{selectedImage.name}</p>
                <p className="text-xs text-gray-500">{(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedImage}>
            Share Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
