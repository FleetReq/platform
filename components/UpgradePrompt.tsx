'use client'

import Link from 'next/link'

interface UpgradePromptProps {
  message: string
  className?: string
}

export default function UpgradePrompt({ message, className = '' }: UpgradePromptProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Overlay that blocks interaction */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md mx-auto text-center border">
          {/* Premium badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            Premium Feature
          </div>

          {/* Message */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upgrade Your Plan
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            {message}
          </p>

          {/* Upgrade button */}
          <Link
            href="/pricing"
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-center"
          >
            View Plans
          </Link>

          {/* Small print */}
          <p className="text-gray-500 text-xs mt-3">
            Family $4/mo • Business $12/vehicle/mo
          </p>
        </div>
      </div>
    </div>
  )
}
