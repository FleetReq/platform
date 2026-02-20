import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { session } = await request.json()

    if (!session?.access_token) {
      return NextResponse.json({ error: 'No valid session provided' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
    }

    // Verify the access token is valid before trusting it
    const supabase = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user }, error } = await supabase.auth.getUser(session.access_token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 })
    }

    // Rate limit by user ID
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.AUTH)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    const response = NextResponse.json({ success: true })

    const cookieName = `sb-${url.split('//')[1]?.split('.')[0]}-auth-token`
    response.cookies.set(cookieName, JSON.stringify(session), {
      path: '/',
      maxAge: session.expires_in || 3600,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false
    })

    return response

  } catch (error) {
    console.error('[sync-session] Unexpected error:', error)
    return NextResponse.json({ error: 'Session sync failed' }, { status: 500 })
  }
}
