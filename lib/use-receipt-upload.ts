'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { compressImage, validateImageFile } from '@/lib/image-compression'

const MAX_RECEIPTS = 5
const BUCKET = 'receipts'

export interface ReceiptFile {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error'
  error?: string
  storagePath?: string
}

export function useReceiptUpload() {
  const [files, setFiles] = useState<ReceiptFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const remainingSlots = MAX_RECEIPTS - files.length
  const canAddMore = remainingSlots > 0

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: ReceiptFile[] = []
    const available = MAX_RECEIPTS - files.length

    for (let i = 0; i < Math.min(fileList.length, available); i++) {
      const file = fileList[i]
      const validationError = validateImageFile(file)
      if (validationError) {
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: '',
          status: 'error',
          error: validationError,
        })
        continue
      }

      newFiles.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
      })
    }

    setFiles((prev) => [...prev, ...newFiles])
  }, [files.length])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const uploadAll = useCallback(async (
    userId: string,
    recordType: 'maintenance' | 'fill_ups',
    recordId: string
  ): Promise<string[]> => {
    const supabase = createClient()
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return []

    setIsUploading(true)
    const paths: string[] = []

    for (const receiptFile of pendingFiles) {
      try {
        // Compress
        setFiles((prev) =>
          prev.map((f) => f.id === receiptFile.id ? { ...f, status: 'compressing' as const } : f)
        )
        const compressed = await compressImage(receiptFile.file)

        // Upload
        setFiles((prev) =>
          prev.map((f) => f.id === receiptFile.id ? { ...f, status: 'uploading' as const } : f)
        )
        const storagePath = `${userId}/${recordType}/${recordId}/${receiptFile.id}_${compressed.fileName}`
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, compressed.blob, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (error) throw error

        paths.push(storagePath)
        setFiles((prev) =>
          prev.map((f) => f.id === receiptFile.id ? { ...f, status: 'done' as const, storagePath } : f)
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setFiles((prev) =>
          prev.map((f) => f.id === receiptFile.id ? { ...f, status: 'error' as const, error: message } : f)
        )
      }
    }

    setIsUploading(false)
    return paths
  }, [files])

  const deleteFromStorage = useCallback(async (storagePaths: string[]) => {
    if (storagePaths.length === 0) return
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove(storagePaths)
  }, [])

  const reset = useCallback(() => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
    })
    setFiles([])
    setIsUploading(false)
  }, [files])

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    deleteFromStorage,
    reset,
    canAddMore,
    remainingSlots,
  }
}
