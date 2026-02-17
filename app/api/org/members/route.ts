import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, getOrgDetails, isOrgOwner } from '@/lib/org'
import { sanitizeString } from '@/lib/validation'

// GET /api/org/members — List members of user's organization
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
    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { data: members, error } = await supabase
      .from('org_members')
      .select('id, user_id, role, invited_email, invited_at, accepted_at, created_at')
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // For accepted members, fetch their email/name from user_profiles
    // Use the current user's auth data as fallback (user_profiles.email may be NULL)
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        if (member.user_id) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email, full_name, avatar_url')
            .eq('id', member.user_id)
            .single()

          // For the current user, fall back to auth email/name if profile fields are empty
          const isCurrentUser = member.user_id === user.id
          const email = profile?.email
            || member.invited_email
            || (isCurrentUser ? user.email : null)
          const fullName = profile?.full_name
            || (isCurrentUser ? (user.user_metadata?.full_name || null) : null)
          const avatarUrl = profile?.avatar_url
            || (isCurrentUser ? (user.user_metadata?.avatar_url || null) : null)

          return {
            ...member,
            email,
            full_name: fullName,
            avatar_url: avatarUrl,
          }
        }
        // Pending invite (no user_id yet)
        return {
          ...member,
          email: member.invited_email,
          full_name: null,
          avatar_url: null,
        }
      })
    )

    return NextResponse.json({ members: enrichedMembers })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/org/members — Invite a new member (owner only)
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

    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Only org owners can invite members' }, { status: 403 })
    }

    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const org = await getOrgDetails(supabase, membership.org_id)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const body = await request.json()
    const email = sanitizeString(body.email, { maxLength: 255 })?.toLowerCase()
    const role = body.role as 'editor' | 'viewer'

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!role || !['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Role must be "editor" or "viewer"' }, { status: 400 })
    }

    // Check member count limit
    const { count: currentMembers } = await supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', membership.org_id)

    if ((currentMembers || 0) >= org.max_members) {
      return NextResponse.json({
        error: `Your plan allows up to ${org.max_members} members. Upgrade for more.`,
      }, { status: 400 })
    }

    // Create pending invite
    const { data: invite, error } = await supabase
      .from('org_members')
      .insert({
        org_id: membership.org_id,
        role,
        invited_email: email,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email has already been invited' }, { status: 409 })
      }
      console.error('Error creating invite:', error)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    return NextResponse.json({ invite }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/org/members — Remove a member (owner only)
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only org owners can remove members' }, { status: 403 })
    }

    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await request.json()
    const memberId = body.member_id

    if (!memberId) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
    }

    // Can't remove yourself (the owner)
    const { data: targetMember } = await supabase
      .from('org_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('org_id', membership.org_id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself from the organization' }, { status: 400 })
    }

    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId)
      .eq('org_id', membership.org_id)

    if (error) {
      console.error('Error removing member:', error)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
