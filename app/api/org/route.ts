import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeString } from '@/lib/validation'
import { withAuth, withOrg, errorResponse } from '@/lib/api-middleware'
import { getUserOrgs, getOrgDetails, isOrgOwner } from '@/lib/org'

// GET /api/org — Get current user's organization details
// ?all=true — List all orgs the user belongs to (for org switcher)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const allOrgs = searchParams.get('all') === 'true'

  if (allOrgs) {
    return withAuth(request, async ({ supabase, user, activeOrgId }) => {
      const orgs = await getUserOrgs(supabase, user.id)
      return NextResponse.json({ orgs, active_org_id: activeOrgId })
    }, { rateLimitConfig: RATE_LIMITS.READ })
  }

  return withOrg(request, async ({ supabase, membership }) => {
    const org = await getOrgDetails(supabase, membership.org_id)
    if (!org) return errorResponse('Organization not found', 404)

    return NextResponse.json({ org, role: membership.role })
  }, { rateLimitConfig: RATE_LIMITS.READ })
}

// PATCH /api/org — Update organization name (owner only)
export async function PATCH(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return errorResponse('Only org owners can update organization settings', 403)
    }

    const body = await request.json()
    const name = sanitizeString(body.name, { maxLength: 100 })

    if (!name) return errorResponse('Organization name is required', 400)

    const { data: org, error } = await supabase
      .from('organizations')
      .update({ name })
      .eq('id', membership.org_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating org:', error)
      return errorResponse('Failed to update organization', 500)
    }

    return NextResponse.json({ org })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
