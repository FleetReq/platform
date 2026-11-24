import type { NextRequest } from 'next/server'

/**
 * Vercel Cron always invokes routes with GET and a `vercel-cron/1.0` user agent.
 * Cron routes use this to decide whether a GET should execute the job (Vercel Cron)
 * or return a read-only preview (manual call). Authorization is still enforced
 * separately via CRON_SECRET — this only selects the mode, never grants access.
 */
export function isVercelCron(request: NextRequest): boolean {
  return request.headers.get('user-agent')?.startsWith('vercel-cron') ?? false
}
