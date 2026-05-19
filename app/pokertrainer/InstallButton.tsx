'use client'

import { useState, useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [hidden, setHidden] = useState(true)
  const [showTip, setShowTip] = useState(false)
  const tipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const ua = navigator.userAgent
    const ios = /iphone|ipod|ipad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)

    if (ios) {
      setIsIOS(true)
      setHidden(false)
      return
    }

    // Always show on Android/Chrome — may or may not get native prompt
    setHidden(false)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setHidden(true)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    if (!showTip) return
    const onDown = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setShowTip(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showTip])

  const handleClick = async () => {
    if (prompt) {
      await prompt.prompt()
      setPrompt(null)
      setHidden(true)
      return
    }
    // No native prompt available (iOS, or Android where Chrome already has it installed) — show instructions
    setShowTip(v => !v)
  }

  if (hidden) return null

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={handleClick}
        aria-label="Add Poker Trainer to home screen"
        title="Add to Home Screen"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
          <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
        </svg>
      </button>

      {showTip && (
        <div
          ref={tipRef}
          role="tooltip"
          className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-white/12 bg-[#1a1d2a] shadow-2xl p-3 text-xs text-white/80 leading-relaxed"
        >
          <p className="font-semibold text-white mb-1">Add to Home Screen</p>
          {isIOS ? (
            <p>Tap the <strong className="text-white">Share</strong> icon <span aria-hidden="true" className="text-base leading-none">⎙</span> at the bottom of Safari, then <strong className="text-white">Add to Home Screen</strong>.</p>
          ) : (
            <p>Tap the <strong className="text-white">⋮ menu</strong> in Chrome, then tap <strong className="text-white">Add to Home screen</strong>.</p>
          )}
          <button
            onClick={() => setShowTip(false)}
            className="mt-2 text-white/40 hover:text-white/70 text-[10px] uppercase tracking-wider"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  )
}
