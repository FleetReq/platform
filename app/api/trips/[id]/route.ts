import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, isOrgOwner, canEdit } from '@/lib/org'
import { sanitizeString, validateUUID, validateDate, validateFloat } from '@/lib/validation'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

type TripRow = { id: string; car_id: string }

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

    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.WRITE)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    const tripId = params.id

    // Only org owners can delete trips
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Only org owners can delete trips' }, { status: 403 })
    }

    // Verify the trip belongs to the user's org via the car join
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('id, car_id, cars!inner(org_id)')
      .eq('id', tripId)
      .eq('cars.org_id', membership.org_id)
      .single()

    if (fetchError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('car_id', (trip as TripRow).car_id)

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

    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.WRITE)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    const tripId = params.id

    // Check editor role
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    if (!(await canEdit(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Viewers cannot edit trips' }, { status: 403 })
    }

    // Get membership and verify the trip belongs to the user's org
    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }

    const { data: existingTrip } = await supabase
      .from('trips')
      .select('id, cars!inner(org_id)')
      .eq('id', tripId)
      .eq('cars.org_id', membership.org_id)
      .single()

    if (!existingTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
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
      const validatedCarId = validateUUID(car_id)
      if (!validatedCarId) {
        return NextResponse.json({ error: 'Invalid car_id format' }, { status: 400 })
      }
      // Verify the car belongs to the user's org
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('id')
        .eq('id', validatedCarId)
        .eq('org_id', membership.org_id)
        .single()

      if (carError || !car) {
        return NextResponse.json(
          { error: 'Car not found or does not belong to your organization' },
          { status: 404 }
        )
      }
      updateData.car_id = validatedCarId
    }

    if (date !== undefined) {
      const validatedDate = validateDate(date)
      if (!validatedDate) {
        return NextResponse.json({ error: 'Invalid date (expected YYYY-MM-DD)' }, { status: 400 })
      }
      updateData.date = validatedDate
    }
    if (start_location !== undefined) updateData.start_location = sanitizeString(start_location, { maxLength: 200 })
    if (end_location !== undefined) updateData.end_location = sanitizeString(end_location, { maxLength: 200 })
    if (miles !== undefined) {
      const validatedMiles = validateFloat(miles, { min: 0.1, max: 10000 })
      if (validatedMiles === null) {
        return NextResponse.json(
          { error: 'Miles must be a positive number (max 10,000)' },
          { status: 400 }
        )
      }
      updateData.miles = validatedMiles
    }
    if (notes !== undefined) updateData.notes = sanitizeString(notes, { maxLength: 1000 })

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
      updateData.business_purpose = purpose === 'business' ? sanitizeString(business_purpose, { maxLength: 500 }) : null
    } else if (business_purpose !== undefined) {
      // If only business_purpose is provided, update it
      updateData.business_purpose = sanitizeString(business_purpose, { maxLength: 500 })
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
