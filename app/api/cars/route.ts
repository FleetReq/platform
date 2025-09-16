import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, isOwner, getOwnerUserId } from '@/lib/supabase'

export async function GET() {
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


    // Always show owner's cars for demo purposes
    const targetUserId = getOwnerUserId()


    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select(`
        *,
        fill_ups!inner(count),
        maintenance_records!inner(count)
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (carsError) {
      console.error('Error fetching cars:', carsError)
      return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
    }

    return NextResponse.json({ cars })
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


    // Only allow owner to create cars
    if (!isOwner(user.id)) {
      return NextResponse.json({
        error: 'Read-only access: Only the owner can add cars',
        isReadOnly: true
      }, { status: 403 })
    }

    const body = await request.json()
    const { make, model, year, color, license_plate, nickname } = body

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
        nickname: nickname?.trim()
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