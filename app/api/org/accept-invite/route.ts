import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { withAuth, errorResponse } from '@/lib/api-middleware'
import { validateUUID } from '@/lib/validation'

// GET /api/org/accept-invite?id= — Preview invite details without accepting
export async function GET(request: NextRequest) {
  // Rate limit unauthenticated requests by IP
  const clientIp = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const rateLimitResult = rateLimit(`invite-preview:${clientIp}`, RATE_LIMITS.ANONYMOUS)
  if (!rateLimitResult.success) return errorResponse('Rate limit exceeded. Please try again later.', 429)

  const { searchParams } = new URL(request.url)
  const invite_id = searchParams.get('id')
  if (!invite_id) return errorResponse('id is required', 400)

  const validatedId = validateUUID(invite_id)
  if (!validatedId) return errorResponse('Invalid invitation ID', 400)

  const adminClient = createAdminClient()
  if (!adminClient) return errorResponse('Server configuration error', 503)

  const { data: invite } = await adminClient
    .from('org_members')
    .select('id, role, organizations(name)')
    .eq('id', validatedId)
    .is('user_id', null)
    .single()

  if (!invite) return errorResponse('Invitation not found or already accepted', 404)

  // Supabase FK join types are generated as arrays, but at runtime this is a single object or null.
  // We handle both shapes defensively to be safe across Supabase client versions.
  type OrgJoin = { name: string }
  const orgData = invite.organizations as OrgJoin | OrgJoin[] | null
  const orgName = Array.isArray(orgData) ? orgData[0]?.name : orgData?.name
  return NextResponse.json({
    org_name: orgName || 'Unknown Organization',
    role: invite.role,
    // invited_email intentionally omitted — don't expose PII to unauthenticated callers
  })
}

// POST /api/org/accept-invite — Accept a pending invitation (non-destructive: keeps existing memberships)
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ supabase, user }) => {
    const body = await request.json()
    const { invite_id } = body

    if (!invite_id) return errorResponse('invite_id is required', 400)

    // Use service role to bypass RLS for both SELECT and UPDATE.
    // Security is enforced below: user is authenticated + email must match.
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.error('accept-invite: missing SUPABASE_SERVICE_ROLE_KEY')
      return errorResponse('Server configuration error', 503)
    }

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

// DELETE /api/org/accept-invite — Decline a pending invitation
export async function DELETE(request: NextRequest) {
  return withAuth(request, async ({ user }) => {
    const body = await request.json()
    const { invite_id } = body

    if (!invite_id) return errorResponse('invite_id is required', 400)

    const adminClient = createAdminClient()
    if (!adminClient) return errorResponse('Server configuration error', 503)

    // Find the pending invite and verify email ownership before deleting
    const { data: invite } = await adminClient
      .from('org_members')
      .select('id, invited_email')
      .eq('id', invite_id)
      .is('user_id', null)
      .single()

    if (!invite) return errorResponse('Invitation not found or already accepted', 404)

    if (invite.invited_email?.toLowerCase() !== user.email?.toLowerCase()) {
      return errorResponse('This invitation was sent to a different email address', 403)
    }

    const { error } = await adminClient
      .from('org_members')
      .delete()
      .eq('id', invite_id)
      .is('user_id', null)

    if (error) {
      console.error('Error declining invite:', error)
      return errorResponse('Failed to decline invitation', 500)
    }

    return NextResponse.json({ message: 'Invitation declined' })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
