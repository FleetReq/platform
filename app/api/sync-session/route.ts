import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { session } = await request.json()

    if (!session?.access_token) {
      return NextResponse.json({ error: 'No valid session provided' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })

    // Set the session cookie manually for server-side access
    const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`

    response.cookies.set(cookieName, JSON.stringify(session), {
      path: '/',
      maxAge: session.expires_in || 3600,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false
    })

    return response

  } catch (error) {
    return NextResponse.json({
      error: 'Session sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}