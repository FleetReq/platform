import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { withAuth, errorResponse } from '@/lib/api-middleware'
import { getUserOrgs } from '@/lib/org'
import { validateUUID } from '@/lib/validation'

// POST /api/org/leave — Leave an organization (cannot leave your only/owner org)
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ supabase, user }) => {
    const body = await request.json()
    const { org_id } = body

    if (!org_id) return errorResponse('org_id is required', 400)
    const validatedOrgId = validateUUID(org_id)
    if (!validatedOrgId) return errorResponse('Invalid org_id format', 400)

    // Get the membership row to leave
    const { data: membership } = await supabase
      .from('org_members')
      .select('id, role')
      .eq('org_id', validatedOrgId)
      .eq('user_id', user.id)
      .not('accepted_at', 'is', null)
      .single()

    if (!membership) return errorResponse('You are not a member of this organization', 404)

    // Owners cannot leave their own org (they'd need to transfer ownership or delete it)
    if (membership.role === 'owner') {
      return errorResponse('Owners cannot leave their organization. Delete the org or transfer ownership first.', 400)
    }

    // Must have at least one other org to fall back to
    const allOrgs = await getUserOrgs(supabase, user.id)
    if (allOrgs.length <= 1) {
      return errorResponse('You cannot leave your only organization', 400)
    }

    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', membership.id)
      .eq('user_id', user.id) // extra safety — only delete own row

    if (error) {
      console.error('Error leaving org:', error)
      return errorResponse('Failed to leave organization', 500)
    }

    // Return the next org to switch to (first remaining org that isn't the one left)
    const remaining = allOrgs.filter(o => o.org_id !== validatedOrgId)
    const nextOrgId = remaining[0]?.org_id ?? null

    const response = NextResponse.json({ message: 'Left organization successfully', next_org_id: nextOrgId })
    if (nextOrgId) {
      response.cookies.set('fleetreq-active-org', nextOrgId, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    }
    return response
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
