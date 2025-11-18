import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cron job to delete data older than 90 days for free tier users
 *
 * Schedule: Daily at 02:00 UTC
 *
 * This enforces the 90-day data retention policy for free tier users.
 * Paid users (Personal/Business) have unlimited history.
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Calculate cutoff date (90 days ago)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0]

    // Get all free tier user IDs
    const { data: freeUsers, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('subscription_plan', 'free')

    if (usersError) {
      console.error('Error fetching free tier users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch free tier users', details: usersError.message },
        { status: 500 }
      )
    }

    if (!freeUsers || freeUsers.length === 0) {
      return NextResponse.json({
        message: 'No free tier users found',
        deletedFillUps: 0,
        deletedMaintenance: 0,
        cutoffDate
      })
    }

    const freeUserIds = freeUsers.map(u => u.id)

    // Delete old fill-ups for free tier users
    // We need to join with cars to get user_id since fill_ups doesn't have user_id directly
    const { data: oldFillUps, error: fillUpsSelectError } = await supabaseAdmin
      .from('fill_ups')
      .select('id, car_id, cars!inner(user_id)')
      .lt('date', cutoffDate)
      .in('cars.user_id', freeUserIds)

    let deletedFillUps = 0
    if (fillUpsSelectError) {
      console.error('Error selecting old fill-ups:', fillUpsSelectError)
    } else if (oldFillUps && oldFillUps.length > 0) {
      const fillUpIds = oldFillUps.map(f => f.id)
      const { error: fillUpsDeleteError } = await supabaseAdmin
        .from('fill_ups')
        .delete()
        .in('id', fillUpIds)

      if (fillUpsDeleteError) {
        console.error('Error deleting old fill-ups:', fillUpsDeleteError)
      } else {
        deletedFillUps = fillUpIds.length
      }
    }

    // Delete old maintenance records for free tier users
    const { data: oldMaintenance, error: maintenanceSelectError } = await supabaseAdmin
      .from('maintenance_records')
      .select('id, car_id, cars!inner(user_id)')
      .lt('date', cutoffDate)
      .in('cars.user_id', freeUserIds)

    let deletedMaintenance = 0
    if (maintenanceSelectError) {
      console.error('Error selecting old maintenance:', maintenanceSelectError)
    } else if (oldMaintenance && oldMaintenance.length > 0) {
      const maintenanceIds = oldMaintenance.map(m => m.id)
      const { error: maintenanceDeleteError } = await supabaseAdmin
        .from('maintenance_records')
        .delete()
        .in('id', maintenanceIds)

      if (maintenanceDeleteError) {
        console.error('Error deleting old maintenance:', maintenanceDeleteError)
      } else {
        deletedMaintenance = maintenanceIds.length
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Free tier data cleanup completed',
      freeUsersCount: freeUsers.length,
      deletedFillUps,
      deletedMaintenance,
      cutoffDate,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in cleanup-free-tier-data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for testing - shows what would be deleted without actually deleting
 */
export async function GET() {
  try {
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Calculate cutoff date (90 days ago)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0]

    // Get all free tier user IDs
    const { data: freeUsers, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, subscription_plan')
      .eq('subscription_plan', 'free')

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch free tier users', details: usersError.message },
        { status: 500 }
      )
    }

    if (!freeUsers || freeUsers.length === 0) {
      return NextResponse.json({
        message: 'No free tier users found',
        freeUsersCount: 0,
        fillUpsToDelete: 0,
        maintenanceToDelete: 0,
        cutoffDate
      })
    }

    const freeUserIds = freeUsers.map(u => u.id)

    // Count old fill-ups
    const { count: fillUpsCount } = await supabaseAdmin
      .from('fill_ups')
      .select('id, cars!inner(user_id)', { count: 'exact', head: true })
      .lt('date', cutoffDate)
      .in('cars.user_id', freeUserIds)

    // Count old maintenance records
    const { count: maintenanceCount } = await supabaseAdmin
      .from('maintenance_records')
      .select('id, cars!inner(user_id)', { count: 'exact', head: true })
      .lt('date', cutoffDate)
      .in('cars.user_id', freeUserIds)

    return NextResponse.json({
      message: 'Preview of data that would be deleted (read-only)',
      freeUsersCount: freeUsers.length,
      fillUpsToDelete: fillUpsCount || 0,
      maintenanceToDelete: maintenanceCount || 0,
      cutoffDate,
      note: 'Use POST request to actually delete the data'
    })
  } catch (error) {
    console.error('Error in cleanup-free-tier-data GET:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
