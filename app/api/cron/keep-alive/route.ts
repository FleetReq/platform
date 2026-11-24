import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { isVercelCron } from '@/lib/cron'

export const dynamic = 'force-dynamic'

// GET /api/cron/keep-alive/ — invoked daily by Vercel Cron (see vercel.json).
// Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when the
// CRON_SECRET env var is set on the project.
// Upserts one row (returning it) so Supabase sees real database write activity.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
  }

  const source = isVercelCron(request) ? 'vercel-cron' : 'manual'

  const { data, error } = await supabase
    .from('keep_alive')
    .upsert({ id: 1, last_ping_at: new Date().toISOString(), source })
    .select('last_ping_at, source')
    .single()

  if (error) {
    console.error('[keep-alive] write failed:', error)
    return NextResponse.json({ error: 'Write failed', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ...data })
}
