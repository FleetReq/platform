import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { withOrg, errorResponse } from '@/lib/api-middleware'
import { isOrgOwner } from '@/lib/org'
import { createAdminClient } from '@/lib/supabase'

// PATCH /api/org/members/[id] — Change a member's role (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return errorResponse('Only org owners can change roles', 403)
    }

    const adminClient = createAdminClient()
    if (!adminClient) return errorResponse('Service configuration error', 503)

    const { id: memberId } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['editor', 'viewer'].includes(role)) {
      return errorResponse('Role must be "editor" or "viewer"', 400)
    }

    const { data: targetMember } = await adminClient
      .from('org_members')
      .select('user_id')
      .eq('id', memberId)
      .eq('org_id', membership.org_id)
      .single()

    if (!targetMember) return errorResponse('Member not found', 404)
    if (targetMember.user_id === user.id) {
      return errorResponse('Cannot change your own role', 400)
    }

    const { data: updated, error } = await adminClient
      .from('org_members')
      .update({ role })
      .eq('id', memberId)
      .eq('org_id', membership.org_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating member role:', error)
      return errorResponse('Failed to update role', 500)
    }

    return NextResponse.json({ member: updated })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
