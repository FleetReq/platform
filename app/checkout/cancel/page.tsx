'use client'

import Link from 'next/link'

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        {/* Cancel Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Cancelled
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your subscription was not activated. No charges were made to your account.
        </p>

        {/* Help Text */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            If you encountered an issue, please try again or contact support.
          </p>
        </div>

        {/* Navigation Options */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Pricing
          </Link>

          <Link
            href="/mileage"
            className="block w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Continue with Free Tier
          </Link>

          <Link
            href="/"
            className="block w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium py-2 transition-colors"
          >
            Return Home
          </Link>
        </div>

        {/* Why Upgrade */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Why Upgrade?
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 text-left">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">→</span>
              <span>Track multiple vehicles (3+ for Personal, unlimited for Business)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">→</span>
              <span>Full maintenance tracking with alerts</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">→</span>
              <span>Business trip tracking for tax deductions</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">→</span>
              <span>Professional reports and unlimited history</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
