import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, isOwner, getOwnerUserId } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
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
      .eq('cars.user_id', getOwnerUserId())
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
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow owner to create maintenance records
    if (!isOwner(user.id)) {
      return NextResponse.json({
        error: 'Read-only access: Only the owner can add maintenance records',
        isReadOnly: true
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      car_id,
      date,
      type,
      description,
      cost,
      mileage,
      service_provider,
      location,
      next_service_date,
      next_service_mileage,
      notes
    } = body

    if (!car_id || !type || !description || cost === undefined || !mileage) {
      return NextResponse.json(
        { error: 'Car ID, type, description, cost, and mileage are required' },
        { status: 400 }
      )
    }

    // Verify the car belongs to the user
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', car_id)
      .eq('user_id', getOwnerUserId())
      .single()

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    const { data: maintenanceRecord, error } = await supabase
      .from('maintenance_records')
      .insert({
        car_id,
        date: date || new Date().toISOString().split('T')[0],
        type,
        description: description.trim(),
        cost: parseFloat(cost),
        mileage: parseInt(mileage),
        service_provider: service_provider?.trim(),
        location: location?.trim(),
        next_service_date,
        next_service_mileage: next_service_mileage ? parseInt(next_service_mileage) : null,
        notes: notes?.trim()
      })
      .select(`
        *,
        cars(*)
      `)
      .single()

    if (error) {
      console.error('Error creating maintenance record:', error)
      return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 })
    }

    return NextResponse.json({ maintenanceRecord }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}