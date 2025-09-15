import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: car, error } = await supabase
      .from('cars')
      .select(`
        *,
        fill_ups(*),
        maintenance_records(*)
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching car:', error)
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { make, model, year, color, license_plate, nickname } = body

    const { data: car, error } = await supabase
      .from('cars')
      .update({
        make: make?.trim(),
        model: model?.trim(),
        year: year ? parseInt(year) : undefined,
        color: color?.trim(),
        license_plate: license_plate?.trim(),
        nickname: nickname?.trim()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating car:', error)
      return NextResponse.json({ error: 'Failed to update car' }, { status: 500 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting car:', error)
      return NextResponse.json({ error: 'Failed to delete car' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Car deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}