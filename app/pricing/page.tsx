'use client'

import { useState } from 'react'

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted?: boolean
  buttonText: string
  buttonStyle: string
}

const pricingTiers: PricingTier[] = [
  {
    name: "Personal",
    price: "Free",
    period: "",
    description: "Perfect for individual vehicle owners",
    features: [
      "1 vehicle",
      "1 user",
      "Fuel tracking & MPG analysis",
      "Basic analytics",
      "90-day data history",
      "Mobile responsive"
    ],
    buttonText: "Get Started Free",
    buttonStyle: "bg-gray-600 hover:bg-gray-700 text-white"
  },
  {
    name: "Business",
    price: "$29",
    period: "/month",
    description: "Ideal for small contractors & service businesses",
    features: [
      "Up to 10 vehicles",
      "Up to 6 team members",
      "Everything in Personal",
      "Maintenance tracking & alerts",
      "Team collaboration",
      "Professional reporting",
      "Unlimited data history",
      "Export capabilities",
      "Priority support"
    ],
    highlighted: true,
    buttonText: "Start Business Trial",
    buttonStyle: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
  },
  {
    name: "Fleet",
    price: "$59",
    period: "/month",
    description: "For growing fleets & enterprise needs",
    features: [
      "Up to 25 vehicles",
      "Up to 12 team members",
      "Everything in Business",
      "Advanced analytics",
      "API access",
      "Custom maintenance intervals",
      "Compliance reporting",
      "White-label options",
      "Dedicated support"
    ],
    buttonText: "Contact Sales",
    buttonStyle: "bg-gray-800 hover:bg-gray-900 text-white"
  }
]

const allFeatures = [
  { name: "Vehicles", personal: "1", business: "10", fleet: "25" },
  { name: "Team Members", personal: "1", business: "6", fleet: "12" },
  { name: "Fuel Tracking", personal: true, business: true, fleet: true },
  { name: "MPG Analysis", personal: true, business: true, fleet: true },
  { name: "Basic Analytics", personal: true, business: true, fleet: true },
  { name: "Mobile Responsive", personal: true, business: true, fleet: true },
  { name: "Data History", personal: "90 days", business: "Unlimited", fleet: "Unlimited" },
  { name: "Maintenance Tracking", personal: false, business: true, fleet: true },
  { name: "Maintenance Alerts", personal: false, business: true, fleet: true },
  { name: "Team Collaboration", personal: false, business: true, fleet: true },
  { name: "Professional Reporting", personal: false, business: true, fleet: true },
  { name: "Export Capabilities", personal: false, business: true, fleet: true },
  { name: "Advanced Analytics", personal: false, business: false, fleet: true },
  { name: "API Access", personal: false, business: false, fleet: true },
  { name: "Custom Intervals", personal: false, business: false, fleet: true },
  { name: "Compliance Reporting", personal: false, business: false, fleet: true },
  { name: "White-label Options", personal: false, business: false, fleet: true },
  { name: "Support Level", personal: "Community", business: "Priority", fleet: "Dedicated" }
]

export default function PricingPage() {
  const [showAnnual, setShowAnnual] = useState(false)

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
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${
                tier.highlighted
                  ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
                  : ''
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
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
                      {showAnnual ? '/year' : tier.period}
                    </span>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
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

                <button className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${tier.buttonStyle}`}>
                  {tier.buttonText}
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
                    Personal
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-blue-600 dark:text-blue-400">
                    Business
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 dark:text-white">
                    Fleet
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
                    <td className="py-4 px-6 text-center">
                      {typeof feature.fleet === 'boolean' ? (
                        feature.fleet ? (
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
                          {feature.fleet}
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