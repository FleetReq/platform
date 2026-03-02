import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { withAuth, errorResponse } from '@/lib/api-middleware'
import { validateUUID } from '@/lib/validation'

// GET /api/profile — Return current user's auth info + notification prefs for Settings display.
// Uses server-side auth (createRouteHandlerClient reads httpOnly cookies from request headers)
// so this works even when the browser-client cannot read the session via document.cookie.
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ supabase, user }) => {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email_notifications_enabled, notification_frequency, notification_warning_enabled')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) {
      console.error('[Profile] Failed to load notification prefs:', profileError)
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      // Return only the fields callers actually need — identity_data contains raw OAuth
      // provider payloads (scopes, internal IDs) that should not be sent to the browser.
      app_metadata: {
        provider: user.app_metadata?.provider ?? null,
        providers: user.app_metadata?.providers ?? [],
      },
      user_metadata: {
        full_name: user.user_metadata?.full_name ?? null,
        name: user.user_metadata?.name ?? null,
        email: user.user_metadata?.email ?? null,
        picture: user.user_metadata?.picture ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      },
      identities: (user.identities ?? []).map(i => ({
        id: i.id,
        user_id: i.user_id,
        provider: i.provider,
        created_at: i.created_at,
        last_sign_in_at: i.last_sign_in_at,
        updated_at: i.updated_at,
      })),
      notifications: profile ? {
        email_notifications_enabled: profile.email_notifications_enabled,
        notification_frequency: profile.notification_frequency,
        notification_warning_enabled: profile.notification_warning_enabled,
      } : null,
    })
  }, { rateLimitConfig: RATE_LIMITS.READ })
}

// PATCH /api/profile — Update user profile preferences (default_car_id, notification settings)
export async function PATCH(request: NextRequest) {
  return withAuth(request, async ({ supabase, user }) => {
    const body = await request.json()

    const updates: Record<string, unknown> = {}

    if ('default_car_id' in body) {
      const default_car_id = body.default_car_id ?? null
      if (default_car_id !== null && !validateUUID(default_car_id)) {
        return errorResponse('Invalid car ID', 400)
      }
      updates.default_car_id = default_car_id
    }

    if ('email_notifications_enabled' in body) {
      if (typeof body.email_notifications_enabled !== 'boolean') {
        return errorResponse('email_notifications_enabled must be a boolean', 400)
      }
      updates.email_notifications_enabled = body.email_notifications_enabled
    }

    if ('notification_frequency' in body) {
      if (typeof body.notification_frequency !== 'string' ||
          !['daily', 'weekly', 'monthly'].includes(body.notification_frequency)) {
        return errorResponse('notification_frequency must be "daily", "weekly", or "monthly"', 400)
      }
      updates.notification_frequency = body.notification_frequency
    }

    if ('notification_warning_enabled' in body) {
      if (typeof body.notification_warning_enabled !== 'boolean') {
        return errorResponse('notification_warning_enabled must be a boolean', 400)
      }
      updates.notification_warning_enabled = body.notification_warning_enabled
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update', 400)
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.error('[Profile] Error updating profile:', error)
      return errorResponse('Failed to update profile', 500)
    }

    return NextResponse.json({ ok: true })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
