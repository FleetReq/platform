import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, validateFloat, validateUUID, validateDate, validateFuelType } from '@/lib/validation'
import { withOrg, errorResponse } from '@/lib/api-middleware'
import { verifyCarAccess, getOrgSubscriptionPlan } from '@/lib/org'

export async function GET(request: NextRequest) {
  return withOrg(request, async ({ supabase, membership }) => {
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('car_id')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    let query = supabase
      .from('fill_ups')
      .select(`*, cars!inner(*)`)
      .eq('cars.org_id', membership.org_id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (carId) {
      query = query.eq('car_id', carId)
    }

    const { data: fillUps, error } = await query

    if (error) {
      console.error('Error fetching fill-ups:', error)
      return errorResponse('Failed to fetch fill-ups', 500)
    }

    return NextResponse.json({ fillUps })
  }, { rateLimitConfig: RATE_LIMITS.READ, emptyOnUnauth: 'fillUps' })
}

export async function POST(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, activeOrgId }) => {
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
        return errorResponse('Maximum 5 receipt photos allowed', 400)
      }
      receipt_urls = body.receipt_urls.filter(
        (url: unknown) => typeof url === 'string' && url.length < 500
      )
    }

    if (!car_id || !odometer_reading || !gallons) {
      return errorResponse('Valid car ID, odometer reading, and gallons are required', 400)
    }

    // Verify user has edit access to this car through their org
    const carAccess = await verifyCarAccess(supabase, user.id, car_id, activeOrgId)
    if (!carAccess.hasAccess) {
      return errorResponse('Car not found', 404)
    }
    if (!carAccess.canEdit) {
      return errorResponse('Viewers cannot add fill-ups', 403)
    }
    if (!carAccess.orgId) {
      return errorResponse('Organization not found', 500)
    }

    const userPlan = await getOrgSubscriptionPlan(supabase, user.id, activeOrgId)
    if (userPlan === 'free' && receipt_urls && receipt_urls.length > 0) {
      return errorResponse('Receipt uploads require Family plan or higher', 403)
    }

    const total_cost = price_per_gallon && gallons ?
      parseFloat((gallons * price_per_gallon).toFixed(2)) : null

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

    const { data: fillUp, error } = await supabase
      .from('fill_ups')
      .insert({
        car_id, date, odometer_reading, gallons, price_per_gallon,
        total_cost, miles_driven, gas_station, location, notes,
        created_by_user_id: user.id,
        ...(fuel_type ? { fuel_type } : {}),
        ...(receipt_urls && receipt_urls.length > 0 ? { receipt_urls } : {}),
      })
      .select(`*, cars(*)`)
      .single()

    if (error) {
      console.error('Error creating fill-up:', error)
      return errorResponse('Failed to create fill-up', 500)
    }

    // Update the car's current mileage if the new odometer reading is higher
    const { data: currentCar } = await supabase
      .from('cars')
      .select('current_mileage')
      .eq('id', car_id)
      .eq('org_id', carAccess.orgId!)
      .single()

    if (!currentCar?.current_mileage || currentCar.current_mileage < odometer_reading) {
      const { error: mileageError } = await supabase
        .from('cars')
        .update({ current_mileage: odometer_reading })
        .eq('id', car_id)
        .eq('org_id', carAccess.orgId)
      if (mileageError) console.error('Failed to update car mileage:', mileageError)
    }

    return NextResponse.json({ fillUp }, { status: 201 })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
