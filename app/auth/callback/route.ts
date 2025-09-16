import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/mileage'

  if (code) {
    const supabase = await createServerSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error && data.session) {
        // Successfully established session
        const response = NextResponse.redirect(new URL(next, request.url))

        // Ensure cookies are properly set for the session
        const { session } = data
        if (session) {
          // Force refresh to establish proper cookie state
          response.cookies.set(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
            JSON.stringify(session), {
            path: '/',
            maxAge: session.expires_in,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false
          })
        }

        return response
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/mileage?error=auth_callback_error', request.url))
}