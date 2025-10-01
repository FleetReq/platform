import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    const supabase = await createServerSupabaseClient()
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
