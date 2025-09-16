import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { session } = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'No session provided' }, { status: 400 })
    }

    // Create a direct Supabase client to test session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Set the session on the client
    const { data, error } = await supabase.auth.setSession(session)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Test if we can get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    const response = NextResponse.json({
      success: true,
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email
      } : null,
      userError
    })

    // Set the session cookies manually
    if (session.access_token) {
      const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`

      response.cookies.set(cookieName, JSON.stringify(session), {
        path: '/',
        maxAge: session.expires_in || 3600,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false
      })
    }

    return response

  } catch (error) {
    return NextResponse.json({
      error: 'Force auth failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}