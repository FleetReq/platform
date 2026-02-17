import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, isOwner } from '@/lib/supabase'
import { verifyCarAccess } from '@/lib/org'

interface BulkFillUpData {
  miles: number
  gallons: number
  date: string
  odometer_reading: number
  price_per_gallon: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow owner to bulk import fill-ups
    if (!isOwner(user.id)) {
      return NextResponse.json({
        error: 'Read-only access: Only the owner can bulk import fill-ups',
        isReadOnly: true
      }, { status: 403 })
    }

    const body = await request.json()
    const { car_id, fill_ups }: { car_id: string, fill_ups: BulkFillUpData[] } = body

    if (!car_id || !fill_ups || !Array.isArray(fill_ups)) {
      return NextResponse.json(
        { error: 'Car ID and fill_ups array are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this car through their org
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    const carAccess = await verifyCarAccess(supabase, user.id, car_id, activeOrgId)
    if (!carAccess.hasAccess) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    // Prepare fill-up records for bulk insert
    const fillUpRecords = fill_ups.map((fillUp) => ({
      car_id,
      date: fillUp.date,
      odometer_reading: fillUp.odometer_reading,
      gallons: fillUp.gallons,
      price_per_gallon: fillUp.price_per_gallon,
      total_cost: parseFloat((fillUp.gallons * fillUp.price_per_gallon).toFixed(2)),
      gas_station: 'Costco',
      location: 'Aloha, Oregon - Jenkins Rd',
      mpg: fillUp.miles > 0 ? parseFloat((fillUp.miles / fillUp.gallons).toFixed(2)) : null
    }))


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