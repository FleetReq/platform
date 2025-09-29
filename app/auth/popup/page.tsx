'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function AuthPopupCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      console.log('Auth popup callback loaded - code:', code ? 'present' : 'none', 'error:', error || 'none')

      const authChannel = new BroadcastChannel('supabase-oauth')

      if (error) {
        console.error('OAuth error:', error)
        authChannel.postMessage({
          type: 'OAUTH_ERROR',
          error: error
        })
        return
      }

      if (code && supabase) {
        try {
          console.log('Exchanging code for session in popup...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Session exchange failed:', exchangeError)
            authChannel.postMessage({
              type: 'OAUTH_ERROR',
              error: exchangeError.message
            })
            return
          }

          if (data.session) {
            console.log('Session established successfully in popup')

            // Sync session with server in background
            fetch('/api/sync-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session: data.session }),
              credentials: 'include'
            }).catch(console.error)

            // Notify parent window of success
            authChannel.postMessage({
              type: 'OAUTH_SUCCESS',
              session: data.session
            })

            // Close the popup window
            setTimeout(() => {
              window.close()
            }, 1000)
          } else {
            console.error('No session returned from auth exchange')
            authChannel.postMessage({
              type: 'OAUTH_ERROR',
              error: 'No session returned'
            })
          }
        } catch (error) {
          console.error('Auth processing failed:', error)
          authChannel.postMessage({
            type: 'OAUTH_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      } else {
        console.error('No authorization code provided or Supabase not available')
        authChannel.postMessage({
          type: 'OAUTH_ERROR',
          error: 'No authorization code provided'
        })
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  )
}