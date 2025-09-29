'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

interface AuthComponentProps {
  onAuthChange: (user: User | null) => void
}

export default function AuthComponent({ onAuthChange }: AuthComponentProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      if (!supabase) return

      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      onAuthChange(session?.user ?? null)
    }

    getSession()

    // Listen for auth changes
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        setUser(session?.user ?? null)
        setLoading(false)

        // Only call onAuthChange for actual state changes, not initial load
        if (event !== 'INITIAL_SESSION') {
          onAuthChange(session?.user ?? null)
        }

        if (event === 'SIGNED_IN') {
          setError(null)
        }

        if (event === 'SIGNED_OUT') {
          setError(null)
          setEmail('')
          setPassword('')
          setFullName('')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    setIsSigningIn(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Clear form
      setEmail('')
      setPassword('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSigningIn(false)
    }
  }

  const signUpWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    setIsSigningIn(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) throw error

      setError('Check your email for the confirmation link!')
      // Clear form
      setEmail('')
      setPassword('')
      setFullName('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSigningIn(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!supabase) return

    setIsSigningIn(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: `${window.location.origin}/auth/popup-close`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error

      if (data?.url) {
        const popup = window.open(data.url, 'oauth', 'width=500,height=600')

        // Listen for OAuth success/error messages from popup
        const authChannel = new BroadcastChannel('supabase-oauth')

        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'OAUTH_SUCCESS') {
            console.log('OAuth success received')
            authChannel.close()
            popup?.close()
            setIsSigningIn(false)
            // Trigger a page reload to get the new session
            window.location.reload()
          } else if (event.data.type === 'OAUTH_ERROR') {
            console.error('OAuth error:', event.data.error)
            authChannel.close()
            popup?.close()
            setError(event.data.error || 'OAuth authentication failed')
            setIsSigningIn(false)
          }
        }

        authChannel.addEventListener('message', handleMessage)

        // Fallback: poll for popup close
        const pollTimer = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(pollTimer)
              authChannel.close()
              setIsSigningIn(false)
            }
          } catch {
            clearInterval(pollTimer)
            authChannel.close()
            setIsSigningIn(false)
          }
        }, 1000)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsSigningIn(false)
    }
  }

  // Legacy GitHub OAuth for existing users (temporary during migration)
  const signInWithGitHub = async () => {
    if (!supabase) return

    setIsSigningIn(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          skipBrowserRedirect: true,
          redirectTo: `${window.location.origin}/auth/popup-close`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error

      if (data?.url) {
        const popup = window.open(data.url, 'oauth', 'width=500,height=600')

        // Listen for OAuth success/error messages from popup
        const authChannel = new BroadcastChannel('supabase-oauth')

        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'OAUTH_SUCCESS') {
            console.log('OAuth success received')
            authChannel.close()
            popup?.close()
            setIsSigningIn(false)
            // Trigger a page reload to get the new session
            window.location.reload()
          } else if (event.data.type === 'OAUTH_ERROR') {
            console.error('OAuth error:', event.data.error)
            authChannel.close()
            popup?.close()
            setError(event.data.error || 'OAuth authentication failed')
            setIsSigningIn(false)
          }
        }

        authChannel.addEventListener('message', handleMessage)

        // Fallback: poll for popup close
        const pollTimer = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(pollTimer)
              authChannel.close()
              setIsSigningIn(false)
            }
          } catch {
            clearInterval(pollTimer)
            authChannel.close()
            setIsSigningIn(false)
          }
        }, 1000)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsSigningIn(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        setError('Failed to sign out')
      } else {
        console.log('Successfully signed out')
        // Force refresh to ensure clean state
        window.location.reload()
      }
    } catch (error) {
      console.error('Sign out failed:', error)
      setError('Failed to sign out')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-blue-400">Loading...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex-1">
          <div className="text-white font-medium">
            {user.user_metadata?.full_name || user.email}
          </div>
          <div className="text-gray-400 text-sm">{user.email}</div>
        </div>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Fleet Management
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Social Auth Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={signInWithGoogle}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Temporary GitHub option for existing users */}
        <button
          onClick={signInWithGitHub}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Continue with GitHub (Legacy)
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-700"></div>
        <div className="text-gray-400 text-sm">or</div>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={authMode === 'signin' ? signInWithEmail : signUpWithEmail} className="space-y-4">
        {authMode === 'signup' && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Your full name"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Your password"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isSigningIn}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {isSigningIn ? 'Please wait...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {authMode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  )
}