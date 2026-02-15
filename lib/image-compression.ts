const MAX_DIMENSION = 1920
const TARGET_SIZE_BYTES = 500 * 1024 // 500KB
const MAX_INPUT_SIZE_BYTES = 20 * 1024 * 1024 // 20MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export interface CompressedImage {
  blob: Blob
  fileName: string
  originalSize: number
  compressedSize: number
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
    return 'Unsupported file type. Use JPG, PNG, WebP, or HEIC.'
  }
  if (file.size > MAX_INPUT_SIZE_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 20MB.`
  }
  return null
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

function resizeAndCompress(img: HTMLImageElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    let { width, height } = img

    // Resize if larger than MAX_DIMENSION
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    ctx.drawImage(img, 0, 0, width, height)
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to compress image'))
      },
      'image/jpeg',
      quality
    )
  })
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const img = await loadImage(file)

  // Try progressively lower quality until under target size
  let quality = 0.85
  let blob = await resizeAndCompress(img, quality)

  while (blob.size > TARGET_SIZE_BYTES && quality > 0.1) {
    quality -= 0.1
    blob = await resizeAndCompress(img, quality)
  }

  // Clean up the object URL
  URL.revokeObjectURL(img.src)

  // Generate filename: replace extension with .jpg
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const fileName = `${baseName}.jpg`

  return {
    blob,
    fileName,
    originalSize: file.size,
    compressedSize: blob.size,
  }
}
