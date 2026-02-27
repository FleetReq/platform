import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getUserOrg, getOrgDetails, getOrgSubscriptionPlan } from '@/lib/org'
import { validateUUID } from '@/lib/validation'
import { PLAN_LIMITS } from '@/lib/constants'

if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY env var is required')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
})

// As of Stripe API 2025-03-31, period fields moved from subscription to subscription item level
type SubscriptionItemWithPeriod = Stripe.SubscriptionItem & {
  current_period_end: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { targetTier, vehiclesToDelete } = body as {
      targetTier: 'free' | 'personal'
      vehiclesToDelete?: string[] // Array of vehicle IDs to delete
    }

    // Validate target tier
    if (!targetTier || !['free', 'personal'].includes(targetTier)) {
      return NextResponse.json({
        error: 'Invalid target tier. Must be "free" or "personal".'
      }, { status: 400 })
    }

    // Get user's org membership (respect active org cookie)
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Get current subscription plan from org
    const currentTier = await getOrgSubscriptionPlan(supabase, user.id, activeOrgId)

    // Validate downgrade path
    if (currentTier === 'free') {
      return NextResponse.json({
        error: 'Cannot downgrade from free tier'
      }, { status: 400 })
    }

    if (currentTier === 'personal' && targetTier === 'personal') {
      return NextResponse.json({
        error: 'Already on personal tier'
      }, { status: 400 })
    }

    if (currentTier === targetTier) {
      return NextResponse.json({
        error: `Already on ${targetTier} tier`
      }, { status: 400 })
    }

    // Check vehicle count for org
    const { count: vehicleCount } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', membership.org_id)

    const targetLimit = PLAN_LIMITS[targetTier].maxVehicles
    const currentVehicles = vehicleCount || 0

    // If exceeding limit, ensure vehicles to delete are provided
    if (currentVehicles > targetLimit) {
      const vehiclesNeeded = currentVehicles - targetLimit

      if (!vehiclesToDelete || vehiclesToDelete.length !== vehiclesNeeded) {
        return NextResponse.json({
          error: `You have ${currentVehicles} vehicles but ${targetTier} tier allows ${targetLimit}. You must select ${vehiclesNeeded} vehicle(s) to remove.`,
          requiresVehicleSelection: true,
          currentVehicles,
          targetLimit,
          vehiclesToDelete: vehiclesNeeded
        }, { status: 400 })
      }

      // Validate and delete selected vehicles
      for (const vehicleId of vehiclesToDelete) {
        const validatedVehicleId = validateUUID(vehicleId)
        if (!validatedVehicleId) {
          return NextResponse.json({ error: `Invalid vehicle ID format: ${vehicleId}` }, { status: 400 })
        }
        const { error: deleteError } = await supabase
          .from('cars')
          .delete()
          .eq('id', validatedVehicleId)
          .eq('org_id', membership.org_id)

        if (deleteError) {
          console.error('Error deleting vehicle during downgrade:', deleteError)
          return NextResponse.json({
            error: `Failed to delete vehicle ${vehicleId}`
          }, { status: 500 })
        }
      }
    }

    // Create admin Supabase client for updating user profiles
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!adminUrl || !adminKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    const supabaseAdmin = createClient(
      adminUrl,
      adminKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get org's Stripe customer ID
    const org = await getOrgDetails(supabase, membership.org_id)

    let downgradeEffectiveDate: Date | null = null

    // Handle Stripe subscription cancellation
    // Note: currentTier is never 'free' at this point (early return above)
    if (org?.stripe_customer_id) {
      try {
        // Get active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: org.stripe_customer_id,
          status: 'active',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0]

          // Cancel subscription at period end
          await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
          })

          // Set effective date to end of current period
          const subscriptionItem = subscription.items.data[0] as SubscriptionItemWithPeriod
          downgradeEffectiveDate = new Date(subscriptionItem.current_period_end * 1000)
        }
      } catch (stripeError) {
        console.error('Stripe error during downgrade:', stripeError)
        return NextResponse.json(
          { error: 'Failed to cancel subscription with payment provider. Please try again.' },
          { status: 503 }
        )
      }
    }

    // If no Stripe subscription or it's already cancelled, downgrade immediately
    if (!downgradeEffectiveDate) {
      downgradeEffectiveDate = new Date()
    }

    // Update organization with pending downgrade
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({
        pending_downgrade_tier: targetTier,
        downgrade_effective_date: downgradeEffectiveDate.toISOString(),
        downgrade_requested_at: new Date().toISOString(),
      })
      .eq('id', membership.org_id)

    if (updateError) {
      console.error('Error updating user profile with pending downgrade:', updateError)
      return NextResponse.json({
        error: 'Failed to process downgrade'
      }, { status: 500 })
    }

    // Calculate days until downgrade
    const now = new Date()
    const daysUntilDowngrade = Math.ceil(
      (downgradeEffectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      success: true,
      currentTier,
      targetTier,
      effectiveDate: downgradeEffectiveDate.toISOString(),
      daysUntilDowngrade,
      message: daysUntilDowngrade > 0
        ? `Your subscription will downgrade to ${targetTier} tier in ${daysUntilDowngrade} day(s). You'll keep ${currentTier} tier access until ${downgradeEffectiveDate.toLocaleDateString()}.`
        : `Your subscription has been downgraded to ${targetTier} tier.`,
      vehiclesDeleted: vehiclesToDelete?.length || 0,
      dataRetentionWarning: null
    })
  } catch (error) {
    console.error('Error in downgrade API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
