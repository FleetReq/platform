'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function PopupCloseHandler() {
  useEffect(() => {
    const handleAuthAndClose = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      const authChannel = new BroadcastChannel('supabase-oauth')

      if (error) {
        authChannel.postMessage({
          type: 'OAUTH_ERROR',
          error: error
        })
        window.close()
        return
      }

      if (code && supabase) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            authChannel.postMessage({
              type: 'OAUTH_ERROR',
              error: exchangeError.message
            })
          } else if (data.session) {
            // Sync session with server before notifying parent — the parent
            // will immediately call API routes, which require the server cookie.
            try {
              const syncRes = await fetch('/api/sync-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session: data.session }),
                credentials: 'include'
              })
              if (!syncRes.ok) {
                console.error('[popup-close] Session sync returned', syncRes.status)
              }
            } catch (err) {
              console.error('[popup-close] Session sync failed:', err)
            }

            authChannel.postMessage({
              type: 'OAUTH_SUCCESS',
              session: data.session
            })
          } else {
            authChannel.postMessage({
              type: 'OAUTH_ERROR',
              error: 'No session returned'
            })
          }
        } catch (error) {
          authChannel.postMessage({
            type: 'OAUTH_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      } else {
        authChannel.postMessage({
          type: 'OAUTH_ERROR',
          error: 'No authorization code provided'
        })
      }

      // Close popup immediately
      try {
        window.close()
      } catch {
        // Fallback if close() fails
        window.location.href = 'about:blank'
      }
    }

    // Execute immediately with no delay
    handleAuthAndClose()
  }, [])

  // Return null to prevent any rendering
  return null
}