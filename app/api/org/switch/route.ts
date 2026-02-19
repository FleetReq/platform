import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { withAuth, errorResponse } from '@/lib/api-middleware'
import { validateUUID } from '@/lib/validation'

// POST /api/org/switch — Switch the user's active organization
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ supabase, user }) => {
    const body = await request.json()
    const { org_id } = body

    if (!org_id) return errorResponse('org_id is required', 400)
    const validatedOrgId = validateUUID(org_id)
    if (!validatedOrgId) return errorResponse('Invalid org_id format', 400)

    // Verify the user has an accepted membership in the target org
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .eq('org_id', validatedOrgId)
      .not('accepted_at', 'is', null)
      .limit(1)
      .single()

    if (membershipError || !membership) {
      return errorResponse('You are not a member of this organization', 403)
    }

    const response = NextResponse.json({ success: true, org_id: validatedOrgId })
    response.cookies.set('fleetreq-active-org', membership.org_id, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })

    return response
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
