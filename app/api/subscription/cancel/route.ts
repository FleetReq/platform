import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, getOrgDetails } from '@/lib/org'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

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

    // Get cancellation reason from request body
    const body = await request.json()
    const { reason } = body

    // Get user's org and subscription info (respect active org cookie)
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
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
          customer: org.stripe_customer_id!,
          status: 'active',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0]

          // Cancel subscription at period end (user keeps access until end of billing period)
          await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
          })

          // Set subscription end date to the current period end
          // @ts-expect-error - Stripe types might not match runtime
          const periodEnd = subscription.current_period_end as number
          subscriptionEndDate = new Date(periodEnd * 1000).toISOString()
        }
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError)
        // Continue even if Stripe fails - we'll update our database
      }
    }

    // If no subscription end date, set it to 30 days from now (fallback)
    if (!subscriptionEndDate) {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)
      subscriptionEndDate = endDate.toISOString()
    }

    // Calculate scheduled deletion date (subscription_end + 30 days)
    const scheduledDeletionDate = new Date(subscriptionEndDate)
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30)

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
    return NextResponse.json(
      {
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
