import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserOrg, getOrgDetails } from '@/lib/org'

if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY env var is required')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
})

export const dynamic = 'force-dynamic'

// POST /api/checkout/session - Create a Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tier, vehicleCount } = body

    // Validate tier
    if (tier !== 'personal' && tier !== 'business') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Get user's org
    const membership = await getUserOrg(supabase, user.id)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const org = await getOrgDetails(supabase, membership.org_id)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get or create Stripe customer on the org
    let customerId: string

    if (org.stripe_customer_id) {
      customerId = org.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          org_id: membership.org_id,
        },
      })
      customerId = customer.id

      // Save customer ID to organization
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', membership.org_id)
    }

    // Create line items based on tier.
    // Use pre-created Stripe Price IDs (set env vars STRIPE_PERSONAL_PRICE_ID / STRIPE_BUSINESS_PRICE_ID
    // after creating products in the Stripe dashboard). Falls back to inline price_data for local dev.
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    if (tier === 'personal') {
      const priceId = process.env.STRIPE_PERSONAL_PRICE_ID
      lineItems.push(
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'FleetReq Personal',
                  description: 'Up to 3 vehicles, full maintenance tracking, unlimited history',
                },
                recurring: { interval: 'month' },
                unit_amount: 400, // $4.00 in cents
              },
              quantity: 1,
            }
      )
    } else if (tier === 'business') {
      const quantity = vehicleCount || 4 // Default to 4 vehicles if not specified
      const priceId = process.env.STRIPE_BUSINESS_PRICE_ID
      lineItems.push(
        priceId
          ? { price: priceId, quantity }
          : {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'FleetReq Business',
                  description: 'Per vehicle pricing, unlimited vehicles, team collaboration, tax reports',
                },
                recurring: { interval: 'month' },
                unit_amount: 1200, // $12.00 in cents
              },
              quantity,
            }
      )
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        tier,
        vehicle_count: tier === 'business' ? (vehicleCount || 4).toString() : '3',
      },
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'required',
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
