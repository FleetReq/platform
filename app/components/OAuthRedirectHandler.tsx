'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

    if (authCode) {
      console.log('OAuthRedirectHandler: Detected PKCE authorization code, redirecting to callback...')

      // Redirect to our callback route with the code
      router.replace(`/auth/callback?code=${authCode}&next=/mileage`)
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