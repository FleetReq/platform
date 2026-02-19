import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { verifyCarAccess } from '@/lib/org'
import { validateUUID, validateFloat, validateDate } from '@/lib/validation'

interface BulkFillUpData {
  miles: number
  gallons: number
  date: string
  odometer_reading: number
  price_per_gallon: number
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

    const body = await request.json()
    const { car_id, fill_ups }: { car_id: string, fill_ups: BulkFillUpData[] } = body

    if (!car_id || !fill_ups || !Array.isArray(fill_ups)) {
      return NextResponse.json(
        { error: 'Car ID and fill_ups array are required' },
        { status: 400 }
      )
    }

    // Validate car_id is a proper UUID
    const validatedCarId = validateUUID(car_id)
    if (!validatedCarId) {
      return NextResponse.json({ error: 'Invalid car_id format' }, { status: 400 })
    }

    // Verify user has edit access to this car through their org
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    const carAccess = await verifyCarAccess(supabase, user.id, validatedCarId, activeOrgId)
    if (!carAccess.hasAccess) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }
    if (!carAccess.canEdit) {
      return NextResponse.json({ error: 'Viewers cannot import fill-ups' }, { status: 403 })
    }

    // Validate and prepare fill-up records for bulk insert
    const fillUpRecords = []
    for (let i = 0; i < fill_ups.length; i++) {
      const fillUp = fill_ups[i]
      const validatedDate = validateDate(fillUp.date)
      const validatedGallons = validateFloat(fillUp.gallons, { min: 0.001, max: 1000 })
      const validatedOdometer = validateFloat(fillUp.odometer_reading, { min: 0, max: 9999999 })
      const validatedPricePerGallon = validateFloat(fillUp.price_per_gallon, { min: 0, max: 100 })

      if (!validatedDate || validatedGallons === null || validatedOdometer === null || validatedPricePerGallon === null) {
        return NextResponse.json(
          { error: `Invalid data in fill_ups[${i}]: date, gallons, odometer_reading, and price_per_gallon are required and must be valid numbers` },
          { status: 400 }
        )
      }

      fillUpRecords.push({
        car_id: validatedCarId,
        date: validatedDate,
        odometer_reading: validatedOdometer,
        gallons: validatedGallons,
        price_per_gallon: validatedPricePerGallon,
        total_cost: parseFloat((validatedGallons * validatedPricePerGallon).toFixed(2)),
        gas_station: 'Costco',
        location: 'Aloha, Oregon - Jenkins Rd',
      })
    }


    // Bulk insert all fill-ups
    const { data: insertedFillUps, error: insertError } = await supabase
      .from('fill_ups')
      .insert(fillUpRecords)
      .select()

    if (insertError) {
      console.error('Error bulk inserting fill-ups:', insertError)
      return NextResponse.json({
        error: 'Failed to insert fill-ups',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully imported ${insertedFillUps.length} fill-up records`,
      fill_ups: insertedFillUps
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}