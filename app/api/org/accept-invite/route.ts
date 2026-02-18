import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { withAuth, errorResponse } from '@/lib/api-middleware'

// POST /api/org/accept-invite — Accept a pending invitation (non-destructive: keeps existing memberships)
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ supabase, user }) => {
    const body = await request.json()
    const { invite_id } = body

    if (!invite_id) return errorResponse('invite_id is required', 400)

    // Use service role to bypass RLS for both SELECT and UPDATE.
    // Security is enforced below: user is authenticated + email must match.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      console.error('accept-invite: missing SUPABASE_SERVICE_ROLE_KEY')
      return errorResponse('Server configuration error', 503)
    }
    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Find the pending invite
    const { data: invite, error: inviteError } = await adminClient
      .from('org_members')
      .select('id, org_id, role, invited_email')
      .eq('id', invite_id)
      .is('user_id', null)
      .single()

    if (inviteError || !invite) {
      return errorResponse('Invitation not found or already accepted', 404)
    }

    // Verify the invite belongs to this authenticated user
    if (invite.invited_email?.toLowerCase() !== user.email?.toLowerCase()) {
      return errorResponse('This invitation was sent to a different email address', 403)
    }

    const { data: accepted, error: acceptError } = await adminClient
      .from('org_members')
      .update({
        user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite_id)
      .is('user_id', null)
      .select()
      .single()

    if (acceptError) {
      console.error('Error accepting invite:', acceptError)
      return errorResponse('Failed to accept invitation', 500)
    }

    const response = NextResponse.json({
      message: 'Invitation accepted successfully',
      membership: accepted,
    })
    response.cookies.set('fleetreq-active-org', invite.org_id, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })

    return response
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
