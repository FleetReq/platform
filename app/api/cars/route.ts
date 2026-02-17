import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeString, validateYear, validateInteger, validateLicensePlate, validateUUID } from '@/lib/validation'
import { withOrg, READ_RATE_LIMIT, errorResponse } from '@/lib/api-middleware'
import { getOrgSubscriptionPlan, canEdit } from '@/lib/org'
import { updateStripeSubscriptionQuantity } from '@/lib/stripe-helpers'

export async function GET(request: NextRequest) {
  return withOrg(request, async ({ supabase, membership }) => {
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select(`
        *,
        fill_ups!inner(count),
        maintenance_records!inner(count)
      `)
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false })

    if (carsError) {
      console.error('Error fetching cars:', carsError)
      return errorResponse('Failed to fetch cars', 500)
    }

    return NextResponse.json({ cars })
  }, { ...READ_RATE_LIMIT, emptyOnUnauth: 'cars' })
}

export async function POST(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    if (!(await canEdit(supabase, user.id, activeOrgId))) {
      return errorResponse('Viewers cannot add vehicles', 403)
    }

    const body = await request.json()

    const make = sanitizeString(body.make, { maxLength: 50 })
    const model = sanitizeString(body.model, { maxLength: 50 })
    const year = validateYear(body.year)
    const color = sanitizeString(body.color, { maxLength: 30 })
    const license_plate = validateLicensePlate(body.license_plate)
    const nickname = sanitizeString(body.nickname, { maxLength: 50 })
    const current_mileage = validateInteger(body.current_mileage, { min: 0, max: 999999 })

    if (!make || !model || !year) {
      return errorResponse('Make, model, and year are required', 400)
    }

    const { data: car, error } = await supabase
      .from('cars')
      .insert({
        user_id: user.id,
        org_id: membership.org_id,
        make, model, year, color, license_plate, nickname, current_mileage
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating car:', error)
      return errorResponse('Failed to create car', 500)
    }

    // Handle Stripe subscription update for Business tier users
    let prorationInfo = null
    const userPlan = await getOrgSubscriptionPlan(supabase, user.id, activeOrgId)

    if (userPlan === 'business') {
      const { count: vehicleCount } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', membership.org_id)

      if (vehicleCount) {
        const result = await updateStripeSubscriptionQuantity(user.id, vehicleCount)
        if (result.success) {
          prorationInfo = { prorationAmount: result.prorationAmount, message: result.message }
        } else {
          console.error('Failed to update Stripe subscription:', result.error)
        }
      }
    }

    return NextResponse.json({ car, proration: prorationInfo }, { status: 201 })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}

export async function PATCH(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    if (!(await canEdit(supabase, user.id, activeOrgId))) {
      return errorResponse('Viewers cannot update vehicles', 403)
    }

    const body = await request.json()
    const carId = validateUUID(body.carId)
    const current_mileage = validateInteger(body.current_mileage, { min: 0, max: 999999 })
    const manual_override = body.manual_override

    if (!carId || current_mileage === null) {
      return errorResponse('Valid car ID and current_mileage are required', 400)
    }

    if (!manual_override) {
      const { data: currentCar } = await supabase
        .from('cars')
        .select('current_mileage')
        .eq('id', carId)
        .eq('org_id', membership.org_id)
        .single()

      if (currentCar?.current_mileage && currentCar.current_mileage >= current_mileage) {
        return errorResponse('Cannot set mileage lower than current reading', 400)
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
      return errorResponse('Failed to update car mileage', 500)
    }

    return NextResponse.json({ car })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
