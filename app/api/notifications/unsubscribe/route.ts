import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { SITE_URL } from '@/lib/constants'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Generate an HMAC token for a given userId so unsubscribe links can't be forged.
 * Requires UNSUBSCRIBE_SECRET env var — never falls back to the service role key.
 */
export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET env var is required')
  }
  return crypto.createHmac('sha256', secret).update(userId).digest('hex')
}

/**
 * Build the full unsubscribe URL for a given user.
 */
export function buildUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId)
  return `${SITE_URL}/api/notifications/unsubscribe?uid=${userId}&token=${token}`
}

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - FleetReq</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 60px auto; padding: 0 20px; color: #1a1a1a; }
    h1 { font-size: 1.4rem; }
    p { line-height: 1.6; color: #555; }
    a { color: #2563eb; }
    .card { background: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
  </div>
</body>
</html>`
}

/**
 * GET /api/notifications/unsubscribe?uid=...&token=...
 * One-click unsubscribe from maintenance notification emails.
 *
 * GET /api/notifications/unsubscribe?uid=...&token=...&resubscribe=1
 * Re-subscribe (shown as a link on the confirmation page).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('uid')
  const token = searchParams.get('token')
  const resubscribe = searchParams.get('resubscribe') === '1'

  // Rate limit before any processing — keyed on uid to stop repeated bot triggers
  if (userId) {
    const rateLimitResult = rateLimit(`unsubscribe:${userId}`, RATE_LIMITS.ANONYMOUS)
    if (!rateLimitResult.success) {
      return new NextResponse(
        htmlPage('Too Many Requests', '<h1>Too many requests</h1><p>Please wait a few minutes and try again.</p>'),
        { status: 429, headers: { 'Content-Type': 'text/html' } }
      )
    }
  }

  if (!userId || !token) {
    return new NextResponse(
      htmlPage('Invalid Link', '<h1>Invalid link</h1><p>This unsubscribe link is missing required parameters.</p>'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // Verify HMAC — length check required: timingSafeEqual throws if buffer lengths differ
  const expectedToken = generateUnsubscribeToken(userId)
  if (token.length !== expectedToken.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
    return new NextResponse(
      htmlPage('Invalid Link', '<h1>Invalid link</h1><p>This unsubscribe link has expired or is invalid.</p>'),
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return new NextResponse(
      htmlPage('Error', '<h1>Server error</h1><p>Please try again later.</p>'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const newValue = resubscribe

  const { error } = await supabase
    .from('user_profiles')
    .update({ email_notifications_enabled: newValue })
    .eq('id', userId)

  if (error) {
    console.error('[Unsubscribe] Failed to update preference:', error)
    return new NextResponse(
      htmlPage('Error', '<h1>Something went wrong</h1><p>We could not update your preference. Please try again or update in your dashboard settings.</p>'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (resubscribe) {
    const unsubUrl = `/api/notifications/unsubscribe?uid=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`
    return new NextResponse(
      htmlPage('Re-subscribed', `
        <h1>You're re-subscribed!</h1>
        <p>You'll receive weekly maintenance reminders again.</p>
        <p>You can also manage this in your <a href="/dashboard">dashboard settings</a>.</p>
        <p style="margin-top: 16px;"><a href="${unsubUrl}">Unsubscribe again</a></p>
      `),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const resubUrl = `/api/notifications/unsubscribe?uid=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}&resubscribe=1`
  return new NextResponse(
    htmlPage('Unsubscribed', `
      <h1>You've been unsubscribed</h1>
      <p>You will no longer receive weekly maintenance reminder emails from FleetReq.</p>
      <p>You can also manage this in your <a href="/dashboard">dashboard settings</a>.</p>
      <p style="margin-top: 16px;">Changed your mind? <a href="${resubUrl}">Re-subscribe</a></p>
    `),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
