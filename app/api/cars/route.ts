import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: cars, error } = await supabase
      .from('cars')
      .select(`
        *,
        fill_ups!inner(count),
        maintenance_records!inner(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cars:', error)
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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