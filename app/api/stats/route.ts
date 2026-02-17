import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getOwnerUserId, isOwner } from '@/lib/supabase'
import { getUserOrg } from '@/lib/org'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
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
      // User-specific stats - check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      // Determine which user's data to show
      const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
      let orgFilter: { column: string; value: string } | null = null
      if (user && authError === null) {
        const membership = await getUserOrg(supabase, user.id, activeOrgId)
        if (membership) {
          orgFilter = { column: 'org_id', value: membership.org_id }
        }
      }

      // Fallback for unauthenticated or no-org users: show owner's data for demo
      if (!orgFilter) {
        orgFilter = { column: 'user_id', value: getOwnerUserId() }
      }

      // Get cars
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('id')
        .eq(orgFilter.column, orgFilter.value)

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
            worst_mpg: 0,
            total_miles: 0,
            cost_per_mile: 0,
            business_miles: 0,
            business_percentage: 0,
            ytd_fuel_cost: 0,
            ytd_maintenance_cost: 0,
            ytd_total_cost: 0,
            this_month_fuel_cost: 0,
            this_month_maintenance_cost: 0,
            this_month_total_cost: 0
          }
        })
      }

      // Get fill-up stats (including miles_driven for total miles calculation and date for YTD/monthly)
      const { data: fillUpStats, error: fillUpError } = await supabase
        .from('fill_ups')
        .select('mpg, gallons, total_cost, miles_driven, date')
        .in('car_id', carIds)

      if (fillUpError) {
        console.error('Error fetching fill-up stats:', fillUpError)
        return NextResponse.json({ error: 'Failed to fetch fill-up stats' }, { status: 500 })
      }

      // Get maintenance stats (including date for YTD/monthly calculations)
      const { data: maintenanceStats, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .select('cost, date')
        .in('car_id', carIds)

      if (maintenanceError) {
        console.error('Error fetching maintenance stats:', maintenanceError)
        return NextResponse.json({ error: 'Failed to fetch maintenance stats' }, { status: 500 })
      }

      // Get trip stats for business miles calculation
      const { data: tripStats, error: tripError } = await supabase
        .from('trips')
        .select('miles, purpose')
        .in('car_id', carIds)

      if (tripError) {
        console.error('Error fetching trip stats:', tripError)
        return NextResponse.json({ error: 'Failed to fetch trip stats' }, { status: 500 })
      }

      // Calculate statistics
      const mpgValues = fillUpStats
        .map(f => f.mpg)
        .filter(mpg => mpg !== null && mpg > 0) as number[]

      const totalGallons = fillUpStats.reduce((sum, f) => sum + (f.gallons || 0), 0)
      const totalSpent = fillUpStats.reduce((sum, f) => sum + (f.total_cost || 0), 0)
      const totalMaintenanceCost = maintenanceStats.reduce((sum, m) => sum + (m.cost || 0), 0)

      // Calculate total miles driven (sum of miles_driven from all fill-ups)
      const totalMiles = fillUpStats.reduce((sum, f) => sum + (f.miles_driven || 0), 0)

      // Calculate business miles from trips table (sum of miles where purpose='business')
      const businessMiles = tripStats
        ? tripStats.reduce((sum, t) => sum + (t.purpose === 'business' ? (t.miles || 0) : 0), 0)
        : 0

      // Calculate business percentage (business miles / total miles * 100)
      const businessPercentage = totalMiles > 0 ? (businessMiles / totalMiles) * 100 : 0

      // Calculate cost per mile (total expenses / total miles)
      const totalExpenses = totalSpent + totalMaintenanceCost
      const costPerMile = totalMiles > 0 ? totalExpenses / totalMiles : 0

      // Calculate YTD (Year-to-Date) metrics
      const now = new Date()
      const yearStart = new Date(now.getFullYear(), 0, 1) // January 1st of current year
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1) // 1st day of current month

      // YTD fill-up costs
      const ytdFillUps = fillUpStats.filter(f => {
        if (!f.date) return false
        const fillUpDate = new Date(f.date)
        return fillUpDate >= yearStart
      })
      const ytdFuelCost = ytdFillUps.reduce((sum, f) => sum + (f.total_cost || 0), 0)

      // YTD maintenance costs
      const ytdMaintenance = maintenanceStats.filter(m => {
        if (!m.date) return false
        const maintDate = new Date(m.date)
        return maintDate >= yearStart
      })
      const ytdMaintenanceCost = ytdMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0)

      // This Month fill-up costs
      const thisMonthFillUps = fillUpStats.filter(f => {
        if (!f.date) return false
        const fillUpDate = new Date(f.date)
        return fillUpDate >= monthStart
      })
      const thisMonthFuelCost = thisMonthFillUps.reduce((sum, f) => sum + (f.total_cost || 0), 0)

      // This Month maintenance costs
      const thisMonthMaintenance = maintenanceStats.filter(m => {
        if (!m.date) return false
        const maintDate = new Date(m.date)
        return maintDate >= monthStart
      })
      const thisMonthMaintenanceCost = thisMonthMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0)

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
        worst_mpg: mpgValues.length > 0 ? Math.min(...mpgValues) : 0,
        // New metrics for Budget Focus panel
        total_miles: Math.round(totalMiles),
        cost_per_mile: Math.round(costPerMile * 100) / 100,
        // Business miles for tax tracking
        business_miles: Math.round(businessMiles),
        business_percentage: Math.round(businessPercentage * 10) / 10, // Round to 1 decimal (e.g., 45.3%)
        // YTD (Year-to-Date) metrics
        ytd_fuel_cost: Math.round(ytdFuelCost * 100) / 100,
        ytd_maintenance_cost: Math.round(ytdMaintenanceCost * 100) / 100,
        ytd_total_cost: Math.round((ytdFuelCost + ytdMaintenanceCost) * 100) / 100,
        // This Month metrics
        this_month_fuel_cost: Math.round(thisMonthFuelCost * 100) / 100,
        this_month_maintenance_cost: Math.round(thisMonthMaintenanceCost * 100) / 100,
        this_month_total_cost: Math.round((thisMonthFuelCost + thisMonthMaintenanceCost) * 100) / 100
      }

      return NextResponse.json({ stats })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}