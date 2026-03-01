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
    // localStorage unavailable (private mode / sandboxed iframe) — treat as not snoozed
    return false
  }
}

function snooze() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {
    // localStorage unavailable (private mode / sandbox) — prompt will reappear on next load
  }
}

function suppressPermanently() {
  try { localStorage.setItem(STORAGE_KEY, 'permanent') } catch {
    // localStorage unavailable (private mode / sandbox) — prompt will reappear on next load
  }
}

function detectIOS(): boolean {
  // iPhone / iPod: userAgent includes 'iphone' or 'ipod'
  // iPad iOS 12-: userAgent includes 'ipad'
  // iPad iOS 13+ in desktop mode: reports macOS UA but has multiple touch points
  // Avoids deprecated navigator.platform
  const ua = navigator.userAgent
  if (/iphone|ipod/i.test(ua) || /ipad/i.test(ua)) return true
  return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosDevice, setIosDevice] = useState(false)
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

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
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') suppressPermanently()
    } catch {
      // prompt() failed (non-gesture context, already consumed, install criteria not met)
    } finally {
      setDeferredPrompt(null)
      setVisible(false)
    }
  }

  // Keyboard handler: Escape closes dialog, Tab is trapped inside
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      dismiss()
      return
    }
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault() }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault() }
      }
    }
  }

  return (
    <>
      {/* Live region is always in the DOM so screen readers register it before content is injected */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {visible ? 'Install FleetReq app prompt available' : ''}
      </div>

      {visible && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Install FleetReq app"
          aria-describedby="install-prompt-desc"
          aria-modal="true"
          onKeyDown={handleKeyDown}
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
                <p id="install-prompt-desc" className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Tap <strong>Share</strong> <span aria-hidden="true">⎙</span> then <strong>Add to Home Screen</strong>
                </p>
              ) : (
                <p id="install-prompt-desc" className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
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
      )}
    </>
  )
}
