import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * True when the request carries `Authorization: Bearer $CRON_SECRET`.
 * Vercel Cron sends this header automatically when CRON_SECRET is set on the project;
 * manual/GitHub calls must send it explicitly. Denies everything if CRON_SECRET is unset.
 * Uses a constant-time comparison so the secret can't be probed via response timing.
 */
export function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const provided = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

/**
 * Vercel Cron always invokes routes with GET and a `vercel-cron/1.0` user agent.
 * Cron routes use this to decide whether a GET should execute the job (Vercel Cron)
 * or return a read-only preview (manual call). Authorization is still enforced
 * separately via isCronAuthorized() — this only selects the mode, never grants access.
 */
export function isVercelCron(request: NextRequest): boolean {
  return request.headers.get('user-agent')?.startsWith('vercel-cron') ?? false
}
