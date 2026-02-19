import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const allCookies = request.cookies.getAll()

    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'No supabase client' })
    }

    const { data: { user }, error } = await supabase.auth.getUser()

    return NextResponse.json({
      hasUser: !!user,
      userEmail: user?.email || null,
      userId: user?.id || null,
      authError: error?.message || null,
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      supabaseCookies: allCookies.filter(c => c.name.includes('sb-')).map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0
      }))
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Exception',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}
