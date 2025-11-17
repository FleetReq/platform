import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// POST /api/cron/cleanup-expired-accounts - Delete accounts past their scheduled deletion date
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

    // Find accounts scheduled for deletion (scheduled_deletion_date has passed)
    const { data: expiredProfiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, subscription_plan, scheduled_deletion_date, cancellation_requested_at')
      .not('scheduled_deletion_date', 'is', null)
      .lt('scheduled_deletion_date', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching expired profiles:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch expired accounts', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to clean up',
        deleted_count: 0,
      })
    }

    const deletedAccounts = []
    const errors = []

    // Delete each expired account
    for (const profile of expiredProfiles) {
      try {
        const userId = profile.id

        // Delete user data in order (cascades handle most of this, but being explicit)
        // 1. Delete fill_ups (cascades from car deletion)
        // 2. Delete maintenance_records (cascades from car deletion)
        // 3. Delete cars (will cascade delete fill_ups and maintenance_records)
        const { error: carsError } = await supabase
          .from('cars')
          .delete()
          .eq('user_id', userId)

        if (carsError) {
          throw new Error(`Failed to delete cars: ${carsError.message}`)
        }

        // 4. Delete user_profiles
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', userId)

        if (profileError) {
          throw new Error(`Failed to delete profile: ${profileError.message}`)
        }

        // 5. Delete from auth.users (Supabase Auth Admin API)
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)

        if (authError) {
          // Log but don't fail if auth deletion fails (profile already deleted)
          console.error(`Failed to delete auth user ${userId}:`, authError)
        }

        deletedAccounts.push({
          user_id: userId,
          email: profile.email,
          subscription_plan: profile.subscription_plan,
          scheduled_deletion_date: profile.scheduled_deletion_date,
          cancellation_requested_at: profile.cancellation_requested_at,
        })

        console.log(`Deleted account: ${profile.email} (${userId})`)
      } catch (deleteError) {
        const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError)
        errors.push({
          user_id: profile.id,
          email: profile.email,
          error: errorMessage,
        })
        console.error(`Error deleting account ${profile.email}:`, errorMessage)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedAccounts.length} expired accounts`,
      deleted_count: deletedAccounts.length,
      deleted_accounts: deletedAccounts,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to clean up expired accounts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// GET /api/cron/cleanup-expired-accounts - Check for accounts ready for deletion (read-only)
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

    // Find accounts scheduled for deletion
    const { data: expiredProfiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, subscription_plan, scheduled_deletion_date, cancellation_requested_at')
      .not('scheduled_deletion_date', 'is', null)
      .lt('scheduled_deletion_date', new Date().toISOString())

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch expired accounts', details: fetchError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: expiredProfiles?.length || 0,
      accounts: expiredProfiles || [],
    })
  } catch (error) {
    console.error('Check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check expired accounts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
