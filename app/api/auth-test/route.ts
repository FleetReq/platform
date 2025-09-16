import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

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

    // Check what cookies are available
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(cookie =>
      cookie.name.includes('supabase') ||
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    )

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
      cookies: {
        total: allCookies.length,
        supabase_related: supabaseCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0
        }))
      },
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