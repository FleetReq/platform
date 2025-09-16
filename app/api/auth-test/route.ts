import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get the authenticated user from server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      } : null,
      session: session ? {
        access_token: session.access_token ? 'present' : 'missing',
        expires_at: session.expires_at
      } : null,
      errors: {
        authError,
        sessionError
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Auth test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}