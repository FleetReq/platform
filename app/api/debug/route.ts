import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getOwnerUserId } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    if (!supabase) {
      return NextResponse.json({
        error: 'Database not configured',
        env_vars: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url_value: process.env.NEXT_PUBLIC_SUPABASE_URL,
        }
      }, { status: 503 })
    }

    // Check if we can access any tables at all
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    // Try a basic test query
    const { data: testData, error: testError } = await supabase
      .rpc('get_current_user_id')

    // Check RLS policies
    const { data: rlsInfo, error: rlsError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'cars')

    const targetUserId = getOwnerUserId()

    // Test basic connection with detailed error logging
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', targetUserId)

    const { data: allCars, error: allCarsError } = await supabase
      .from('cars')
      .select('*')

    // Check what user_ids actually exist
    const { data: userIds, error: userIdsError } = await supabase
      .from('cars')
      .select('user_id')

    // Try without any filters
    const { data: rawCars, error: rawError } = await supabase
      .from('cars')
      .select('id, user_id, make, model, year')

    // Test simple count query
    const { count, error: countError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })

    // Test the exact query from the cars API (simplified)
    const { data: apiCars, error: apiError } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      targetUserId,
      env_vars: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url_value: process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      database: {
        tables: tables,
        tablesError,
        testData,
        testError,
        rlsInfo,
        rlsError
      },
      cars: {
        count: cars?.length || 0,
        data: cars,
        error: carsError
      },
      allCars: {
        count: allCars?.length || 0,
        data: allCars,
        error: allCarsError
      },
      userIds: {
        data: userIds,
        error: userIdsError
      },
      rawCars: {
        count: rawCars?.length || 0,
        data: rawCars,
        error: rawError
      },
      countQuery: {
        count,
        error: countError
      },
      apiCars: {
        count: apiCars?.length || 0,
        data: apiCars,
        error: apiError
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}