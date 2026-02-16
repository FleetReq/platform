import Link from "next/link";
import OAuthRedirectHandler from './components/OAuthRedirectHandler';

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "FleetReq",
  "applicationCategory": "BusinessApplication",
  "description": "Professional vehicle fleet management and maintenance tracking for small businesses and contractors. Stop using spreadsheets - get 15-minute setup with maintenance alerts, tax compliance, and team collaboration.",
  "url": "https://fleetreq.vercel.app",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free plan with 1 vehicle tracking"
  },
  "featureList": [
    "Vehicle Fleet Management",
    "Maintenance Tracking & Alerts",
    "Fuel Efficiency Analytics",
    "Team Collaboration",
    "Tax Compliance Reporting",
    "Mobile Access"
  ],
  "targetAudience": {
    "@type": "Audience",
    "audienceType": "Small Business Contractors"
  }
};

export default function Home() {
  return (
    <>
      {/* OAuth Redirect Handler */}
      <OAuthRedirectHandler />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="relative overflow-hidden min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 dark:text-white mb-6">
                Fleet<span className="text-blue-600 dark:text-blue-400">Req</span>
              </h1>
              <p className="text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-4xl mx-auto">
                Stop Using Spreadsheets for Fleet Management
              </p>
              <p className="text-xl text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
                Professional vehicle tracking with maintenance alerts, tax compliance, and team collaboration. Setup in 15 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/pricing"
                  className="border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900 px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                >
                  View Pricing
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>15-minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Tired of Excel Chaos?
                </h2>
                <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
                  <p>✗ Spreadsheets break when multiple people edit them</p>
                  <p>✗ No maintenance alerts = expensive repairs</p>
                  <p>✗ Tax season becomes a nightmare</p>
                  <p>✗ Can&apos;t access data from the field</p>
                  <p>✗ No backup when computer crashes</p>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">
                  FleetReq Solution
                </h3>
                <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
                  <p>✓ Real-time team collaboration</p>
                  <p>✓ Automatic maintenance alerts</p>
                  <p>✓ Tax-ready reports in seconds</p>
                  <p>✓ Mobile access anywhere</p>
                  <p>✓ Cloud backup & security</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Everything You Need to Manage Your Fleet
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Professional tools designed for small business contractors
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Fuel Tracking & Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Track MPG, costs, and efficiency trends. Visual charts show which vehicles are costing you money.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 14.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Maintenance Alerts
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Never miss oil changes or inspections. Color-coded alerts prevent expensive breakdowns.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Tax Compliance
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  IRS-ready mileage reports for business deductions. Export everything your accountant needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Simple, Honest Pricing
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-4">$0</p>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for trying it out</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>✓ 1 vehicle</li>
                  <li>✓ Basic fuel tracking</li>
                  <li>✓ Unlimited history</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 p-8 rounded-2xl shadow-xl border-2 border-blue-200 dark:border-blue-600 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personal</h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-4">$4<span className="text-lg">/month</span></p>
                <p className="text-gray-600 dark:text-gray-300 mb-6">For families & small contractors</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>✓ Up to 3 vehicles</li>
                  <li>✓ Full maintenance tracking</li>
                  <li>✓ Unlimited history</li>
                  <li>✓ Mobile app access</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business</h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-4">$12<span className="text-lg">/vehicle</span></p>
                <p className="text-gray-600 dark:text-gray-300 mb-6">For growing fleets</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>✓ Unlimited vehicles</li>
                  <li>✓ Team collaboration</li>
                  <li>✓ Tax compliance reports</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
            </div>

            <div className="mt-12">
              <Link
                href="/pricing"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                View detailed pricing comparison →
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Ditch the Spreadsheets?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
              Join contractors who&apos;ve saved thousands with better fleet management
            </p>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-12 py-4 rounded-lg font-semibold text-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block"
            >
              Start Your Free Trial
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Setup takes 15 minutes • No credit card required • Cancel anytime
            </p>
          </div>
        </section>
      </div>
    </>
  );
}