import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

/**
 * Update Stripe subscription quantity for Business tier users
 * Handles automatic proration for vehicle additions/removals
 *
 * @param userId - Supabase user ID
 * @param newVehicleCount - New total vehicle count
 * @returns Proration details and updated subscription
 */
export async function updateStripeSubscriptionQuantity(
  userId: string,
  newVehicleCount: number
): Promise<{
  success: boolean
  prorationAmount?: number
  isCredit?: boolean
  message?: string
  error?: string
}> {
  try {
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, subscription_plan')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' }
    }

    // Only update for Business tier
    if (profile.subscription_plan !== 'business') {
      return { success: false, error: 'Not on Business tier' }
    }

    if (!profile.stripe_customer_id) {
      return { success: false, error: 'No Stripe customer found' }
    }

    // Get active subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return { success: false, error: 'No active subscription found' }
    }

    const subscription = subscriptions.data[0]
    const subscriptionItem = subscription.items.data[0]
    const currentQuantity = subscriptionItem.quantity || 1

    // Calculate proration amount
    const quantityDifference = newVehicleCount - currentQuantity
    const isAddition = quantityDifference > 0
    const pricePerVehicle = 12 // $12/vehicle/month

    // Calculate days remaining in current period
    // Note: As of Stripe API 2025-03-31, period fields moved from subscription to subscription item level
    const now = Math.floor(Date.now() / 1000) // Current timestamp in seconds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodEnd = (subscriptionItem as any).current_period_end as number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodStart = (subscriptionItem as any).current_period_start as number
    const totalDays = (periodEnd - periodStart) / 86400 // Convert seconds to days
    const daysRemaining = (periodEnd - now) / 86400

    // Calculate proration amount
    const prorationAmount = Math.abs(
      Math.round((pricePerVehicle * Math.abs(quantityDifference) * daysRemaining / totalDays) * 100) / 100
    )

    // Update subscription quantity
    await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscriptionItem.id,
        quantity: newVehicleCount,
      }],
      proration_behavior: 'create_prorations', // Automatic proration
    })

    return {
      success: true,
      prorationAmount,
      isCredit: !isAddition,
      message: isAddition
        ? `Prorated charge of $${prorationAmount.toFixed(2)} will appear on your card today.`
        : `A credit of $${prorationAmount.toFixed(2)} will be applied to your next bill.`
    }
  } catch (error) {
    console.error('Error updating Stripe subscription:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription'
    }
  }
}

/**
 * Get current vehicle count from Stripe subscription
 *
 * @param userId - Supabase user ID
 * @returns Current vehicle count from Stripe
 */
export async function getStripeVehicleCount(userId: string): Promise<number> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return 0
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return 0
    }

    const subscription = subscriptions.data[0]
    const subscriptionItem = subscription.items.data[0]
    return subscriptionItem.quantity || 1
  } catch (error) {
    console.error('Error getting Stripe vehicle count:', error)
    return 0
  }
}
