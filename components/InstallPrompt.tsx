'use client'

import { useState, useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'fleetreq-install-snoozed'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const PROMPT_DELAY_MS = 4000 // Wait 4s before showing — don't interrupt on first load

function isSnoozed(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (!val) return false
    if (val === 'permanent') return true
    const snoozedAt = parseInt(val, 10)
    return !isNaN(snoozedAt) && Date.now() - snoozedAt < SNOOZE_MS
  } catch {
    return false
  }
}

function snooze() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
}

function suppressPermanently() {
  try { localStorage.setItem(STORAGE_KEY, 'permanent') } catch { /* ignore */ }
}

function detectIOS(): boolean {
  // iPhone / iPod: userAgent includes 'iphone' or 'ipod'
  // iPad iOS 12-: userAgent includes 'ipad'
  // iPad iOS 13+ in desktop mode: pretends to be macOS but has touch support
  return (
    /iphone|ipod/i.test(navigator.userAgent) ||
    /ipad/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /MacIntel/.test(navigator.platform))
  )
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosDevice, setIosDevice] = useState(false)
  const firstButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Already installed (running as standalone PWA) — nothing to show
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Snoozed or permanently suppressed — respect the user's choice
    if (isSnoozed()) return

    const ios = detectIOS()
    if (ios) {
      setIosDevice(true)
      const timer = setTimeout(() => setVisible(true), PROMPT_DELAY_MS)
      return () => clearTimeout(timer)
    }

    // Chrome / Android: capture and defer the native install prompt.
    // Timer is declared outside the handler so the useEffect cleanup can reach it.
    let timer: ReturnType<typeof setTimeout> | undefined

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      timer = setTimeout(() => setVisible(true), PROMPT_DELAY_MS)
    }

    const onAppInstalled = () => {
      setVisible(false)
      suppressPermanently()
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      clearTimeout(timer)
    }
  }, [])

  // Move focus to the first interactive element when dialog opens
  useEffect(() => {
    if (visible) {
      firstButtonRef.current?.focus()
    }
  }, [visible])

  const dismiss = () => {
    setVisible(false)
    snooze()
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
    if (outcome === 'accepted') {
      suppressPermanently()
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Polite announcement so screen readers notice the dialog */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        Install FleetReq app prompt available
      </div>

      <div
        role="dialog"
        aria-label="Install FleetReq app"
        aria-modal="true"
        className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto card-professional p-4 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <span className="text-sm font-bold text-white">FR</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Install FleetReq</p>
            {iosDevice ? (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Tap <strong>Share</strong> <span aria-hidden="true">⎙</span> then <strong>Add to Home Screen</strong>
              </p>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Add to your home screen for quick access
              </p>
            )}
          </div>

          <button
            ref={iosDevice ? firstButtonRef : undefined}
            onClick={dismiss}
            aria-label="Remind me later"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Install / Not now buttons — only shown on Chrome/Android where we can trigger install */}
        {!iosDevice && (
          <div className="flex gap-2 mt-3">
            <button
              ref={firstButtonRef}
              onClick={handleInstall}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              className="flex-1 text-gray-600 dark:text-gray-400 text-xs px-3 py-2 rounded-lg font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </>
  )
}
