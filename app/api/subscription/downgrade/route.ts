import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserSubscriptionPlan } from '@/lib/supabase-client'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const TIER_LIMITS = {
  free: 1,
  personal: 3,
  business: 999
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

    // Get current subscription plan
    const currentTier = await getUserSubscriptionPlan(user.id)

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

    // Check vehicle count
    const { count: vehicleCount } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const targetLimit = TIER_LIMITS[targetTier]
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
        const { error: deleteError } = await supabase
          .from('cars')
          .delete()
          .eq('id', vehicleId)
          .eq('user_id', user.id)

        if (deleteError) {
          console.error('Error deleting vehicle during downgrade:', deleteError)
          return NextResponse.json({
            error: `Failed to delete vehicle ${vehicleId}`
          }, { status: 500 })
        }
      }
    }

    // Create admin Supabase client for updating user profiles
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

    // Get user's profile and Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let downgradeEffectiveDate: Date | null = null

    // Handle Stripe subscription cancellation
    // Note: currentTier is never 'free' at this point (early return on line 49)
    if (profile?.stripe_customer_id) {
      try {
        // Get active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
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
          const subscriptionItem = subscription.items.data[0]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const periodEnd = (subscriptionItem as any).current_period_end as number
          downgradeEffectiveDate = new Date(periodEnd * 1000)
        }
      } catch (stripeError) {
        console.error('Stripe error during downgrade:', stripeError)
        // Continue with downgrade even if Stripe fails
      }
    }

    // If no Stripe subscription or it's already cancelled, downgrade immediately
    if (!downgradeEffectiveDate) {
      downgradeEffectiveDate = new Date()
    }

    // Update user_profiles with pending downgrade
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        pending_downgrade_tier: targetTier,
        downgrade_effective_date: downgradeEffectiveDate.toISOString(),
        downgrade_requested_at: new Date().toISOString(),
      })
      .eq('id', user.id)

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
      dataRetentionWarning: targetTier === 'free'
        ? 'Data older than 90 days will be automatically deleted on the free tier.'
        : null
    })
  } catch (error) {
    console.error('Error in downgrade API:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
