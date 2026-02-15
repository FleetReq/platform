import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  MAINTENANCE_INTERVALS,
  MAINTENANCE_TYPE_LABELS,
  getMaintenanceStatus,
  getLatestMaintenanceRecord,
  type MaintenanceStatus,
} from '@/lib/maintenance'
import { buildUnsubscribeUrl } from '@/app/api/notifications/unsubscribe/route'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resendApiKey = process.env.RESEND_API_KEY || ''
const cronSecret = process.env.CRON_SECRET || ''

// Minimum gap between emails for the same user (6.5 days in ms)
const MIN_GAP_MS = 6.5 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlertItem {
  carLabel: string
  maintenanceType: string
  label: string
  status: MaintenanceStatus
}

interface UserDigest {
  userId: string
  email: string
  subscriptionPlan: 'free' | 'personal' | 'business'
  alerts: AlertItem[]
}

// ---------------------------------------------------------------------------
// Auth check
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  if (!cronSecret) return true // no secret configured = allow (dev)
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${cronSecret}`
}

// ---------------------------------------------------------------------------
// Core logic — compute digests for all eligible users
// ---------------------------------------------------------------------------

async function computeDigests(): Promise<{ digests: UserDigest[]; skipped: number; errors: string[] }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const errors: string[] = []
  let skipped = 0

  // 1. Fetch users who are eligible for a notification
  const cutoff = new Date(Date.now() - MIN_GAP_MS).toISOString()

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, email, subscription_plan')
    .eq('email_notifications_enabled', true)
    .or(`last_notification_sent_at.is.null,last_notification_sent_at.lt.${cutoff}`)

  if (profilesError) {
    errors.push(`Failed to fetch profiles: ${profilesError.message}`)
    return { digests: [], skipped: 0, errors }
  }

  if (!profiles || profiles.length === 0) {
    return { digests: [], skipped: 0, errors }
  }

  const digests: UserDigest[] = []

  for (const profile of profiles) {
    // Resolve email — profile.email may be NULL
    let email = profile.email as string | null
    if (!email) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)
      if (authError || !authUser?.user?.email) {
        errors.push(`No email for user ${profile.id}`)
        skipped++
        continue
      }
      email = authUser.user.email
    }

    const plan = (profile.subscription_plan || 'free') as 'free' | 'personal' | 'business'

    // 2. Get user's cars
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, make, model, year, nickname, current_mileage')
      .eq('user_id', profile.id)

    if (carsError || !cars || cars.length === 0) {
      skipped++
      continue
    }

    // 3. Get all maintenance records for those cars
    const carIds = cars.map(c => c.id)
    const { data: records, error: recordsError } = await supabase
      .from('maintenance_records')
      .select('*')
      .in('car_id', carIds)

    if (recordsError) {
      errors.push(`Failed to fetch records for user ${profile.id}: ${recordsError.message}`)
      skipped++
      continue
    }

    const maintenanceRecords = records || []

    // 4. Compute statuses
    const alerts: AlertItem[] = []

    for (const car of cars) {
      const carRecords = maintenanceRecords.filter(r => r.car_id === car.id)
      const carLabel = car.nickname || `${car.year} ${car.make} ${car.model}`

      for (const typeKey of Object.keys(MAINTENANCE_INTERVALS)) {
        const latest = getLatestMaintenanceRecord(carRecords, typeKey)
        if (!latest) continue // skip types with no records (unknown)

        const status = getMaintenanceStatus(typeKey, latest, car.current_mileage ?? null, plan)

        // Free tier only gets overdue, Personal/Business get warning + overdue
        if (status === 'overdue') {
          alerts.push({ carLabel, maintenanceType: typeKey, label: MAINTENANCE_TYPE_LABELS[typeKey] || typeKey, status })
        } else if (status === 'warning' && plan !== 'free') {
          alerts.push({ carLabel, maintenanceType: typeKey, label: MAINTENANCE_TYPE_LABELS[typeKey] || typeKey, status })
        }
      }
    }

    if (alerts.length === 0) {
      skipped++
      continue
    }

    digests.push({ userId: profile.id, email, subscriptionPlan: plan, alerts })
  }

  return { digests, skipped, errors }
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------

function buildEmailSubject(alerts: AlertItem[]): string {
  const overdueCount = alerts.filter(a => a.status === 'overdue').length
  const warningCount = alerts.filter(a => a.status === 'warning').length

  const parts: string[] = []
  if (overdueCount > 0) parts.push(`🔴 ${overdueCount} overdue`)
  if (warningCount > 0) parts.push(`🟡 ${warningCount} upcoming`)
  return `${parts.join(', ')} - FleetReq Weekly Summary`
}

function buildEmailHtml(digest: UserDigest): string {
  const { alerts, userId, subscriptionPlan } = digest
  const unsubscribeUrl = buildUnsubscribeUrl(userId)
  const dashboardUrl = 'https://fleetreq.vercel.app/dashboard'

  const overdueAlerts = alerts.filter(a => a.status === 'overdue')
  const warningAlerts = alerts.filter(a => a.status === 'warning')

  // Group alerts by car
  const groupByCar = (items: AlertItem[]) => {
    const grouped: Record<string, AlertItem[]> = {}
    for (const item of items) {
      if (!grouped[item.carLabel]) grouped[item.carLabel] = []
      grouped[item.carLabel].push(item)
    }
    return grouped
  }

  const renderGroup = (items: AlertItem[], color: string, bgColor: string, statusLabel: string) => {
    const grouped = groupByCar(items)
    let html = ''
    for (const [car, carItems] of Object.entries(grouped)) {
      html += `<tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:600;color:#1f2937;font-size:14px;margin-bottom:6px;">${car}</div>`
      for (const item of carItems) {
        html += `<div style="display:inline-block;margin:2px 4px 2px 0;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:500;color:${color};background:${bgColor};">${item.label}</div>`
      }
      html += `<div style="margin-top:4px;font-size:11px;color:#9ca3af;">${statusLabel}</div>
      </td></tr>`
    }
    return html
  }

  let alertsHtml = ''
  if (overdueAlerts.length > 0) {
    alertsHtml += `<tr><td style="padding:12px 16px;background:#fef2f2;font-weight:700;color:#dc2626;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Overdue</td></tr>`
    alertsHtml += renderGroup(overdueAlerts, '#991b1b', '#fee2e2', 'Past due — service recommended')
  }
  if (warningAlerts.length > 0) {
    alertsHtml += `<tr><td style="padding:12px 16px;background:#fffbeb;font-weight:700;color:#d97706;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Approaching Due</td></tr>`
    alertsHtml += renderGroup(warningAlerts, '#92400e', '#fef3c7', 'Due soon — schedule service')
  }

  const upgradeBlock = subscriptionPlan === 'free'
    ? `<tr><td style="padding:16px;background:#eff6ff;border-radius:0 0 8px 8px;">
        <p style="margin:0;font-size:13px;color:#1e40af;">
          <strong>Get early warnings</strong> before items become overdue.
          <a href="https://fleetreq.vercel.app/pricing" style="color:#2563eb;text-decoration:underline;">Upgrade to Personal →</a>
        </p>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <tr><td style="padding:24px 24px 16px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:#111827;">FleetReq</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px;">Weekly Maintenance Summary</div>
    </td></tr>

    <!-- Alerts -->
    <tr><td style="padding:0 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${alertsHtml}
        ${upgradeBlock}
      </table>
    </td></tr>

    <!-- CTA -->
    <tr><td style="padding:24px;text-align:center;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#ffffff;font-weight:600;font-size:14px;border-radius:8px;text-decoration:none;">View Dashboard</a>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5;">
        You're receiving this because you have maintenance items that need attention.<br/>
        <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> · <a href="${dashboardUrl}" style="color:#9ca3af;text-decoration:underline;">Manage preferences</a>
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Send via Resend
// ---------------------------------------------------------------------------

async function sendEmail(to: string, subject: string, html: string, unsubscribeUrl: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FleetReq <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { success: false, error: `Resend ${res.status}: ${body}` }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// GET — Preview (dry run)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { digests, skipped, errors } = await computeDigests()

  return NextResponse.json({
    mode: 'preview',
    timestamp: new Date().toISOString(),
    emailsToSend: digests.length,
    skippedUsers: skipped,
    errors,
    digests: digests.map(d => ({
      userId: d.userId,
      email: d.email,
      plan: d.subscriptionPlan,
      overdueCount: d.alerts.filter(a => a.status === 'overdue').length,
      warningCount: d.alerts.filter(a => a.status === 'warning').length,
      alerts: d.alerts.map(a => `${a.carLabel}: ${a.label} (${a.status})`),
    })),
  })
}

// ---------------------------------------------------------------------------
// POST — Send emails
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const { digests, skipped, errors } = await computeDigests()

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  let sent = 0
  let failed = 0

  for (const digest of digests) {
    const subject = buildEmailSubject(digest.alerts)
    const html = buildEmailHtml(digest)
    const unsubscribeUrl = buildUnsubscribeUrl(digest.userId)

    const result = await sendEmail(digest.email, subject, html, unsubscribeUrl)

    if (result.success) {
      sent++
      // Update last_notification_sent_at
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ last_notification_sent_at: new Date().toISOString() })
        .eq('id', digest.userId)

      if (updateError) {
        errors.push(`Failed to update timestamp for ${digest.userId}: ${updateError.message}`)
      }
    } else {
      failed++
      errors.push(`Failed to send to ${digest.email}: ${result.error}`)
    }
  }

  console.log(`[Maintenance Notifications] Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}`)

  return NextResponse.json({
    mode: 'send',
    timestamp: new Date().toISOString(),
    sent,
    failed,
    skippedUsers: skipped,
    errors,
  })
}
