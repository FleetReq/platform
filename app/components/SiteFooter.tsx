'use client'

import { usePathname } from 'next/navigation'
import { CHROMELESS_ROUTES } from '@/lib/constants'

export function SiteFooter() {
  const pathname = usePathname()
  if ((CHROMELESS_ROUTES as readonly string[]).includes(pathname)) return null

  return (
    <footer className="border-t border-gray-200/60 dark:border-gray-700/40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-elegant">
              <span className="text-sm font-bold text-white">FR</span>
            </div>
            <span className="text-lg font-bold text-gradient-primary">FleetReq</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Fleet Management &amp; Mileage Tracking for Contractors
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} FleetReq. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
