'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

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
        try {
          window.close()
        } catch {
          window.location.href = 'about:blank'
        }
        return
      }

      // Initialize Supabase client directly in popup
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase environment variables not found')
        authChannel.postMessage({
          type: 'OAUTH_ERROR',
          error: 'Configuration error'
        })
        try {
          window.close()
        } catch {
          window.location.href = 'about:blank'
        }
        return
      }

      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

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
            try {
              window.close()
            } catch {
              window.location.href = 'about:blank'
            }
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

            // Close the popup window immediately
            try {
              window.close()
            } catch {
              window.location.href = 'about:blank'
            }
          } else {
            console.error('No session returned from auth exchange')
            authChannel.postMessage({
              type: 'OAUTH_ERROR',
              error: 'No session returned'
            })
            try {
              window.close()
            } catch {
              window.location.href = 'about:blank'
            }
          }
        } catch (error) {
          console.error('Auth processing failed:', error)
          authChannel.postMessage({
            type: 'OAUTH_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          try {
            window.close()
          } catch {
            window.location.href = 'about:blank'
          }
        }
      } else {
        console.error('No authorization code provided or Supabase not available')
        authChannel.postMessage({
          type: 'OAUTH_ERROR',
          error: 'No authorization code provided'
        })
        try {
          window.close()
        } catch {
          window.location.href = 'about:blank'
        }
      }
    }

    handleAuthCallback()
  }, [])

  // Return null to prevent any visual flash
  return null
}