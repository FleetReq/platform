import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, getOrgDetails } from '@/lib/org'
import { sanitizeString } from '@/lib/validation'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { ACCOUNT_DELETION_GRACE_DAYS } from '@/lib/constants'

if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY env var is required')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
})

// As of Stripe API 2025-03-31, period fields moved from subscription to subscription item level
type SubscriptionItemWithPeriod = Stripe.SubscriptionItem & {
  current_period_end: number
}

export const dynamic = 'force-dynamic'

// POST /api/subscription/cancel - Cancel user's subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.EXPENSIVE)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    // Get cancellation reason from request body
    const body = await request.json()
    const reason = sanitizeString(body.reason, { maxLength: 500 })

    // Get user's org and subscription info (respect active org cookie)
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Only the org owner can schedule account deletion
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the organization owner can delete the account' }, { status: 403 })
    }

    const org = await getOrgDetails(supabase, membership.org_id)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Can't cancel free tier
    if (org.subscription_plan === 'free') {
      return NextResponse.json({ error: 'Cannot cancel free tier' }, { status: 400 })
    }

    // Find and cancel Stripe subscription
    let subscriptionEndDate = org.subscription_end_date

    if (org.stripe_customer_id) {
      try {
        // Get active subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: org.stripe_customer_id,
          status: 'active',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0]

          // Cancel subscription at period end (user keeps access until end of billing period)
          await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
          })

          const subscriptionItem = subscription.items.data[0] as SubscriptionItemWithPeriod
          const periodEnd = subscriptionItem.current_period_end ?? (subscription as unknown as { current_period_end?: number }).current_period_end
          if (!periodEnd) {
            console.error('[cancel] No current_period_end on subscription item or subscription')
          } else {
            subscriptionEndDate = new Date(periodEnd * 1000).toISOString()
          }
        }
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError)
        return NextResponse.json(
          { error: 'Failed to cancel subscription with payment provider. Please try again.' },
          { status: 503 }
        )
      }
    }

    // If no subscription end date, fall back to ACCOUNT_DELETION_GRACE_DAYS from now.
    // This can happen if the user has no active Stripe subscription (e.g. grandfathered accounts).
    if (!subscriptionEndDate) {
      console.warn('[cancel] No active Stripe subscription found — using grace period fallback for subscription end date')
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + ACCOUNT_DELETION_GRACE_DAYS)
      subscriptionEndDate = endDate.toISOString()
    }

    // Calculate scheduled deletion date (subscription_end + grace period)
    const scheduledDeletionDate = new Date(subscriptionEndDate)
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + ACCOUNT_DELETION_GRACE_DAYS)

    // Update organization with cancellation info
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        cancellation_requested_at: new Date().toISOString(),
        cancellation_reason: reason || null,
        subscription_end_date: subscriptionEndDate,
        scheduled_deletion_date: scheduledDeletionDate.toISOString(),
      })
      .eq('id', membership.org_id)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription_end_date: subscriptionEndDate,
      scheduled_deletion_date: scheduledDeletionDate.toISOString(),
    })
  } catch (error) {
    console.error('Cancellation error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
