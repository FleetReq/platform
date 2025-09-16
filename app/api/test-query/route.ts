import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Create client directly (bypass our wrapper)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try different approaches
    const query1 = await supabase
      .from('cars')
      .select('*')

    const query2 = await supabase
      .from('cars')
      .select('id, user_id, make, model, year')
      .eq('user_id', 'b73a07b2-ed72-41b1-943f-e119afc9eddb')

    const query3 = await supabase
      .from('cars')
      .select('*')
      .eq('make', 'Toyota')

    // Check table info
    const tableInfo = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      direct_connection: true,
      queries: {
        all_cars: {
          count: query1.data?.length || 0,
          data: query1.data,
          error: query1.error
        },
        by_user_id: {
          count: query2.data?.length || 0,
          data: query2.data,
          error: query2.error
        },
        by_make: {
          count: query3.data?.length || 0,
          data: query3.data,
          error: query3.error
        },
        table_count: {
          count: tableInfo.count,
          error: tableInfo.error
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}