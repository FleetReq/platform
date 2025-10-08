import { createRouteHandlerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)

    // Simple query to keep Supabase active
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Supabase keep-alive ping successful'
    })
  } catch (error) {
    console.error('Keep-alive cron failed:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
