import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

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

    const body = await request.json()
    const {
      car_id,
      date,
      type,
      oil_type,
      cost,
      mileage,
      service_provider,
      location,
      next_service_date,
      next_service_mileage,
      notes
    } = body

    if (!car_id || !type) {
      return NextResponse.json(
        { error: 'Car ID and type are required' },
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

    // Build insert object conditionally to handle missing columns gracefully
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: Record<string, any> = {
      car_id,
      date: date || new Date().toISOString().split('T')[0],
      type,
      cost: cost ? parseFloat(cost) : null,
      mileage: mileage ? parseInt(mileage) : null,
      service_provider: service_provider?.trim(),
      location: location?.trim(),
      next_service_date,
      next_service_mileage: next_service_mileage ? parseInt(next_service_mileage) : null,
      notes: notes?.trim(),
      created_by_user_id: user.id
    }

    // Only add oil_type if it exists (for backward compatibility)
    if (oil_type) {
      insertData.oil_type = oil_type.trim()
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
      return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 })
    }

    // Update the car's current mileage if the new odometer reading is higher or if no current mileage exists
    const { data: currentCar } = await supabase
      .from('cars')
      .select('current_mileage')
      .eq('id', car_id)
      .eq('user_id', user.id)
      .single()

    const newMileage = parseInt(mileage)
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

    return NextResponse.json({ maintenanceRecord }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}