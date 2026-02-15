'use client'

import { useRef } from 'react'
import type { ReceiptFile } from '@/lib/use-receipt-upload'

interface ReceiptPhotoPickerProps {
  files: ReceiptFile[]
  canAddMore: boolean
  remainingSlots: number
  isUploading: boolean
  onAddFiles: (files: FileList) => void
  onRemoveFile: (id: string) => void
  disabled?: boolean
}

export default function ReceiptPhotoPicker({
  files,
  canAddMore,
  remainingSlots,
  isUploading,
  onAddFiles,
  onRemoveFile,
  disabled = false,
}: ReceiptPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (disabled) return null

  return (
    <div>
      <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">
        Receipt Photos
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          ({files.length}/5)
        </span>
      </label>

      <div className="flex flex-wrap gap-3">
        {/* Existing file previews */}
        {files.map((f) => (
          <div
            key={f.id}
            className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 group"
          >
            {f.previewUrl ? (
              <img
                src={f.previewUrl}
                alt="Receipt preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Status overlay */}
            {(f.status === 'compressing' || f.status === 'uploading') && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {f.status === 'done' && (
              <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {f.status === 'error' && (
              <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            )}

            {/* Remove button */}
            {!isUploading && f.status !== 'uploading' && f.status !== 'compressing' && (
              <button
                type="button"
                onClick={() => onRemoveFile(f.id)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Error tooltip */}
            {f.error && (
              <div className="absolute bottom-full left-0 mb-1 p-1 bg-red-600 text-white text-xs rounded whitespace-nowrap hidden group-hover:block z-10">
                {f.error}
              </div>
            )}
          </div>
        ))}

        {/* Add button */}
        {canAddMore && !isUploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-0.5">{remainingSlots} left</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddFiles(e.target.files)
            e.target.value = '' // Reset so same file can be selected again
          }
        }}
      />
    </div>
  )
}
