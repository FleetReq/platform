import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (e) {
              // Cookie writes can fail if headers have already been sent.
              // Log so we know if this starts happening in practice.
              console.warn('[auth/callback] Failed to set session cookie:', e)
            }
          },
        },
      }
    )

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        // Successfully established session, redirect to app
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error)
    }
  }

  // Redirect to an error page or back to login
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`)
}