import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { isVercelCron } from '@/lib/cron'

export const dynamic = 'force-dynamic'

// GET /api/cron/keep-alive/ — invoked daily by Vercel Cron (see vercel.json).
// Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when the
// CRON_SECRET env var is set on the project.
// Writes one row and reads it back so Supabase sees real database activity.
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

  const { error: writeError } = await supabase
    .from('keep_alive')
    .upsert({ id: 1, last_ping_at: new Date().toISOString(), source })

  if (writeError) {
    console.error('[keep-alive] write failed:', writeError)
    return NextResponse.json({ error: 'Write failed', details: writeError.message }, { status: 500 })
  }

  const { data, error: readError } = await supabase
    .from('keep_alive')
    .select('last_ping_at, source')
    .eq('id', 1)
    .single()

  if (readError) {
    console.error('[keep-alive] read failed:', readError)
    return NextResponse.json({ error: 'Read failed', details: readError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ...data })
}
