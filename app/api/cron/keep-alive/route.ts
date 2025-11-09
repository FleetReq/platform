import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for system operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials for keep-alive')
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Perform multiple operations to ensure Supabase recognizes activity
    const operations = []

    // 1. Read from multiple tables
    operations.push(
      supabase.from('user_profiles').select('id').limit(1),
      supabase.from('cars').select('id').limit(1),
      supabase.from('fill_ups').select('id').limit(1),
      supabase.from('maintenance_records').select('id').limit(1)
    )

    // 2. Execute all operations
    const results = await Promise.allSettled(operations)

    // Check for errors (but don't fail if tables are empty)
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason)

    if (errors.length > 0) {
      console.error('Some keep-alive operations failed:', errors)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Supabase keep-alive ping successful',
      operations: results.length,
      errors: errors.length
    })
  } catch (error) {
    console.error('Keep-alive cron failed:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
