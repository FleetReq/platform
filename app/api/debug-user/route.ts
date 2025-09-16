import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Get all cars to see what user_ids exist
    const { data: allCars, error: carsError } = await supabase
      .from('cars')
      .select('id, user_id, make, model')

    return NextResponse.json({
      authenticated_user: user ? {
        id: user.id,
        email: user.email
      } : null,
      auth_error: authError,
      all_cars: allCars,
      cars_error: carsError,
      expected_owner_id: 'b73a07b2-ed72-41b1-943f-e119afc9eddb'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}