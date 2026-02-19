import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { PLAN_LIMITS, type SubscriptionPlan } from '@/lib/constants'

if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY env var is required')
if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET env var is required')
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL env var is required')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is required')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Use service role client to bypass RLS when updating subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get user ID from session metadata
        const userId = session.metadata?.user_id
        const tier = session.metadata?.tier as 'personal' | 'business'

        if (!userId || !tier) {
          console.error('Missing user_id or tier in session metadata')
          break
        }

        // Find user's org
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', userId)
          .eq('role', 'owner')
          .single()

        if (!membership) {
          console.error('No org membership found for user:', userId)
          break
        }

        // Determine max vehicles and members based on tier
        const { maxVehicles, maxMembers } = PLAN_LIMITS[tier as SubscriptionPlan] ?? PLAN_LIMITS.free

        // Update organization's subscription
        const { error } = await supabase
          .from('organizations')
          .update({
            subscription_plan: tier,
            stripe_customer_id: session.customer as string,
            max_vehicles: maxVehicles,
            max_members: maxMembers,
          })
          .eq('id', membership.org_id)

        if (error) {
          console.error('Error updating org subscription:', error)
        } else {
          console.log(`[Stripe Webhook] Updated org ${membership.org_id} to ${tier} tier`)
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find org by Stripe customer ID
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (!org) {
          console.error('Organization not found for customer:', subscription.customer)
          break
        }

        // Determine tier from subscription metadata or price
        let tier: 'free' | 'personal' | 'business' = 'free'

        if (subscription.metadata?.tier) {
          tier = subscription.metadata.tier as 'personal' | 'business'
        } else {
          // Fallback: Infer from price amount
          const price = subscription.items.data[0]?.price
          if (price) {
            const amount = price.unit_amount || 0
            if (amount === 400) tier = 'personal' // $4.00
            else if (amount === 1200) tier = 'business' // $12.00
          }
        }

        // Check subscription status
        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        const activeTier: SubscriptionPlan = isActive ? tier : 'free'
        const { maxVehicles, maxMembers } = PLAN_LIMITS[activeTier]

        // Update organization
        const { error } = await supabase
          .from('organizations')
          .update({
            subscription_plan: activeTier,
            max_vehicles: maxVehicles,
            max_members: maxMembers,
          })
          .eq('id', org.id)

        if (error) {
          console.error('Error updating subscription:', error)
        } else {
          console.log(`[Stripe Webhook] Updated subscription for org ${org.id}: ${tier} (${subscription.status})`)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Find org by Stripe customer ID
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (!org) {
          console.error('Organization not found for customer:', subscription.customer)
          break
        }

        // Downgrade to free tier
        const { error } = await supabase
          .from('organizations')
          .update({
            subscription_plan: 'free',
            max_vehicles: 1,
            max_members: 1,
          })
          .eq('id', org.id)

        if (error) {
          console.error('Error downgrading org:', error)
        } else {
          console.log(`[Stripe Webhook] Downgraded org ${org.id} to free tier`)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[Stripe Webhook] Payment succeeded for invoice ${invoice.id}`)
        // Subscription will be updated by subscription.updated event
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[Stripe Webhook] Payment failed for invoice ${invoice.id}`)
        // Stripe will retry payment automatically
        // Could send email notification here
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
