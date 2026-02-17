import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg } from '@/lib/org'

// POST /api/org/accept-invite — Accept a pending invitation
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
    const { invite_id } = body

    if (!invite_id) {
      return NextResponse.json({ error: 'invite_id is required' }, { status: 400 })
    }

    // Find the pending invite matching this user's email
    const { data: invite, error: inviteError } = await supabase
      .from('org_members')
      .select('id, org_id, role, invited_email')
      .eq('id', invite_id)
      .is('user_id', null)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invitation not found or already accepted' }, { status: 404 })
    }

    // Verify the invite email matches the user's email
    if (invite.invited_email?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'This invitation was sent to a different email address' }, { status: 403 })
    }

    // Get user's current org membership
    const currentMembership = await getUserOrg(supabase, user.id)

    // If user has an existing org, check if it's empty (auto-created) and delete it
    if (currentMembership) {
      // Remove user from current org
      await supabase
        .from('org_members')
        .delete()
        .eq('org_id', currentMembership.org_id)
        .eq('user_id', user.id)

      // Check if the old org has any remaining members
      const { count: remainingMembers } = await supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', currentMembership.org_id)

      // If no members left, delete the empty org
      if (!remainingMembers || remainingMembers === 0) {
        // Delete cars first (cascade will handle fill_ups/maintenance)
        await supabase.from('cars').delete().eq('org_id', currentMembership.org_id)
        await supabase.from('organizations').delete().eq('id', currentMembership.org_id)
      }
    }

    // Accept the invite: link user_id and set accepted_at
    const { data: accepted, error: acceptError } = await supabase
      .from('org_members')
      .update({
        user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite_id)
      .select()
      .single()

    if (acceptError) {
      console.error('Error accepting invite:', acceptError)
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      membership: accepted,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
