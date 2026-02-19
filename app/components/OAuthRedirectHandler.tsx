'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function OAuthRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    // Handle OAuth codes that end up on home page (due to Site URL override)
    const searchParams = new URLSearchParams(window.location.search)
    const authCode = searchParams.get('code')
    const hash = window.location.hash

    // Handle OAuth popup that redirects to homepage due to Supabase Site URL override
    if (authCode && window.opener && supabase) {
      // Close popup immediately to prevent flash
      try {
        window.close()
      } catch {
        // Fallback if close() fails
        window.location.href = 'about:blank'
      }

      // Process auth in background after closing
      const processPopupAuth = async () => {
        if (!supabase) {
          console.error('Supabase client not available for popup auth')
          return
        }

        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
          const authChannel = new BroadcastChannel('supabase-oauth')

          if (error) {
            console.error('Session exchange failed:', error)
            authChannel.postMessage({
              type: 'OAUTH_ERROR',
              error: error.message
            })
          } else if (data.session) {
            // Sync session with server in background
            fetch('/api/sync-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session: data.session }),
              credentials: 'include'
            }).catch((err) => console.error('[OAuthRedirectHandler] Session sync failed:', err))

            // Notify parent window of success
            authChannel.postMessage({
              type: 'OAUTH_SUCCESS',
              session: data.session
            })
          } else {
            console.error('No session returned from auth exchange')
            authChannel.postMessage({
              type: 'OAUTH_ERROR',
              error: 'No session returned'
            })
          }
        } catch (error) {
          console.error('Popup auth processing failed:', error)
          const authChannel = new BroadcastChannel('supabase-oauth')
          authChannel.postMessage({
            type: 'OAUTH_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Execute auth processing in background; surface any unexpected rejection
      processPopupAuth().catch((err) => console.error('[OAuthRedirectHandler] Unhandled popup auth error:', err))
    }
  }, [router])

  return null // This component doesn't render anything
}