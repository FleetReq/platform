import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('Cars API: No authenticated user, returning empty array')
      return NextResponse.json({ cars: [] })
    }

    console.log('Cars API: Fetching cars for user:', user.email, user.id)

    const { data: cars, error: carsError} = await supabase
      .from('cars')
      .select(`
        *,
        fill_ups!inner(count),
        maintenance_records!inner(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('Cars API: Query result - cars:', cars?.length || 0, 'error:', carsError?.message || 'none')

    if (carsError) {
      console.error('Error fetching cars:', carsError)
      return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
    }

    // Temporary debug info
    return NextResponse.json({
      cars,
      _debug: {
        userId: user.id,
        userEmail: user.email,
        carCount: cars?.length || 0,
        hasError: !!carsError
      }
    })
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

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    // Allow all authenticated users to create cars
    const body = await request.json()
    const { make, model, year, color, license_plate, nickname, current_mileage } = body

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
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        color: color?.trim(),
        license_plate: license_plate?.trim(),
        nickname: nickname?.trim(),
        current_mileage: current_mileage ? parseInt(current_mileage) : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating car:', error)
      return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
    }

    return NextResponse.json({ car }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    // Allow all authenticated users to update their own cars
    const body = await request.json()
    const { carId, current_mileage, manual_override } = body

    if (!carId || current_mileage === undefined) {
      return NextResponse.json(
        { error: 'Car ID and current_mileage are required' },
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
        .eq('user_id', user.id)
        .single()

      const newMileage = Number(current_mileage)
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
      .update({ current_mileage: Number(current_mileage) })
      .eq('id', carId)
      .eq('user_id', user.id) // Ensure user can only update their own cars
      .select()
      .single()

    if (error) {
      console.error('Error updating car mileage:', error)
      return NextResponse.json({ error: 'Failed to update car mileage' }, { status: 500 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}