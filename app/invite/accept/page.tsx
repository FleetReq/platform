'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteId = searchParams.get('id')

  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'login-required'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!inviteId) {
      setStatus('error')
      setMessage('Invalid invitation link. No invite ID provided.')
      return
    }

    async function checkAuthAndAccept() {
      try {
        if (!supabase) {
          setStatus('error')
          setMessage('Configuration error. Please try again later.')
          return
        }

        // getSession() reads from cookies locally — no network call, no timeout risk.
        // Security validation happens server-side in /api/org/accept-invite via withAuth.
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null

        if (!user) {
          setStatus('login-required')
          setMessage('Please sign in or create an account to accept this invitation.')
          return
        }

        // User is authenticated — accept the invite
        setStatus('accepting')
        const res = await fetch('/api/org/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invite_id: inviteId }),
        })

        const data = await res.json()

        if (!res.ok) {
          // 404 = already accepted — treat as success and redirect
          if (res.status === 404) {
            window.location.href = '/dashboard'
            return
          }
          setStatus('error')
          setMessage(data.error || 'Failed to accept invitation.')
          return
        }

        // Full reload so the nav re-fetches orgs and shows the new switcher
        setStatus('success')
        setMessage('You have successfully joined the organization!')
        setTimeout(() => { window.location.href = '/dashboard' }, 1500)
      } catch (err) {
        console.error('Accept invite error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    checkAuthAndAccept()
  }, [inviteId])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Checking invitation...</p>
        </>
      )}

      {status === 'accepting' && (
        <>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Accepting invitation...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to the Team!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitation Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Link
            href="/dashboard"
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        </>
      )}

      {status === 'login-required' && (
        <>
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/invite/accept?id=${inviteId}`)}`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
          >
            Sign In to Accept
          </Link>
        </>
      )}
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      }>
        <AcceptInviteContent />
      </Suspense>
    </div>
  )
}
