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
        const redirectUrl = new URL(next, request.url)
        redirectUrl.searchParams.set('auth', 'success')
        const response = NextResponse.redirect(redirectUrl)

        // Ensure cookies are properly set for the session
        const { session } = data
        if (session) {
          // Set the session cookie manually for server-side access
          const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
          response.cookies.set(cookieName, JSON.stringify(session), {
            path: '/',
            maxAge: session.expires_in || 3600,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false
          })

          // Session will be synced client-side via the auth=success parameter
        }

        return response
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/mileage?error=auth_callback_error', request.url))
}