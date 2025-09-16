'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OAuthRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    // Check if we have OAuth tokens in the URL hash (from Supabase redirect)
    const hash = window.location.hash
    if (hash.includes('access_token=') && hash.includes('provider_token=')) {
      // This is an OAuth redirect, go to mileage page
      router.replace('/mileage' + hash)
    }
  }, [router])

  return null // This component doesn't render anything
}