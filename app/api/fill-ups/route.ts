import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      car_id,
      date,
      odometer_reading,
      gallons,
      price_per_gallon,
      gas_station,
      location,
      notes
    } = body

    if (!car_id || !odometer_reading || !gallons || !price_per_gallon) {
      return NextResponse.json(
        { error: 'Car ID, odometer reading, gallons, and price per gallon are required' },
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

    const total_cost = parseFloat((parseFloat(gallons) * parseFloat(price_per_gallon)).toFixed(2))

    const { data: fillUp, error } = await supabase
      .from('fill_ups')
      .insert({
        car_id,
        date: date || new Date().toISOString().split('T')[0],
        odometer_reading: parseInt(odometer_reading),
        gallons: parseFloat(gallons),
        price_per_gallon: parseFloat(price_per_gallon),
        total_cost,
        gas_station: gas_station?.trim(),
        location: location?.trim(),
        notes: notes?.trim()
      })
      .select(`
        *,
        cars(*)
      `)
      .single()

    if (error) {
      console.error('Error creating fill-up:', error)
      return NextResponse.json({ error: 'Failed to create fill-up' }, { status: 500 })
    }

    return NextResponse.json({ fillUp }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}