'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function OAuthRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    // DISABLED: Now using popup OAuth flow instead of redirects
    // This component is only kept for fallback scenarios

    const searchParams = new URLSearchParams(window.location.search)
    const authCode = searchParams.get('code')
    const hash = window.location.hash

    console.log('OAuthRedirectHandler: pathname:', window.location.pathname, 'code:', authCode ? 'present' : 'none')

    // Only handle redirects if this is clearly a fallback scenario
    // (e.g., popup was blocked and user ended up here)
    if (false && authCode && supabase) {
      console.log('OAuthRedirectHandler: Processing auth code immediately...')

      // Process auth code IMMEDIATELY without any delays
      const processAuthImmediate = async () => {
        if (!supabase) {
          console.error('Supabase client not available')
          router.replace('/mileage')
          return
        }

        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(authCode!)

          if (error) {
            console.error('Session exchange failed:', error)
            router.replace('/mileage')
            return
          }

          if (data.session) {
            console.log('Session established, going to mileage...')

            // Don't wait for server sync - do it in background
            fetch('/api/sync-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session: data.session }),
              credentials: 'include'
            }).catch(console.error)

            // Immediate redirect to mileage
            router.replace('/mileage?auth=success')
          } else {
            router.replace('/mileage')
          }
        } catch (error) {
          console.error('Auth processing failed:', error)
          router.replace('/mileage')
        }
      }

      // Execute immediately
      processAuthImmediate()
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