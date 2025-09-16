'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PublicStats {
  total_cars: number
  total_fill_ups: number
  average_mpg: number
  total_gallons: number
  total_spent: number
  total_maintenance_records: number
  total_maintenance_cost: number
}

export default function MileageStatsWidget() {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats?public=true')
      if (response.ok) {
        const { stats } = await response.json()
        setStats(stats)
      } else {
        setError(true)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elegant p-6 border border-gray-200/60 dark:border-gray-700/40">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elegant p-6 border border-gray-200/60 dark:border-gray-700/40">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vehicle Analytics Platform
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          A full-stack application for tracking vehicle fuel efficiency and maintenance records.
        </p>
        <Link
          href="/mileage"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
        >
          View Project
          <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elegant p-6 border border-gray-200/60 dark:border-gray-700/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vehicle Analytics
          </h3>
        </div>
        <Link
          href="/mileage"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
        >
          View Details →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.total_cars}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {stats.total_cars === 1 ? 'Vehicle' : 'Vehicles'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.average_mpg > 0 ? stats.average_mpg.toFixed(1) : '0'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Avg MPG</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.total_fill_ups}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Fill-ups</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.total_maintenance_records}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Maintenance</div>
        </div>
      </div>

      {(stats.total_gallons > 0 || stats.total_spent > 0) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            {stats.total_gallons > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.total_gallons.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Gallons</div>
              </div>
            )}
            {stats.total_spent > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${stats.total_spent.toFixed(0)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Fuel Cost</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Full-stack SRE Portfolio • Next.js + Supabase
        </div>
      </div>
    </div>
  )
}