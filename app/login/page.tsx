'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BackgroundAnimation from '../components/BackgroundAnimation'
import AuthComponent from '../../components/AuthComponent'
import type { User } from '@supabase/supabase-js'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const handleAuthChange = (user: User | null) => {
    if (user) {
      router.push(redirectTo || '/dashboard')
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative">
      <BackgroundAnimation />

      <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-6">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
            FleetReq
            <span className="block text-blue-400 text-4xl lg:text-5xl mt-2">for Small Business</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Professional tracking without enterprise costs. Built for contractors outgrowing spreadsheets.
          </p>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
          {/* Left Side - Key Benefits & Pricing */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Why Choose Our Platform</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">15-minute setup with Excel import</h3>
                    <p className="text-gray-400 text-sm">Import your existing spreadsheets and get running immediately</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Professional reporting & compliance</h3>
                    <p className="text-gray-400 text-sm">Audit trails, analytics, and reports for business requirements</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Team collaboration built-in</h3>
                    <p className="text-gray-400 text-sm">Owner + office staff + drivers - everyone stays in sync</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4">Team-Based Pricing</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white font-medium">Free</span>
                  <span className="text-blue-400">FREE (1 user, 1 vehicle)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white font-medium">Family</span>
                  <span className="text-blue-400">$4/month (3 members, 3 vehicles)</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white font-medium">Business</span>
                  <span className="text-blue-400">$12/vehicle/month (6 users, unlimited vehicles)</span>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-3 text-center">
                vs. per-vehicle competitors at $15-25/vehicle/month
              </p>
              <div className="mt-4 text-center">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  View Full Pricing & Features
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Authentication */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Get Started Today</h2>

                <AuthComponent onAuthChange={handleAuthChange} />

                <div className="mt-6 text-center">
                  <p className="text-gray-300 text-sm">
                    Questions? <a href="mailto:bruce@brucetruong.com" className="text-blue-400 hover:text-blue-300 font-medium underline">Contact us</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-blue-400">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
