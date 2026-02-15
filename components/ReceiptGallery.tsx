'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'

interface ReceiptGalleryProps {
  receiptUrls: string[]
  onRemove?: (path: string) => void
  editable?: boolean
}

const BUCKET = 'receipts'

export default function ReceiptGallery({ receiptUrls, onRemove, editable = false }: ReceiptGalleryProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (receiptUrls.length === 0) {
      setLoading(false)
      return
    }

    const loadSignedUrls = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(receiptUrls, 3600) // 1 hour expiry

      if (!error && data) {
        const urlMap: Record<string, string> = {}
        data.forEach((item) => {
          if (item.signedUrl) {
            urlMap[item.path ?? ''] = item.signedUrl
          }
        })
        setSignedUrls(urlMap)
      }
      setLoading(false)
    }

    loadSignedUrls()
  }, [receiptUrls])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return
    if (e.key === 'Escape') setLightboxIndex(null)
    if (e.key === 'ArrowRight' && lightboxIndex < receiptUrls.length - 1) setLightboxIndex(lightboxIndex + 1)
    if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1)
  }, [lightboxIndex, receiptUrls.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (receiptUrls.length === 0) return null
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Loading photos...
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {receiptUrls.map((path, i) => {
          const url = signedUrls[path]
          return (
            <div key={path} className="relative group">
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="w-12 h-12 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 hover:ring-2 hover:ring-blue-400 transition-all"
              >
                {url ? (
                  <img src={url} alt={`Receipt ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </button>
              {editable && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(path)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
        {receiptUrls.length > 0 && (
          <span className="self-center text-xs text-gray-500 dark:text-gray-400">
            {receiptUrls.length} photo{receiptUrls.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            {signedUrls[receiptUrls[lightboxIndex]] && (
              <img
                src={signedUrls[receiptUrls[lightboxIndex]]}
                alt={`Receipt ${lightboxIndex + 1}`}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {receiptUrls.length}
            </div>

            {/* Prev */}
            {lightboxIndex > 0 && (
              <button
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next */}
            {lightboxIndex < receiptUrls.length - 1 && (
              <button
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
