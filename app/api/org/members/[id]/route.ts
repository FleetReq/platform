import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, isOrgOwner } from '@/lib/org'

// PATCH /api/org/members/[id] — Change a member's role (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: 'Only org owners can change roles' }, { status: 403 })
    }

    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { id: memberId } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Role must be "editor" or "viewer"' }, { status: 400 })
    }

    // Can't change own role
    const { data: targetMember } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('id', memberId)
      .eq('org_id', membership.org_id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('org_members')
      .update({ role })
      .eq('id', memberId)
      .eq('org_id', membership.org_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating member role:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
