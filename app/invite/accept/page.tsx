'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteId = searchParams.get('id')

  const [status, setStatus] = useState<'loading' | 'review' | 'accepting' | 'declining' | 'success' | 'declined' | 'error' | 'login-required'>('loading')
  const [message, setMessage] = useState('')
  const [inviteDetails, setInviteDetails] = useState<{ org_name: string; role: string; invited_email: string } | null>(null)

  useEffect(() => {
    if (!inviteId) {
      setStatus('error')
      setMessage('Invalid invitation link. No invite ID provided.')
      return
    }

    async function loadInvite() {
      try {
        if (!supabase) {
          setStatus('error')
          setMessage('Configuration error. Please try again later.')
          return
        }

        // Fetch invite details first (no auth required)
        const detailsRes = await fetch(`/api/org/accept-invite?id=${encodeURIComponent(inviteId!)}`)
        if (!detailsRes.ok) {
          if (detailsRes.status === 404) {
            setStatus('error')
            setMessage('This invitation has already been accepted or does not exist.')
            return
          }
          setStatus('error')
          setMessage('Failed to load invitation details.')
          return
        }
        const details = await detailsRes.json()
        setInviteDetails(details)

        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null

        if (!user) {
          setStatus('login-required')
          setMessage('Please sign in or create an account to accept this invitation.')
          return
        }

        // User is logged in — show review screen, let them decide
        setStatus('review')
      } catch (err) {
        console.error('Load invite error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    loadInvite()
  }, [inviteId])

  async function handleAccept() {
    try {
      if (!supabase || !inviteId) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setStatus('login-required'); return }

      setStatus('accepting')
      const res = await fetch('/api/org/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 404) {
          window.location.href = '/dashboard'
          return
        }
        setStatus('error')
        setMessage(data.error || 'Failed to accept invitation.')
        return
      }

      setStatus('success')
      setMessage(`You have successfully joined ${inviteDetails?.org_name || 'the organization'}!`)
      setTimeout(() => { window.location.href = '/dashboard' }, 1500)
    } catch (err) {
      console.error('Accept invite error:', err)
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
    }
  }

  async function handleDecline() {
    try {
      if (!supabase || !inviteId) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setStatus('login-required'); return }

      setStatus('declining')
      const res = await fetch('/api/org/accept-invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId }),
      })
      if (res.ok || res.status === 404) {
        setStatus('declined')
        setMessage('Invitation declined. The organization owner can resend it at any time.')
      } else {
        const data = await res.json()
        setStatus('error')
        setMessage(data.error || 'Failed to decline invitation.')
      }
    } catch {
      setStatus('error')
      setMessage('An unexpected error occurred.')
    }
  }

  const roleLabel = inviteDetails?.role
    ? inviteDetails.role.charAt(0).toUpperCase() + inviteDetails.role.slice(1)
    : 'Member'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading invitation...</p>
        </>
      )}

      {status === 'review' && inviteDetails && (
        <>
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You&apos;re Invited!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">You&apos;ve been invited to join</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{inviteDetails.org_name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">as a <span className="font-medium text-blue-600 dark:text-blue-400">{roleLabel}</span></p>
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Accept Invitation
            </button>
            <button
              onClick={handleDecline}
              className="w-full bg-transparent border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        </>
      )}

      {status === 'accepting' && (
        <>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Accepting invitation...</p>
        </>
      )}

      {status === 'declining' && (
        <>
          <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Declining invitation...</p>
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

      {status === 'declined' && (
        <>
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitation Declined</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
          >
            Go to Dashboard
          </Link>
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
          {inviteDetails && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              You&apos;ve been invited to join <span className="font-semibold">{inviteDetails.org_name}</span> as a {inviteDetails.role}.
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <div className="space-y-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(`/invite/accept?id=${inviteId}`)}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              Sign In to Accept
            </Link>
            <button
              onClick={handleDecline}
              className="block w-full bg-transparent border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              Decline Invitation
            </button>
          </div>
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
