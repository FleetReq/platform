import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, getUserOrgs, getOrgDetails, isOrgOwner } from '@/lib/org'
import { sanitizeString } from '@/lib/validation'

// GET /api/org — Get current user's organization details
// ?all=true — List all orgs the user belongs to (for org switcher)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    const { searchParams } = new URL(request.url)
    const allOrgs = searchParams.get('all') === 'true'

    if (allOrgs) {
      // Return all orgs the user belongs to (for the org switcher)
      const orgs = await getUserOrgs(supabase, user.id)
      return NextResponse.json({
        orgs,
        active_org_id: activeOrgId,
      })
    }

    // Default: return single active org details + role
    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const org = await getOrgDetails(supabase, membership.org_id)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      org,
      role: membership.role,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/org — Update organization name (owner only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Only org owners can update organization settings' }, { status: 403 })
    }

    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await request.json()
    const name = sanitizeString(body.name, { maxLength: 100 })

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .update({ name })
      .eq('id', membership.org_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating org:', error)
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }

    return NextResponse.json({ org })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
