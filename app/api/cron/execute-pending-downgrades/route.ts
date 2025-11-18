import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const TIER_LIMITS = {
  free: 1,
  personal: 3,
  business: 999
}

// POST /api/cron/execute-pending-downgrades - Execute downgrades that have reached their effective date
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (GitHub Actions or Vercel Cron)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role key to bypass RLS for system operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find pending downgrades that have reached their effective date
    const { data: pendingDowngrades, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, subscription_plan, pending_downgrade_tier, downgrade_effective_date, downgrade_requested_at')
      .not('pending_downgrade_tier', 'is', null)
      .not('downgrade_effective_date', 'is', null)
      .lt('downgrade_effective_date', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching pending downgrades:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch pending downgrades', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!pendingDowngrades || pendingDowngrades.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending downgrades to execute',
        executed_count: 0,
      })
    }

    const executedDowngrades = []
    const errors = []

    // Execute each pending downgrade
    for (const profile of pendingDowngrades) {
      try {
        const userId = profile.id
        const targetTier = profile.pending_downgrade_tier as 'free' | 'personal'
        const currentTier = profile.subscription_plan
        const targetLimit = TIER_LIMITS[targetTier]

        // Check vehicle count
        const { count: vehicleCount } = await supabase
          .from('cars')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        const currentVehicles = vehicleCount || 0
        let vehiclesDeleted = 0

        // Safety check: Delete excess vehicles if they still exist
        // (Should have been deleted during downgrade request, but double-check)
        if (currentVehicles > targetLimit) {
          const excessCount = currentVehicles - targetLimit

          // Get all vehicles ordered by created_at (delete oldest first)
          const { data: vehicles, error: vehiclesError } = await supabase
            .from('cars')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(excessCount)

          if (vehiclesError) {
            throw new Error(`Failed to fetch excess vehicles: ${vehiclesError.message}`)
          }

          // Delete excess vehicles
          if (vehicles && vehicles.length > 0) {
            const vehicleIds = vehicles.map(v => v.id)
            const { error: deleteError } = await supabase
              .from('cars')
              .delete()
              .in('id', vehicleIds)

            if (deleteError) {
              throw new Error(`Failed to delete excess vehicles: ${deleteError.message}`)
            }

            vehiclesDeleted = vehicles.length
            console.log(`Deleted ${vehiclesDeleted} excess vehicles for user ${userId}`)
          }
        }

        // Execute downgrade: Update subscription_plan and clear pending fields
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_plan: targetTier,
            current_tier_start_date: new Date().toISOString(),
            pending_downgrade_tier: null,
            downgrade_effective_date: null,
            downgrade_requested_at: null,
          })
          .eq('id', userId)

        if (updateError) {
          throw new Error(`Failed to update user profile: ${updateError.message}`)
        }

        executedDowngrades.push({
          user_id: userId,
          email: profile.email,
          previous_tier: currentTier,
          new_tier: targetTier,
          downgrade_requested_at: profile.downgrade_requested_at,
          downgrade_effective_date: profile.downgrade_effective_date,
          vehicles_deleted: vehiclesDeleted,
        })

        console.log(`Executed downgrade: ${profile.email} (${currentTier} → ${targetTier})`)
      } catch (downgradeError) {
        const errorMessage = downgradeError instanceof Error ? downgradeError.message : String(downgradeError)
        errors.push({
          user_id: profile.id,
          email: profile.email,
          error: errorMessage,
        })
        console.error(`Error executing downgrade for ${profile.email}:`, errorMessage)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Executed ${executedDowngrades.length} pending downgrades`,
      executed_count: executedDowngrades.length,
      executed_downgrades: executedDowngrades,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Execute downgrades error:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute pending downgrades',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// GET /api/cron/execute-pending-downgrades - Check for pending downgrades ready to execute (read-only)
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find pending downgrades that have reached their effective date
    const { data: pendingDowngrades, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, subscription_plan, pending_downgrade_tier, downgrade_effective_date, downgrade_requested_at')
      .not('pending_downgrade_tier', 'is', null)
      .not('downgrade_effective_date', 'is', null)
      .lt('downgrade_effective_date', new Date().toISOString())

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch pending downgrades', details: fetchError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: pendingDowngrades?.length || 0,
      pending_downgrades: pendingDowngrades || [],
    })
  } catch (error) {
    console.error('Check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check pending downgrades',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
