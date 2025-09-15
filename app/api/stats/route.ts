import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('public') === 'true'

    if (isPublic) {
      // Public stats - no authentication required
      const { data: stats, error } = await supabase
        .from('public_stats')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching public stats:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
      }

      return NextResponse.json({ stats })
    } else {
      // User-specific stats - authentication required
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get user's cars
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('id')
        .eq('user_id', user.id)

      if (carsError) {
        console.error('Error fetching user cars:', carsError)
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
      }

      const carIds = cars.map(car => car.id)

      if (carIds.length === 0) {
        return NextResponse.json({
          stats: {
            total_cars: 0,
            total_fill_ups: 0,
            average_mpg: 0,
            total_gallons: 0,
            total_spent: 0,
            total_maintenance_records: 0,
            total_maintenance_cost: 0,
            recent_mpg: 0,
            best_mpg: 0,
            worst_mpg: 0
          }
        })
      }

      // Get fill-up stats
      const { data: fillUpStats, error: fillUpError } = await supabase
        .from('fill_ups')
        .select('mpg, gallons, total_cost')
        .in('car_id', carIds)

      if (fillUpError) {
        console.error('Error fetching fill-up stats:', fillUpError)
        return NextResponse.json({ error: 'Failed to fetch fill-up stats' }, { status: 500 })
      }

      // Get maintenance stats
      const { data: maintenanceStats, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .select('cost')
        .in('car_id', carIds)

      if (maintenanceError) {
        console.error('Error fetching maintenance stats:', maintenanceError)
        return NextResponse.json({ error: 'Failed to fetch maintenance stats' }, { status: 500 })
      }

      // Calculate statistics
      const mpgValues = fillUpStats
        .map(f => f.mpg)
        .filter(mpg => mpg !== null && mpg > 0) as number[]

      const totalGallons = fillUpStats.reduce((sum, f) => sum + (f.gallons || 0), 0)
      const totalSpent = fillUpStats.reduce((sum, f) => sum + (f.total_cost || 0), 0)
      const totalMaintenanceCost = maintenanceStats.reduce((sum, m) => sum + (m.cost || 0), 0)

      const stats = {
        total_cars: cars.length,
        total_fill_ups: fillUpStats.length,
        average_mpg: mpgValues.length > 0 ?
          Math.round((mpgValues.reduce((sum, mpg) => sum + mpg, 0) / mpgValues.length) * 100) / 100 : 0,
        total_gallons: Math.round(totalGallons * 100) / 100,
        total_spent: Math.round(totalSpent * 100) / 100,
        total_maintenance_records: maintenanceStats.length,
        total_maintenance_cost: Math.round(totalMaintenanceCost * 100) / 100,
        recent_mpg: mpgValues.length > 0 ? mpgValues[0] : 0,
        best_mpg: mpgValues.length > 0 ? Math.max(...mpgValues) : 0,
        worst_mpg: mpgValues.length > 0 ? Math.min(...mpgValues) : 0
      }

      return NextResponse.json({ stats })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}