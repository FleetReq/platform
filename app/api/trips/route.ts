import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, verifyCarAccess } from '@/lib/org'

export const dynamic = 'force-dynamic'

// GET /api/trips - Fetch all trips for the authenticated user
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

    // Get user's org membership
    const membership = await getUserOrg(supabase, user.id)
    if (!membership) {
      return NextResponse.json({ trips: [] })
    }

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
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
    }

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/trips - Create a new trip
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

    // Validation
    if (!car_id || !date || !end_location || !purpose || !miles) {
      return NextResponse.json(
        { error: 'Missing required fields: car_id, date, end_location, purpose, miles' },
        { status: 400 }
      )
    }

    // Validate purpose
    if (purpose !== 'business' && purpose !== 'personal') {
      return NextResponse.json(
        { error: 'Purpose must be either "business" or "personal"' },
        { status: 400 }
      )
    }

    // Validate business_purpose is provided for business trips
    if (purpose === 'business' && !business_purpose) {
      return NextResponse.json(
        { error: 'business_purpose is required for business trips (IRS compliance)' },
        { status: 400 }
      )
    }

    // Validate miles
    if (typeof miles !== 'number' || miles <= 0) {
      return NextResponse.json(
        { error: 'Miles must be a positive number' },
        { status: 400 }
      )
    }

    // Verify user has edit access to this car through their org
    const carAccess = await verifyCarAccess(supabase, user.id, car_id)
    if (!carAccess.hasAccess) {
      return NextResponse.json(
        { error: 'Car not found or does not belong to your organization' },
        { status: 404 }
      )
    }
    if (!carAccess.canEdit) {
      return NextResponse.json({ error: 'Viewers cannot add trips' }, { status: 403 })
    }

    // Insert the trip
    const { data: trip, error: insertError } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        car_id,
        date,
        start_location,
        end_location,
        purpose,
        business_purpose: purpose === 'business' ? business_purpose : null,
        miles,
        notes
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating trip:', insertError)
      return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
    }

    return NextResponse.json({ trip }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
