import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, isOrgOwner, canEdit } from '@/lib/org'

export const dynamic = 'force-dynamic'

// DELETE /api/trips/[id] - Delete a specific trip
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tripId = params.id

    // Only org owners can delete trips
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Only org owners can delete trips' }, { status: 403 })
    }

    // Delete the trip (RLS ensures org-scoped access)
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (error) {
      console.error('Error deleting trip:', error)
      return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/trips/[id] - Update a specific trip
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tripId = params.id

    // Check editor role
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    if (!(await canEdit(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Viewers cannot edit trips' }, { status: 403 })
    }

    const body = await request.json()

    const {
      car_id,
      date,
      start_location,
      end_location,
      purpose,
      business_purpose,
      miles,
      notes
    } = body

    // Build update object with only provided fields
    const updateData: Record<string, string | number | null> = {}

    if (car_id !== undefined) {
      // Verify the car belongs to the user's org
      const membership = await getUserOrg(supabase, user.id, activeOrgId)
      if (!membership) {
        return NextResponse.json({ error: 'No organization found' }, { status: 403 })
      }
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('id')
        .eq('id', car_id)
        .eq('org_id', membership.org_id)
        .single()

      if (carError || !car) {
        return NextResponse.json(
          { error: 'Car not found or does not belong to your organization' },
          { status: 404 }
        )
      }
      updateData.car_id = car_id
    }

    if (date !== undefined) updateData.date = date
    if (start_location !== undefined) updateData.start_location = start_location
    if (end_location !== undefined) updateData.end_location = end_location
    if (miles !== undefined) {
      // Validate miles
      if (typeof miles !== 'number' || miles <= 0) {
        return NextResponse.json(
          { error: 'Miles must be a positive number' },
          { status: 400 }
        )
      }
      updateData.miles = miles
    }
    if (notes !== undefined) updateData.notes = notes

    // Handle purpose and business_purpose together
    if (purpose !== undefined) {
      // Validate purpose
      if (purpose !== 'business' && purpose !== 'personal') {
        return NextResponse.json(
          { error: 'Purpose must be either "business" or "personal"' },
          { status: 400 }
        )
      }

      updateData.purpose = purpose

      // If changing to business, require business_purpose
      if (purpose === 'business' && !business_purpose && business_purpose !== undefined) {
        return NextResponse.json(
          { error: 'business_purpose is required for business trips (IRS compliance)' },
          { status: 400 }
        )
      }

      // Set business_purpose
      updateData.business_purpose = purpose === 'business' ? business_purpose : null
    } else if (business_purpose !== undefined) {
      // If only business_purpose is provided, update it
      updateData.business_purpose = business_purpose
    }

    // Update the trip (RLS ensures org-scoped access)
    const { data: trip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single()

    if (error) {
      console.error('Error updating trip:', error)
      return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
    }

    return NextResponse.json({ trip }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
