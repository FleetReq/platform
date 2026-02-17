import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeString } from '@/lib/validation'
import { withOrg, errorResponse } from '@/lib/api-middleware'
import { getOrgDetails, isOrgOwner } from '@/lib/org'

// GET /api/org/members — List members of user's organization
export async function GET(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, membership }) => {
    // Use JOIN to fetch profiles in one query (fixes N+1)
    const { data: members, error } = await supabase
      .from('org_members')
      .select('id, user_id, role, invited_email, invited_at, accepted_at, created_at, user_profiles(email, full_name, avatar_url)')
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return errorResponse('Failed to fetch members', 500)
    }

    // Enrich with fallback data for current user
    const enrichedMembers = (members || []).map((member) => {
      // Supabase may return the joined profile as an array or object depending on FK inference
      const rawProfile = member.user_profiles
      const profile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as { email: string | null; full_name: string | null; avatar_url: string | null } | null
      const isCurrentUser = member.user_id === user.id

      const email = profile?.email
        || member.invited_email
        || (isCurrentUser ? user.email : null)
      const fullName = profile?.full_name
        || (isCurrentUser ? (user.user_metadata?.full_name || null) : null)
      const avatarUrl = profile?.avatar_url
        || (isCurrentUser ? (user.user_metadata?.avatar_url || null) : null)

      return {
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        invited_email: member.invited_email,
        invited_at: member.invited_at,
        accepted_at: member.accepted_at,
        created_at: member.created_at,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
      }
    })

    return NextResponse.json({ members: enrichedMembers })
  }, { rateLimitConfig: RATE_LIMITS.READ })
}

// POST /api/org/members — Invite a new member (owner only)
export async function POST(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return errorResponse('Only org owners can invite members', 403)
    }

    const org = await getOrgDetails(supabase, membership.org_id)
    if (!org) return errorResponse('Organization not found', 404)

    const body = await request.json()
    const email = sanitizeString(body.email, { maxLength: 255 })?.toLowerCase()
    const role = body.role as 'editor' | 'viewer'

    if (!email) return errorResponse('Email is required', 400)
    if (!role || !['editor', 'viewer'].includes(role)) {
      return errorResponse('Role must be "editor" or "viewer"', 400)
    }

    // Check member count limit
    const { count: currentMembers } = await supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', membership.org_id)

    if ((currentMembers || 0) >= org.max_members) {
      return errorResponse(`Your plan allows up to ${org.max_members} members. Upgrade for more.`, 400)
    }

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
        return errorResponse('This email has already been invited', 409)
      }
      console.error('Error creating invite:', error)
      return errorResponse('Failed to create invitation', 500)
    }

    return NextResponse.json({ invite }, { status: 201 })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}

// DELETE /api/org/members — Remove a member (owner only)
export async function DELETE(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return errorResponse('Only org owners can remove members', 403)
    }

    const body = await request.json()
    const memberId = body.member_id

    if (!memberId) return errorResponse('member_id is required', 400)

    const { data: targetMember } = await supabase
      .from('org_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('org_id', membership.org_id)
      .single()

    if (!targetMember) return errorResponse('Member not found', 404)
    if (targetMember.user_id === user.id) {
      return errorResponse('Cannot remove yourself from the organization', 400)
    }

    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId)
      .eq('org_id', membership.org_id)

    if (error) {
      console.error('Error removing member:', error)
      return errorResponse('Failed to remove member', 500)
    }

    return NextResponse.json({ message: 'Member removed successfully' })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
