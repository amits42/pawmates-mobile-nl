// Image utility functions for resizing and uploading
export const resizeImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, "image/jpeg", quality)
    }

    img.src = URL.createObjectURL(file)
  })
}

export const uploadImageToBlob = async (file: File): Promise<string> => {
  try {
    console.log("📸 Starting image upload process...")

    // Resize image first
    const resizedBlob = await resizeImage(file, 400, 400, 0.8)
    console.log(`📸 Image resized: ${file.size} bytes → ${resizedBlob?.size} bytes`)

    if (!resizedBlob) {
      throw new Error("Failed to resize image")
    }

    // Create FormData for upload
    const formData = new FormData()
    formData.append("file", resizedBlob, `pet-${Date.now()}.jpg`)

    // Upload to Vercel Blob
    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const { url } = await response.json()
    console.log("✅ Image uploaded successfully:", url)

    return url
  } catch (error) {
    console.error("❌ Error uploading image:", error)
    throw error
  }
}
