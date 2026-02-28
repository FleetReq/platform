import { NextRequest, NextResponse } from 'next/server'
import { withOrg, errorResponse } from '@/lib/api-middleware'
import { sanitizeString, validateUUID, validateDate, validateFloat } from '@/lib/validation'
import { RATE_LIMITS } from '@/lib/rate-limit'

type TripRow = { id: string; car_id: string }

export const dynamic = 'force-dynamic'

// DELETE /api/trips/[id] - Delete a specific trip
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const tripId = params.id

  return withOrg(request, async ({ supabase, membership }) => {
    // Verify the trip belongs to the user's org via the car join
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('id, car_id, cars!inner(org_id)')
      .eq('id', tripId)
      .eq('cars.org_id', membership.org_id)
      .single()

    if (fetchError || !trip) {
      return errorResponse('Trip not found', 404)
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('car_id', (trip as TripRow).car_id)

    if (error) {
      console.error('Error deleting trip:', error)
      return errorResponse('Failed to delete trip', 500)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  }, { rateLimitConfig: RATE_LIMITS.WRITE, requireRole: 'owner' })
}

// PATCH /api/trips/[id] - Update a specific trip
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const tripId = params.id

  return withOrg(request, async ({ supabase, membership }) => {
    // Verify the trip belongs to the user's org
    const { data: existingTrip } = await supabase
      .from('trips')
      .select('id, cars!inner(org_id)')
      .eq('id', tripId)
      .eq('cars.org_id', membership.org_id)
      .single()

    if (!existingTrip) {
      return errorResponse('Trip not found', 404)
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
        return errorResponse('Invalid car_id format', 400)
      }
      // Verify the car belongs to the user's org
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('id')
        .eq('id', validatedCarId)
        .eq('org_id', membership.org_id)
        .single()

      if (carError || !car) {
        return errorResponse('Car not found or does not belong to your organization', 404)
      }
      updateData.car_id = validatedCarId
    }

    if (date !== undefined) {
      const validatedDate = validateDate(date)
      if (!validatedDate) {
        return errorResponse('Invalid date (expected YYYY-MM-DD)', 400)
      }
      updateData.date = validatedDate
    }
    if (start_location !== undefined) updateData.start_location = sanitizeString(start_location, { maxLength: 200 })
    if (end_location !== undefined) updateData.end_location = sanitizeString(end_location, { maxLength: 200 })
    if (miles !== undefined) {
      const validatedMiles = validateFloat(miles, { min: 0.1, max: 10000 })
      if (validatedMiles === null) {
        return errorResponse('Miles must be a positive number (max 10,000)', 400)
      }
      updateData.miles = validatedMiles
    }
    if (notes !== undefined) updateData.notes = sanitizeString(notes, { maxLength: 1000 })

    // Handle purpose and business_purpose together
    if (purpose !== undefined) {
      // Validate purpose
      if (purpose !== 'business' && purpose !== 'personal') {
        return errorResponse('Purpose must be either "business" or "personal"', 400)
      }

      updateData.purpose = purpose

      // If changing to business, require business_purpose
      if (purpose === 'business' && !business_purpose && business_purpose !== undefined) {
        return errorResponse('business_purpose is required for business trips (IRS compliance)', 400)
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
      return errorResponse('Failed to update trip', 500)
    }

    return NextResponse.json({ trip }, { status: 200 })
  }, { rateLimitConfig: RATE_LIMITS.WRITE, requireRole: 'editor' })
}
