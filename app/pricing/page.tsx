'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserSubscriptionPlan } from '@/lib/supabase-client'

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted?: boolean
  buttonText: string
  buttonStyle: string
  tier: 'free' | 'personal' | 'business'
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "Free",
    period: "",
    description: "Perfect for trying out vehicle tracking",
    features: [
      "1 vehicle",
      "1 user",
      "Basic fuel tracking & MPG analysis",
      "View maintenance status",
      "90-day data history",
      "Web access only"
    ],
    buttonText: "Get Started Free",
    buttonStyle: "bg-gray-600 hover:bg-gray-700 text-white",
    tier: "free"
  },
  {
    name: "Personal",
    price: "$4",
    period: "/month",
    description: "Ideal for families & small vehicle owners",
    features: [
      "Up to 3 vehicles",
      "1 user",
      "Everything in Free",
      "Full maintenance tracking & alerts",
      "Unlimited data history",
      "Mobile app access",
      "Fuel efficiency analytics",
      "Export capabilities"
    ],
    highlighted: true,
    buttonText: "Start Personal Plan",
    buttonStyle: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
    tier: "personal"
  },
  {
    name: "Business",
    price: "$12",
    period: "/vehicle/month",
    description: "For contractors & service businesses (4+ vehicles)",
    features: [
      "Unlimited vehicles",
      "Up to 6 team members",
      "Everything in Personal",
      "Team collaboration",
      "Tax mileage tracking",
      "Professional reporting",
      "Advanced mobile features",
      "Priority support"
    ],
    buttonText: "Subscribe to Business",
    buttonStyle: "bg-gray-600 hover:bg-gray-700 text-white",
    tier: "business"
  }
]

const allFeatures = [
  { name: "Vehicles", free: "1", personal: "3", business: "Unlimited" },
  { name: "Team Members", free: "1", personal: "1", business: "6" },
  { name: "Fuel Tracking", free: true, personal: true, business: true },
  { name: "MPG Analysis", free: true, personal: true, business: true },
  { name: "Basic Analytics", free: true, personal: true, business: true },
  { name: "Data History", free: "90 days", personal: "Unlimited", business: "Unlimited" },
  { name: "Maintenance Tracking", free: false, personal: true, business: true },
  { name: "Maintenance Alerts", free: false, personal: true, business: true },
  { name: "Mobile App Access", free: false, personal: true, business: true },
  { name: "Export Capabilities", free: false, personal: true, business: true },
  { name: "Team Collaboration", free: false, personal: false, business: true },
  { name: "Tax Mileage Tracking", free: false, personal: false, business: true },
  { name: "Professional Reporting", free: false, personal: false, business: true },
  { name: "Advanced Mobile Features", free: false, personal: false, business: true },
  { name: "Support Level", free: "Community", personal: "Email", business: "Priority" }
]

export default function PricingPage() {
  const [showAnnual, setShowAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<'free' | 'personal' | 'business' | null>(null)
  const router = useRouter()

  // Fetch user's current subscription plan
  useEffect(() => {
    async function fetchUserPlan() {
      if (!supabase) return

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const plan = await getUserSubscriptionPlan(session.user.id)
        setCurrentPlan(plan)
      }
    }

    fetchUserPlan()
  }, [])

  // Get button text based on current plan
  const getButtonText = (tier: PricingTier) => {
    if (!currentPlan) return tier.buttonText

    const tierOrder = { free: 0, personal: 1, business: 2 }
    const currentTierLevel = tierOrder[currentPlan]
    const targetTierLevel = tierOrder[tier.tier]

    if (currentTierLevel === targetTierLevel) {
      return 'Current Plan'
    } else if (currentTierLevel > targetTierLevel) {
      // Don't allow downgrades to Free - show "Not Available"
      if (tier.tier === 'free') {
        return 'Downgrades Not Available'
      }
      return `Downgrade to ${tier.name}`
    } else {
      return tier.buttonText
    }
  }

  // Check if button should be disabled
  const isButtonDisabled = (tier: PricingTier) => {
    if (loading === tier.tier) return true
    if (!currentPlan) return false

    const tierOrder = { free: 0, personal: 1, business: 2 }
    const currentTierLevel = tierOrder[currentPlan]
    const targetTierLevel = tierOrder[tier.tier]

    // Disable current plan button
    if (currentTierLevel === targetTierLevel) return true

    // Disable downgrades to Free for paid users (Personal/Business)
    if (tier.tier === 'free' && currentTierLevel > 0) return true

    // Disable other downgrades (lower tier than current)
    if (currentTierLevel > targetTierLevel) return true

    return false
  }

  // Get button style - use muted gray for disabled states
  const getButtonStyle = (tier: PricingTier) => {
    if (!currentPlan) return tier.buttonStyle

    const tierOrder = { free: 0, personal: 1, business: 2 }
    const currentTierLevel = tierOrder[currentPlan]
    const targetTierLevel = tierOrder[tier.tier]

    // Use muted style for current plan or downgrades
    if (currentTierLevel >= targetTierLevel) {
      return 'bg-gray-500 text-gray-300 cursor-not-allowed'
    }

    return tier.buttonStyle
  }

  const handleSubscribe = async (tier: 'free' | 'personal' | 'business') => {
    // Free tier - just go to app
    if (tier === 'free') {
      router.push('/mileage')
      return
    }

    setLoading(tier)

    try {
      // Check if user is logged in
      if (!supabase) {
        console.error('Supabase client not configured')
        alert('Configuration error. Please check environment variables.')
        setLoading(null)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Redirect to login/signup
        router.push('/mileage') // Auth component will handle login
        setLoading(null)
        return
      }

      // Create checkout session
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          vehicleCount: tier === 'business' ? 4 : undefined, // Default to 4 vehicles for business
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Fleet Management Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            From individual vehicle owners to growing fleets, we have the right solution for your needs.
            Start free and upgrade as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${!showAnnual ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setShowAnnual(!showAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showAnnual ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${showAnnual ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
              Annual
              <span className="ml-1 text-sm text-green-600 font-medium">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col ${
                tier.highlighted
                  ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
                  : ''
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {tier.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {tier.price === 'Free' ? tier.price : (
                      showAnnual && tier.price !== 'Free'
                        ? `$${Math.round(parseInt(tier.price.replace('$', '')) * 12 * 0.8)}`
                        : tier.price
                    )}
                  </span>
                  {tier.period && (
                    <span className="text-gray-600 dark:text-gray-300">
                      {showAnnual
                        ? tier.period.includes('/vehicle')
                          ? '/vehicle/year'
                          : '/year'
                        : tier.period
                      }
                    </span>
                  )}
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.tier)}
                  disabled={isButtonDisabled(tier)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${getButtonStyle(tier)}`}
                >
                  {loading === tier.tier ? 'Loading...' : getButtonText(tier)}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Feature Comparison
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Compare features across all plans
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">
                    Features
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 dark:text-white">
                    Free
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-blue-600 dark:text-blue-400">
                    Personal
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 dark:text-white">
                    Business
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {allFeatures.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-4 px-6 text-gray-900 dark:text-white font-medium">
                      {feature.name}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-gray-400">✗</span>
                        )
                      ) : (
                        <span className="text-gray-900 dark:text-white">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.personal === 'boolean' ? (
                        feature.personal ? (
                          <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          {feature.personal}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.business === 'boolean' ? (
                        feature.business ? (
                          <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                          {feature.business}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Can I upgrade or downgrade my plan?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, you can change your plan at any time. Upgrades take effect immediately,
                  and downgrades take effect at the end of your current billing cycle.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  What happens to my data if I downgrade?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your data is never deleted. If you downgrade to Personal, data older than 90 days
                  will be archived but restored if you upgrade again.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Do you offer custom plans?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, for fleets with more than 25 vehicles, we offer custom enterprise plans
                  with additional features and dedicated support.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Is there a free trial for paid plans?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, Business and Fleet plans come with a 14-day free trial.
                  No credit card required to start your trial.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  How does team collaboration work?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Team members can be invited with different permission levels (view-only or editor).
                  All data is shared within the team while maintaining individual user tracking.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We accept all major credit cards, PayPal, and ACH transfers for annual plans.
                  Enterprise customers can pay via invoice.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Fleet Management?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of contractors and businesses who have moved beyond spreadsheets
            to professional fleet management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Start Free Today
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-all">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}