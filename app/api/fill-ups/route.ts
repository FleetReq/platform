import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, validateFloat, validateUUID, validateDate, validateFuelType } from '@/lib/validation'

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
      return NextResponse.json({ fillUps: [] })
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    let query = supabase
      .from('fill_ups')
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

    const { data: fillUps, error } = await query

    if (error) {
      console.error('Error fetching fill-ups:', error)
      return NextResponse.json({ error: 'Failed to fetch fill-ups' }, { status: 500 })
    }

    return NextResponse.json({ fillUps })
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
    const odometer_reading = validateInteger(body.odometer_reading, { min: 0, max: 999999 })
    const gallons = validateFloat(body.gallons, { min: 0.1, max: 100, precision: 3 })
    const price_per_gallon = validateFloat(body.price_per_gallon, { min: 0, max: 20, precision: 3 })
    const fuel_type = validateFuelType(body.fuel_type)
    const gas_station = sanitizeString(body.gas_station, { maxLength: 100 })
    const location = sanitizeString(body.location, { maxLength: 200 })
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

    if (!car_id || !odometer_reading || !gallons) {
      return NextResponse.json(
        { error: 'Valid car ID, odometer reading, and gallons are required' },
        { status: 400 }
      )
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

    const total_cost = price_per_gallon && gallons ?
      parseFloat((gallons * price_per_gallon).toFixed(2)) :
      null

    // Calculate miles_driven from previous fill-up for MPG calculation
    const { data: previousFillUp } = await supabase
      .from('fill_ups')
      .select('odometer_reading')
      .eq('car_id', car_id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const miles_driven = previousFillUp
      ? odometer_reading - previousFillUp.odometer_reading
      : null

    // Build insert object conditionally to handle missing columns gracefully
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: Record<string, any> = {
      car_id,
      date,
      odometer_reading,
      gallons,
      price_per_gallon,
      total_cost,
      miles_driven,
      gas_station,
      location,
      notes,
      created_by_user_id: user.id
    }

    // Only add fuel_type if it exists (for backward compatibility)
    if (fuel_type) {
      insertData.fuel_type = fuel_type
    }

    // Add receipt_urls if provided
    if (receipt_urls && receipt_urls.length > 0) {
      insertData.receipt_urls = receipt_urls
    }

    const { data: fillUp, error } = await supabase
      .from('fill_ups')
      .insert(insertData)
      .select(`
        *,
        cars(*)
      `)
      .single()

    if (error) {
      console.error('Error creating fill-up:', error)
      return NextResponse.json({
        error: 'Failed to create fill-up',
        // Only expose details in development
        ...(process.env.NODE_ENV !== 'production' && {
          details: error.message,
          code: error.code
        })
      }, { status: 500 })
    }

    // Update the car's current mileage if the new odometer reading is higher or if no current mileage exists
    const { data: currentCar } = await supabase
      .from('cars')
      .select('current_mileage')
      .eq('id', car_id)
      .eq('user_id', user.id)
      .single()

    const newMileage = odometer_reading
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

    return NextResponse.json({ fillUp }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}