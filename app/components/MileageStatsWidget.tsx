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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🚗 Mileage Tracker Project
        </h3>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🚗 Mileage Tracker
        </h3>
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
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Full-stack SRE portfolio project • Next.js + Supabase
        </p>
      </div>
    </div>
  )
}