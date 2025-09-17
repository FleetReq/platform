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

    if (false && hash.includes('access_token=') &&
        hash.includes('provider_token=') &&
        hash.includes('expires_at=')) {

      // This is a fresh OAuth redirect from GitHub -> Supabase -> here
      // Redirect to mileage page with the tokens
      router.replace('/mileage' + hash)

      // Clear the hash from homepage after redirect to prevent future redirects
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [router])

  return null // This component doesn't render anything
}