import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  MAINTENANCE_INTERVALS,
  MAINTENANCE_TYPE_LABELS,
  getMaintenanceStatus,
  getMaintenanceDetail,
  getLatestMaintenanceRecord,
  type MaintenanceStatus,
} from '@/lib/maintenance'
import { PLAN_DISPLAY_NAMES, SITE_URL } from '@/lib/constants'
import { buildUnsubscribeUrl } from '@/app/api/notifications/unsubscribe/route'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resendApiKey = process.env.RESEND_API_KEY || ''
const cronSecret = process.env.CRON_SECRET || ''

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlertItem {
  carId: string
  carLabel: string
  maintenanceType: string
  label: string
  detail: string // e.g. "12,000 mi overdue · 3 mo overdue"
  status: MaintenanceStatus // only 'warning' or 'overdue'
}

interface SentNotification {
  car_id: string
  maintenance_type: string
  status_notified: string
  notified_at: string
}

interface UserDigest {
  userId: string
  email: string
  subscriptionPlan: 'free' | 'personal' | 'business'
  alerts: AlertItem[]
}

type NotificationFrequency = 'daily' | 'weekly' | 'monthly'

// Local schema type for maintenance_notifications_sent (not in generated Supabase types)
type NotificationsDb = {
  public: {
    Tables: {
      maintenance_notifications_sent: {
        Row: { user_id: string; car_id: string; maintenance_type: string; status_notified: string; notified_at: string }
        Insert: { user_id: string; car_id: string; maintenance_type: string; status_notified: string; notified_at: string }
        Update: { user_id?: string; car_id?: string; maintenance_type?: string; status_notified?: string; notified_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ---------------------------------------------------------------------------
// Auth check
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  if (!cronSecret) return false // no secret configured = deny (set CRON_SECRET in env)
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${cronSecret}`
}

// ---------------------------------------------------------------------------
// Frequency helpers
// ---------------------------------------------------------------------------

const FREQUENCY_DAYS: Record<NotificationFrequency, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
}

function isReadyToResend(notifiedAt: string, frequency: NotificationFrequency): boolean {
  const daysSince = (Date.now() - new Date(notifiedAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= FREQUENCY_DAYS[frequency]
}

// ---------------------------------------------------------------------------
// Core logic — compute digests with transition-based dedup + repeating overdue
// ---------------------------------------------------------------------------

async function computeDigests(): Promise<{ digests: UserDigest[]; skipped: number; errors: string[] }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const errors: string[] = []
  let skipped = 0

  // 1. Fetch users who have notifications enabled (+ notification prefs)
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, email, notification_frequency, notification_warning_enabled')
    .eq('email_notifications_enabled', true)

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

    const validFrequencies: NotificationFrequency[] = ['daily', 'weekly', 'monthly']
    const notificationFrequency: NotificationFrequency = validFrequencies.includes(
      profile.notification_frequency as NotificationFrequency
    ) ? (profile.notification_frequency as NotificationFrequency) : 'weekly'
    const notificationWarningEnabled: boolean = profile.notification_warning_enabled ?? true

    // 2. Get user's org and then cars
    const { data: membershipData } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', profile.id)
      .limit(1)
      .maybeSingle()

    if (!membershipData) {
      skipped++
      continue
    }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('subscription_plan')
      .eq('id', membershipData.org_id)
      .maybeSingle()

    // Use org subscription plan
    const plan = (orgData?.subscription_plan || 'free') as 'free' | 'personal' | 'business'

    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, make, model, year, nickname, current_mileage')
      .eq('org_id', membershipData.org_id)

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

    // 4. Get already-sent notifications for this user (include notified_at for frequency checks)
    const { data: sentNotifications } = await supabase
      .from('maintenance_notifications_sent')
      .select('car_id, maintenance_type, status_notified, notified_at')
      .eq('user_id', profile.id)

    // Map: "carId:type:status" -> { notified_at }
    const sentMap = new Map<string, { notified_at: string }>(
      (sentNotifications as SentNotification[] | null || []).map((n) => [
        `${n.car_id}:${n.maintenance_type}:${n.status_notified}`,
        { notified_at: n.notified_at },
      ])
    )

    // 5. Compute statuses and build alerts
    //    - Free:  one-time overdue only (never warning, never repeating)
    //    - Paid:  warning (once per transition, if warning enabled) + overdue (repeating based on frequency)
    const alerts: AlertItem[] = []
    const trackingToDelete: { carId: string; typeKey: string }[] = []

    for (const car of cars) {
      const carRecords = maintenanceRecords.filter(r => r.car_id === car.id)
      const carLabel = car.nickname || `${car.year} ${car.make} ${car.model}`

      for (const typeKey of Object.keys(MAINTENANCE_INTERVALS)) {
        const latest = getLatestMaintenanceRecord(carRecords, typeKey)
        const mileage = car.current_mileage ?? null
        const status = latest
          ? getMaintenanceStatus(typeKey, latest, mileage, plan)
          : 'unknown' as MaintenanceStatus
        const detail = latest ? getMaintenanceDetail(typeKey, latest, mileage, plan) : ''

        const overdueKey = `${car.id}:${typeKey}:overdue`
        const warningKey = `${car.id}:${typeKey}:warning`
        const existingOverdue = sentMap.get(overdueKey)
        const existingWarning = sentMap.get(warningKey)

        if (status === 'good' || status === 'unknown') {
          // Item was serviced — clear tracking so future transitions send fresh alerts
          if (existingOverdue || existingWarning) {
            trackingToDelete.push({ carId: car.id, typeKey })
          }
        } else if (status === 'overdue') {
          if (!existingOverdue) {
            // First time hitting overdue — always alert
            alerts.push({ carId: car.id, carLabel, maintenanceType: typeKey, label: MAINTENANCE_TYPE_LABELS[typeKey] || typeKey, detail, status })
          } else if (plan !== 'free' && isReadyToResend(existingOverdue.notified_at, notificationFrequency)) {
            // Paid user: re-send overdue reminder based on their frequency setting
            alerts.push({ carId: car.id, carLabel, maintenanceType: typeKey, label: MAINTENANCE_TYPE_LABELS[typeKey] || typeKey, detail, status })
          }
          // Free users with existing overdue: skip (one-time only)
        } else if (status === 'warning' && plan !== 'free' && notificationWarningEnabled) {
          if (!existingWarning) {
            // First time hitting warning — alert (paid users with warnings enabled only)
            alerts.push({ carId: car.id, carLabel, maintenanceType: typeKey, label: MAINTENANCE_TYPE_LABELS[typeKey] || typeKey, detail, status })
          }
          // Warning emails are one-time per transition (no repeating)
        }
      }
    }

    // Clean up stale tracking entries (items that returned to good/unknown)
    for (const { carId, typeKey } of trackingToDelete) {
      const { error: delError } = await supabase
        .from('maintenance_notifications_sent')
        .delete()
        .eq('user_id', profile.id)
        .eq('car_id', carId)
        .eq('maintenance_type', typeKey)
      if (delError) {
        errors.push(`Failed to clear tracking for ${profile.id}/${carId}/${typeKey}: ${delError.message}`)
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
  return `${parts.join(', ')} - FleetReq Maintenance Alert`
}

function buildEmailHtml(digest: UserDigest): string {
  const { alerts, userId, subscriptionPlan } = digest
  const unsubscribeUrl = buildUnsubscribeUrl(userId)
  const dashboardUrl = `${SITE_URL}/dashboard`

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

  const renderGroup = (items: AlertItem[], color: string, bgColor: string) => {
    const grouped = groupByCar(items)
    let html = ''
    for (const [car, carItems] of Object.entries(grouped)) {
      html += `<tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:600;color:#1f2937;font-size:14px;margin-bottom:8px;">${car}</div>`
      for (const item of carItems) {
        html += `<div style="margin-bottom:6px;">
          <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:500;color:${color};background:${bgColor};">${item.label}</span>`
        if (item.detail) {
          html += `<div style="margin-top:2px;padding-left:10px;font-size:11px;color:#6b7280;">${item.detail}</div>`
        }
        html += `</div>`
      }
      html += `</td></tr>`
    }
    return html
  }

  let alertsHtml = ''
  if (overdueAlerts.length > 0) {
    alertsHtml += `<tr><td style="padding:12px 16px;background:#fef2f2;font-weight:700;color:#dc2626;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Overdue</td></tr>`
    alertsHtml += renderGroup(overdueAlerts, '#991b1b', '#fee2e2')
  }
  if (warningAlerts.length > 0) {
    alertsHtml += `<tr><td style="padding:12px 16px;background:#fffbeb;font-weight:700;color:#d97706;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Approaching Due</td></tr>`
    alertsHtml += renderGroup(warningAlerts, '#92400e', '#fef3c7')
  }

  const upgradeBlock = subscriptionPlan === 'free'
    ? `<tr><td style="padding:16px;background:#eff6ff;border-radius:0 0 8px 8px;">
        <p style="margin:0;font-size:13px;color:#1e40af;">
          <strong>Get early warnings</strong> before items become overdue.
          <a href="${SITE_URL}/pricing" style="color:#2563eb;text-decoration:underline;">Upgrade to ${PLAN_DISPLAY_NAMES.personal} →</a>
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
      <div style="font-size:13px;color:#6b7280;margin-top:4px;">Maintenance Alert</div>
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
        You're receiving this because a maintenance item changed status.<br/>
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
// Record sent notifications (upsert updates notified_at for repeating alerts)
// ---------------------------------------------------------------------------

async function recordSentAlerts(
  supabase: SupabaseClient<NotificationsDb>,
  userId: string,
  alerts: AlertItem[]
): Promise<string[]> {
  const errors: string[] = []

  for (const alert of alerts) {
    const { error } = await supabase
      .from('maintenance_notifications_sent')
      .upsert(
        {
          user_id: userId,
          car_id: alert.carId,
          maintenance_type: alert.maintenanceType,
          status_notified: alert.status,
          notified_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,car_id,maintenance_type,status_notified' }
      )

    if (error) {
      errors.push(`Failed to record notification for ${alert.maintenanceType}: ${error.message}`)
    }
  }

  return errors
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
      alerts: d.alerts.map(a => `${a.carLabel}: ${a.label} (${a.status}) — ${a.detail}`),
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

      // Record which alerts were sent (upsert updates notified_at for repeating overdue)
      // If this write fails, the email was already sent — log prominently to prevent silent duplicates
      const recordErrors = await recordSentAlerts(supabase, digest.userId, digest.alerts)
      if (recordErrors.length > 0) {
        console.error(`[notifications] DEDUP WRITE FAILURE for user ${digest.userId} — duplicate emails may be sent on next run:`, recordErrors)
        errors.push(...recordErrors)
      }

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

  console.info(`[Maintenance Notifications] Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}`)

  return NextResponse.json({
    mode: 'send',
    timestamp: new Date().toISOString(),
    sent,
    failed,
    skippedUsers: skipped,
    errors,
  })
}
