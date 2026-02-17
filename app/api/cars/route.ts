import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { updateStripeSubscriptionQuantity } from '@/lib/stripe-helpers'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import { sanitizeString, validateYear, validateInteger, validateLicensePlate, validateUUID } from '@/lib/validation'
import { getUserOrg, getOrgSubscriptionPlan, canEdit } from '@/lib/org'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('Cars API: No authenticated user, returning empty array')
      return NextResponse.json({ cars: [] })
    }

    // Rate limiting
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.READ)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Get user's org membership
    const membership = await getUserOrg(supabase, user.id)
    if (!membership) {
      console.log('Cars API: No org membership for user:', user.id)
      return NextResponse.json({ cars: [] })
    }

    console.log('Cars API: Fetching cars for org:', membership.org_id, 'user:', user.email)

    const { data: cars, error: carsError} = await supabase
      .from('cars')
      .select(`
        *,
        fill_ups!inner(count),
        maintenance_records!inner(count)
      `)
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false })

    console.log('Cars API: Query result - cars:', cars?.length || 0, 'error:', carsError?.message || 'none')

    if (carsError) {
      console.error('Error fetching cars:', carsError)
      return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
    }

    return NextResponse.json({
      cars,
      // Only expose debug info in development
      ...(process.env.NODE_ENV !== 'production' && {
        _debug: {
          userId: user.id,
          carCount: cars?.length || 0
        }
      })
    })
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

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
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

    // Check org membership and editor role
    const membership = await getUserOrg(supabase, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }

    if (!(await canEdit(supabase, user.id))) {
      return NextResponse.json({ error: 'Viewers cannot add vehicles' }, { status: 403 })
    }

    // Parse and validate input
    const body = await request.json()

    const make = sanitizeString(body.make, { maxLength: 50 })
    const model = sanitizeString(body.model, { maxLength: 50 })
    const year = validateYear(body.year)
    const color = sanitizeString(body.color, { maxLength: 30 })
    const license_plate = validateLicensePlate(body.license_plate)
    const nickname = sanitizeString(body.nickname, { maxLength: 50 })
    const current_mileage = validateInteger(body.current_mileage, { min: 0, max: 999999 })

    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      )
    }

    const { data: car, error } = await supabase
      .from('cars')
      .insert({
        user_id: user.id,
        org_id: membership.org_id,
        make,
        model,
        year,
        color,
        license_plate,
        nickname,
        current_mileage
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating car:', error)
      return NextResponse.json({
        error: 'Failed to create car',
        // Only expose details in development
        ...(process.env.NODE_ENV !== 'production' && {
          details: error.message,
          code: error.code
        })
      }, { status: 500 })
    }

    // Handle Stripe subscription update for Business tier users
    let prorationInfo = null
    const userPlan = await getOrgSubscriptionPlan(supabase, user.id)

    if (userPlan === 'business') {
      // Get new vehicle count (including the one just added)
      const { count: vehicleCount } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', membership.org_id)

      if (vehicleCount) {
        // Update Stripe subscription quantity
        const result = await updateStripeSubscriptionQuantity(user.id, vehicleCount)

        if (result.success) {
          prorationInfo = {
            prorationAmount: result.prorationAmount,
            message: result.message
          }
        } else {
          console.error('Failed to update Stripe subscription:', result.error)
          // Don't fail the car creation if Stripe update fails - log and continue
        }
      }
    }

    return NextResponse.json({
      car,
      proration: prorationInfo
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
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

    // Check org membership and editor role
    const membership = await getUserOrg(supabase, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }

    if (!(await canEdit(supabase, user.id))) {
      return NextResponse.json({ error: 'Viewers cannot update vehicles' }, { status: 403 })
    }

    // Parse and validate input
    const body = await request.json()

    const carId = validateUUID(body.carId)
    const current_mileage = validateInteger(body.current_mileage, { min: 0, max: 999999 })
    const manual_override = body.manual_override

    if (!carId || current_mileage === null) {
      return NextResponse.json(
        { error: 'Valid car ID and current_mileage are required' },
        { status: 400 }
      )
    }

    // For manual overrides (direct editing), allow any value
    // For automatic updates (from fill-ups/maintenance), only allow increases
    if (!manual_override) {
      const { data: currentCar } = await supabase
        .from('cars')
        .select('current_mileage')
        .eq('id', carId)
        .eq('org_id', membership.org_id)
        .single()

      const newMileage = current_mileage
      const shouldReject = currentCar?.current_mileage && currentCar.current_mileage >= newMileage

      if (shouldReject) {
        return NextResponse.json(
          { error: 'Cannot set mileage lower than current reading' },
          { status: 400 }
        )
      }
    }

    const { data: car, error } = await supabase
      .from('cars')
      .update({ current_mileage })
      .eq('id', carId)
      .eq('org_id', membership.org_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating car mileage:', error)
      return NextResponse.json({
        error: 'Failed to update car mileage',
        // Only expose details in development
        ...(process.env.NODE_ENV !== 'production' && {
          details: error.message
        })
      }, { status: 500 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}