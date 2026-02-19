import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, validateFloat, validateUUID, validateDate, validateMaintenanceType } from '@/lib/validation'
import { withOrg, errorResponse } from '@/lib/api-middleware'
import { verifyCarAccess, getOrgSubscriptionPlan } from '@/lib/org'

export async function GET(request: NextRequest) {
  return withOrg(request, async ({ supabase, membership }) => {
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('car_id')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    let query = supabase
      .from('maintenance_records')
      .select(`*, cars!inner(*)`)
      .eq('cars.org_id', membership.org_id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (carId) query = query.eq('car_id', carId)
    if (type) query = query.eq('type', type)

    const { data: maintenanceRecords, error } = await query

    if (error) {
      console.error('Error fetching maintenance records:', error)
      return errorResponse('Failed to fetch maintenance records', 500)
    }

    return NextResponse.json({ maintenanceRecords })
  }, { rateLimitConfig: RATE_LIMITS.READ, emptyOnUnauth: 'maintenanceRecords' })
}

export async function POST(request: NextRequest) {
  return withOrg(request, async ({ supabase, user, activeOrgId }) => {
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

    let receipt_urls: string[] | undefined
    if (Array.isArray(body.receipt_urls)) {
      if (body.receipt_urls.length > 5) {
        return errorResponse('Maximum 5 receipt photos allowed', 400)
      }
      receipt_urls = body.receipt_urls.filter(
        (url: unknown) => typeof url === 'string' && url.length < 500
      )
    }

    if (!car_id || !type) {
      return errorResponse('Valid car ID and maintenance type are required', 400)
    }

    const carAccess = await verifyCarAccess(supabase, user.id, car_id, activeOrgId)
    if (!carAccess.hasAccess) return errorResponse('Car not found', 404)
    if (!carAccess.canEdit) return errorResponse('Viewers cannot add maintenance records', 403)

    const userPlan = await getOrgSubscriptionPlan(supabase, user.id, activeOrgId)

    if (userPlan === 'free') {
      if (next_service_date || next_service_mileage) {
        return errorResponse('Next service scheduling requires Family plan or higher', 403)
      }
      if (receipt_urls && receipt_urls.length > 0) {
        return errorResponse('Receipt uploads require Family plan or higher', 403)
      }
    }

    const { data: maintenanceRecord, error } = await supabase
      .from('maintenance_records')
      .insert({
        car_id, date, type, cost, mileage, service_provider, location,
        next_service_date, next_service_mileage, notes,
        created_by_user_id: user.id,
        ...(oil_type ? { oil_type } : {}),
        ...(receipt_urls && receipt_urls.length > 0 ? { receipt_urls } : {}),
      })
      .select(`*, cars(*)`)
      .single()

    if (error) {
      console.error('Error creating maintenance record:', error)
      return errorResponse('Failed to create maintenance record', 500)
    }

    // Update car's current mileage if higher
    if (mileage) {
      const { data: currentCar } = await supabase
        .from('cars')
        .select('current_mileage')
        .eq('id', car_id)
        .eq('org_id', carAccess.orgId!)
        .single()

      if (!currentCar?.current_mileage || currentCar.current_mileage < mileage) {
        await supabase
          .from('cars')
          .update({ current_mileage: mileage })
          .eq('id', car_id)
          .eq('org_id', carAccess.orgId!)
      }
    }

    return NextResponse.json({ maintenanceRecord }, { status: 201 })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
