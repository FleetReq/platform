import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

// POST /api/org/accept-invite — Accept a pending invitation (non-destructive: keeps existing memberships)
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

    // Accept the invite: link user_id and set accepted_at
    // Non-destructive — user keeps all existing org memberships and simply gains a new one
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

    // Set active org cookie to the newly joined org
    const response = NextResponse.json({
      message: 'Invitation accepted successfully',
      membership: accepted,
    })
    response.cookies.set('fleetreq-active-org', invite.org_id, {
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
