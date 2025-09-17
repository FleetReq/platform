'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function OAuthRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    // DISABLED: We now use /auth/callback flow instead of direct home page redirects
    // Only redirect if we have FRESH OAuth tokens in the URL hash
    // This means they just completed OAuth flow and were redirected here
    const hash = window.location.hash

    // Log to debug what's happening
    console.log('OAuthRedirectHandler: Current hash:', hash)
    console.log('OAuthRedirectHandler: Current pathname:', window.location.pathname)

    // Handle PKCE flow - code in search params
    const searchParams = new URLSearchParams(window.location.search)
    const authCode = searchParams.get('code')

    if (authCode && supabase) {
      console.log('OAuthRedirectHandler: Detected PKCE authorization code, processing client-side...')

      // Exchange code for session directly on client
      const processAuth = async () => {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)

          if (error) {
            console.error('Session exchange failed:', error)
            router.replace('/mileage')
            return
          }

          if (data.session) {
            console.log('Session established successfully, redirecting to mileage...')

            // Sync session with server
            try {
              await fetch('/api/sync-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session: data.session }),
                credentials: 'include'
              })
            } catch (syncError) {
              console.error('Session sync failed:', syncError)
            }

            // Go directly to mileage with success flag
            router.replace('/mileage?auth=success')
          } else {
            console.error('No session returned from auth exchange')
            router.replace('/mileage')
          }
        } catch (error) {
          console.error('Auth processing failed:', error)
          router.replace('/mileage')
        }
      }

      processAuth()
      return
    }

    // Handle legacy implicit flow - tokens in hash
    if (false && hash.includes('access_token=') &&
        hash.includes('provider_token=') &&
        hash.includes('expires_at=')) {

      console.log('OAuthRedirectHandler: Detected OAuth tokens, redirecting to mileage page...')

      // This is a fresh OAuth redirect from GitHub -> Supabase -> here
      // Redirect to mileage page with auth=success parameter and preserve tokens in hash
      router.replace('/mileage?auth=success' + hash)

      // Clear the hash from homepage after redirect to prevent future redirects
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [router])

  return null // This component doesn't render anything
}