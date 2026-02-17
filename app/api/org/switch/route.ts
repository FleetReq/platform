import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

// POST /api/org/switch — Switch the user's active organization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { org_id } = body

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    // Verify the user has a membership in the target org
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .limit(1)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 403 })
    }

    // Set the active org cookie
    const response = NextResponse.json({
      success: true,
      org_id: membership.org_id,
    })
    response.cookies.set('fleetreq-active-org', membership.org_id, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return response
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
