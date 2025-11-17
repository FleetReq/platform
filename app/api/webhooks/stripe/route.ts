import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Use service role client to bypass RLS when updating subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

        // Update user's subscription in database
        const { error } = await supabase
          .from('user_profiles')
          .update({
            subscription_plan: tier,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error('Error updating user subscription:', error)
        } else {
          console.log(`[Stripe Webhook] Updated user ${userId} to ${tier} tier`)
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (!profile) {
          console.error('User not found for customer:', subscription.customer)
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

        // Update user profile
        const { error } = await supabase
          .from('user_profiles')
          .update({
            subscription_plan: isActive ? tier : 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (error) {
          console.error('Error updating subscription:', error)
        } else {
          console.log(`[Stripe Webhook] Updated subscription for user ${profile.id}: ${tier} (${subscription.status})`)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (!profile) {
          console.error('User not found for customer:', subscription.customer)
          break
        }

        // Downgrade to free tier
        const { error } = await supabase
          .from('user_profiles')
          .update({
            subscription_plan: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (error) {
          console.error('Error downgrading user:', error)
        } else {
          console.log(`[Stripe Webhook] Downgraded user ${profile.id} to free tier`)
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
