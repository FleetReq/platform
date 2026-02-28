import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { STORAGE_BUCKET_RECEIPTS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// POST /api/cron/cleanup-expired-accounts - Delete accounts past their scheduled deletion date
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (GitHub Actions or Vercel Cron)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role key to bypass RLS for system operations
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Find orgs scheduled for deletion (scheduled_deletion_date has passed)
    const { data: expiredOrgs, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, subscription_plan, scheduled_deletion_date, cancellation_requested_at')
      .not('scheduled_deletion_date', 'is', null)
      .lt('scheduled_deletion_date', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching expired profiles:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch expired accounts', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!expiredOrgs || expiredOrgs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to clean up',
        deleted_count: 0,
      })
    }

    const deletedAccounts = []
    const errors = []

    // Delete each expired org and its members
    for (const org of expiredOrgs) {
      try {
        const orgId = org.id

        // Get all members of this org
        const { data: members } = await supabase
          .from('org_members')
          .select('user_id')
          .eq('org_id', orgId)
          .not('user_id', 'is', null)

        const memberUserIds = (members || []).map(m => m.user_id).filter(Boolean)

        // Delete receipt storage for org
        const { data: storageFiles } = await supabase.storage
          .from(STORAGE_BUCKET_RECEIPTS)
          .list(orgId, { limit: 1000 })
        if (storageFiles && storageFiles.length > 0) {
          const allPaths: string[] = []
          const listRecursive = async (prefix: string) => {
            const { data: items } = await supabase.storage.from(STORAGE_BUCKET_RECEIPTS).list(prefix, { limit: 1000 })
            if (items) {
              for (const item of items) {
                const fullPath = `${prefix}/${item.name}`
                if (item.metadata) {
                  allPaths.push(fullPath)
                } else {
                  await listRecursive(fullPath)
                }
              }
            }
          }
          await listRecursive(orgId)
          if (allPaths.length > 0) {
            await supabase.storage.from(STORAGE_BUCKET_RECEIPTS).remove(allPaths)
          }
        }

        // Delete cars (cascades delete fill_ups and maintenance_records)
        const { error: carsError } = await supabase
          .from('cars')
          .delete()
          .eq('org_id', orgId)

        if (carsError) {
          throw new Error(`Failed to delete cars: ${carsError.message}`)
        }

        // Delete org members
        const { error: membersError } = await supabase
          .from('org_members')
          .delete()
          .eq('org_id', orgId)

        if (membersError) {
          throw new Error(`Failed to delete org members: ${membersError.message}`)
        }

        // Delete organization
        const { error: orgError } = await supabase
          .from('organizations')
          .delete()
          .eq('id', orgId)

        if (orgError) {
          throw new Error(`Failed to delete organization: ${orgError.message}`)
        }

        // Delete auth accounts only for members who have no other org memberships.
        // A user who belongs to multiple orgs should keep their account — they just
        // lose membership in this org (already deleted above).
        for (const userId of memberUserIds) {
          const { count } = await supabase
            .from('org_members')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
          if ((count ?? 0) === 0) {
            // No remaining org memberships — safe to delete the auth account
            await supabase.from('user_profiles').delete().eq('id', userId)
            const { error: authError } = await supabase.auth.admin.deleteUser(userId)
            if (authError) {
              console.error(`Failed to delete auth user ${userId}:`, authError)
            }
          }
        }

        deletedAccounts.push({
          org_id: orgId,
          org_name: org.name,
          subscription_plan: org.subscription_plan,
          scheduled_deletion_date: org.scheduled_deletion_date,
          cancellation_requested_at: org.cancellation_requested_at,
          members_deleted: memberUserIds.length,
        })

        console.info(`Deleted org: ${org.name} (${orgId}), ${memberUserIds.length} members`)
      } catch (deleteError) {
        const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError)
        errors.push({
          org_id: org.id,
          org_name: org.name,
          error: errorMessage,
        })
        console.error(`Error deleting org ${org.name}:`, errorMessage)
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

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Find orgs scheduled for deletion
    const { data: expiredOrgs, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, subscription_plan, scheduled_deletion_date, cancellation_requested_at')
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
      count: expiredOrgs?.length || 0,
      accounts: expiredOrgs || [],
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
