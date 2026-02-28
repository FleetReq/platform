import { NextRequest, NextResponse } from 'next/server'
import { withOrg, errorResponse } from '@/lib/api-middleware'
import { verifyCarAccess } from '@/lib/org'
import { sanitizeString, validateUUID, validateDate, validateFloat } from '@/lib/validation'
import { RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// GET /api/trips - Fetch all trips for the authenticated user
export async function GET(request: NextRequest) {
  return withOrg(request, async ({ supabase, membership }) => {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('car_id')
    const purpose = searchParams.get('purpose') // 'business' or 'personal'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Build query with filters — trips belong to cars which belong to orgs
    let query = supabase
      .from('trips')
      .select('*, cars!inner(org_id)')
      .eq('cars.org_id', membership.org_id)
      .order('date', { ascending: false })

    // Apply filters if provided
    if (carId) {
      query = query.eq('car_id', carId)
    }
    if (purpose) {
      query = query.eq('purpose', purpose)
    }
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: trips, error } = await query

    if (error) {
      console.error('Error fetching trips:', error)
      return errorResponse('Failed to fetch trips', 500)
    }

    return NextResponse.json({ trips })
  }, { rateLimitConfig: RATE_LIMITS.READ, emptyOnUnauth: 'trips' })
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, activeOrgId }) => {
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

    // Validate required fields
    const validatedCarId = validateUUID(car_id)
    if (!validatedCarId) {
      return errorResponse('Invalid or missing car_id', 400)
    }

    const validatedDate = validateDate(date)
    if (!validatedDate) {
      return errorResponse('Invalid or missing date (expected YYYY-MM-DD)', 400)
    }

    if (!end_location || !purpose) {
      return errorResponse('Missing required fields: end_location, purpose', 400)
    }

    // Validate purpose
    if (purpose !== 'business' && purpose !== 'personal') {
      return errorResponse('Purpose must be either "business" or "personal"', 400)
    }

    // Validate business_purpose is provided for business trips
    if (purpose === 'business' && !business_purpose) {
      return errorResponse('business_purpose is required for business trips (IRS compliance)', 400)
    }

    // Validate miles
    const validatedMiles = validateFloat(miles, { min: 0.1, max: 10000 })
    if (validatedMiles === null) {
      return errorResponse('Miles must be a positive number (max 10,000)', 400)
    }

    // Verify user has edit access to this car through their org
    const carAccess = await verifyCarAccess(supabase, user.id, validatedCarId, activeOrgId)
    if (!carAccess.hasAccess) {
      return errorResponse('Car not found or does not belong to your organization', 404)
    }
    if (!carAccess.canEdit) {
      return errorResponse('Viewers cannot add trips', 403)
    }

    // Insert the trip
    const { data: trip, error: insertError } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        car_id: validatedCarId,
        date: validatedDate,
        start_location: sanitizeString(start_location, { maxLength: 200 }),
        end_location: sanitizeString(end_location, { maxLength: 200 }),
        purpose,
        business_purpose: purpose === 'business' ? sanitizeString(business_purpose, { maxLength: 500 }) : null,
        miles: validatedMiles,
        notes: sanitizeString(notes, { maxLength: 1000 }),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating trip:', insertError)
      return errorResponse('Failed to create trip', 500)
    }

    return NextResponse.json({ trip }, { status: 201 })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
