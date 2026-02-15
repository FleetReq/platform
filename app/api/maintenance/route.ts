import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserSubscriptionPlan } from '@/lib/supabase-client'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, validateFloat, validateUUID, validateDate, validateMaintenanceType } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('No authenticated user, returning empty array')
      return NextResponse.json({ maintenanceRecords: [] })
    }

    // Rate limiting
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.READ)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('car_id')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    let query = supabase
      .from('maintenance_records')
      .select(`
        *,
        cars!inner(*)
      `)
      .eq('cars.user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (carId) {
      query = query.eq('car_id', carId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: maintenanceRecords, error } = await query

    if (error) {
      console.error('Error fetching maintenance records:', error)
      return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 })
    }

    return NextResponse.json({ maintenanceRecords })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.WRITE)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Parse and validate input
    const body = await request.json()

    const car_id = validateUUID(body.car_id)
    const date = validateDate(body.date, { allowFuture: false }) || new Date().toISOString().split('T')[0]
    const type = validateMaintenanceType(body.type)
    const oil_type = sanitizeString(body.oil_type, { maxLength: 20 })
    const cost = validateFloat(body.cost, { min: 0, max: 10000, precision: 2 })
    const mileage = validateInteger(body.mileage, { min: 0, max: 999999 })
    const service_provider = sanitizeString(body.service_provider, { maxLength: 100 })
    const location = sanitizeString(body.location, { maxLength: 200 })
    const next_service_date = validateDate(body.next_service_date, { allowPast: false })
    const next_service_mileage = validateInteger(body.next_service_mileage, { min: 0, max: 999999 })
    const notes = sanitizeString(body.notes, { maxLength: 500 })

    // Validate receipt_urls if provided
    let receipt_urls: string[] | undefined
    if (Array.isArray(body.receipt_urls)) {
      if (body.receipt_urls.length > 5) {
        return NextResponse.json({ error: 'Maximum 5 receipt photos allowed' }, { status: 400 })
      }
      receipt_urls = body.receipt_urls.filter(
        (url: unknown) => typeof url === 'string' && url.length < 500
      )
    }

    if (!car_id || !type) {
      return NextResponse.json(
        { error: 'Valid car ID and maintenance type are required' },
        { status: 400 }
      )
    }

    // Check 90-day data retention limit for free tier users
    const userPlan = await getUserSubscriptionPlan(user.id)
    if (userPlan === 'free') {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const maintenanceDate = new Date(date)

      if (maintenanceDate < ninetyDaysAgo) {
        return NextResponse.json(
          {
            error: 'Free tier users can only add data from the last 90 days. Upgrade to Personal or Business for unlimited history.',
            upgradeRequired: true
          },
          { status: 403 }
        )
      }
    }

    // Verify the car belongs to the user
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', car_id)
      .eq('user_id', user.id)
      .single()

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    // Build insert object conditionally to handle missing columns gracefully
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: Record<string, any> = {
      car_id,
      date,
      type,
      cost,
      mileage,
      service_provider,
      location,
      next_service_date,
      next_service_mileage,
      notes,
      created_by_user_id: user.id
    }

    // Only add oil_type if it exists (for backward compatibility)
    if (oil_type) {
      insertData.oil_type = oil_type
    }

    // Add receipt_urls if provided
    if (receipt_urls && receipt_urls.length > 0) {
      insertData.receipt_urls = receipt_urls
    }

    const { data: maintenanceRecord, error } = await supabase
      .from('maintenance_records')
      .insert(insertData)
      .select(`
        *,
        cars(*)
      `)
      .single()

    if (error) {
      console.error('Error creating maintenance record:', error)
      return NextResponse.json({
        error: 'Failed to create maintenance record',
        // Only expose details in development
        ...(process.env.NODE_ENV !== 'production' && {
          details: error.message,
          code: error.code
        })
      }, { status: 500 })
    }

    // Update the car's current mileage if the new odometer reading is higher or if no current mileage exists
    if (mileage) {
      const { data: currentCar } = await supabase
        .from('cars')
        .select('current_mileage')
        .eq('id', car_id)
        .eq('user_id', user.id)
        .single()

      const newMileage = mileage
      const shouldUpdate = !currentCar?.current_mileage || currentCar.current_mileage < newMileage

      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('cars')
          .update({ current_mileage: newMileage })
          .eq('id', car_id)
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error updating car mileage:', updateError)
        }
      }
    }

    return NextResponse.json({ maintenanceRecord }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}