'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, type Car, type FillUp, type MaintenanceRecord, isOwner } from '@/lib/supabase-client'
import BackgroundAnimation from '../components/BackgroundAnimation'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface UserStats {
  total_cars: number
  total_fill_ups: number
  average_mpg: number
  total_gallons: number
  total_spent: number
  total_maintenance_records: number
  total_maintenance_cost: number
  recent_mpg: number
  best_mpg: number
  worst_mpg: number
}

export default function MileageTracker() {
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [fillUps, setFillUps] = useState<FillUp[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [userIsOwner, setUserIsOwner] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance'>('dashboard')
  const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')

  const checkUser = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error('Database not configured')
      }

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // If user is authenticated, sync session with server
      if (user && session) {
        try {
          await fetch('/api/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session }),
            credentials: 'include'
          })
        } catch (error) {
          console.error('Failed to sync session with server:', error)
        }
      }

      if (user) {
        setUserIsOwner(isOwner(user.id))
      }

      // Always load data (for both authenticated and anonymous users)
      await loadData()
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkUser()

    // Check for OAuth callback completion (access_token in URL)
    const urlParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = urlParams.get('access_token')
    if (accessToken) {
      // OAuth callback completed, force auth state refresh
      setTimeout(() => {
        checkUser()
      }, 1000) // Give time for Supabase to process the session
    }

    // Listen for auth state changes (e.g., after OAuth callback)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User just signed in, sync session and reload data
          try {
            await fetch('/api/sync-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session }),
              credentials: 'include'
            })
            // Reload user state and data
            await checkUser()
          } catch (error) {
            console.error('Failed to sync session after sign in:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear state
          setUser(null)
          setUserIsOwner(false)
          // Still show data for anonymous users
          await loadData()
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [checkUser])

  const loadData = async () => {
    try {
      if (!supabase) return

      // Load cars
      const carsResponse = await fetch('/api/cars')
      if (carsResponse.ok) {
        const { cars } = await carsResponse.json()
        setCars(cars || [])
      }

      // Load stats
      const statsResponse = await fetch('/api/stats')
      if (statsResponse.ok) {
        const { stats } = await statsResponse.json()
        setStats(stats)
      }

      // Load fill-ups for chart (last 50 records)
      const fillUpsResponse = await fetch('/api/fill-ups?limit=50')
      if (fillUpsResponse.ok) {
        const { fillUps } = await fillUpsResponse.json()
        setFillUps(fillUps || [])
      }

      // Load maintenance records for alerts
      const maintenanceResponse = await fetch('/api/maintenance?limit=50')
      if (maintenanceResponse.ok) {
        const { maintenanceRecords } = await maintenanceResponse.json()
        setMaintenanceRecords(maintenanceRecords || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const signIn = async () => {
    try {
      if (!supabase) {
        throw new Error('Database not configured')
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/mileage`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const signOut = async () => {
    try {
      if (!supabase) {
        throw new Error('Database not configured')
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setUserIsOwner(false)
      // Don't clear cars/stats - reload data to show anonymous view
      await loadData()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Prepare chart data based on selected view
  const prepareChartData = () => {
    if (!fillUps.length) return null

    // Sort fill-ups by date (oldest first for chart)
    const sortedFillUps = [...fillUps]
      .filter(f => f.mpg && f.mpg > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const now = new Date()
    let filteredFillUps: typeof sortedFillUps = []
    let labels: string[] = []
    let data: number[] = []

    if (chartView === 'weekly') {
      // Last 4 weeks
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
      filteredFillUps = sortedFillUps.filter(f => new Date(f.date) >= fourWeeksAgo)

      labels = filteredFillUps.map(f => {
        const date = new Date(f.date)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
      data = filteredFillUps.map(f => f.mpg || 0)
    } else if (chartView === 'monthly') {
      // Group by month for last 12 months
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      filteredFillUps = sortedFillUps.filter(f => new Date(f.date) >= twelveMonthsAgo)

      // Group fill-ups by month and calculate average MPG
      const monthlyData: Record<string, { mpgs: number[], monthYear: string }> = {}

      filteredFillUps.forEach(f => {
        const date = new Date(f.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { mpgs: [], monthYear }
        }
        monthlyData[monthKey].mpgs.push(f.mpg!)
      })

      // Sort months and calculate averages
      const sortedMonths = Object.keys(monthlyData).sort()
      labels = sortedMonths.map(key => monthlyData[key].monthYear)
      data = sortedMonths.map(key => {
        const mpgs = monthlyData[key].mpgs
        return Math.round((mpgs.reduce((sum, mpg) => sum + mpg, 0) / mpgs.length) * 100) / 100
      })
    } else if (chartView === 'yearly') {
      // Group by year for last 5 years
      const fiveYearsAgo = new Date(now.getFullYear() - 4, 0, 1)
      filteredFillUps = sortedFillUps.filter(f => new Date(f.date) >= fiveYearsAgo)

      // Group fill-ups by year and calculate average MPG
      const yearlyData: Record<string, number[]> = {}

      filteredFillUps.forEach(f => {
        const year = new Date(f.date).getFullYear().toString()
        if (!yearlyData[year]) {
          yearlyData[year] = []
        }
        yearlyData[year].push(f.mpg!)
      })

      // Sort years and calculate averages
      const sortedYears = Object.keys(yearlyData).sort()
      labels = sortedYears
      data = sortedYears.map(year => {
        const mpgs = yearlyData[year]
        return Math.round((mpgs.reduce((sum, mpg) => sum + mpg, 0) / mpgs.length) * 100) / 100
      })
    }

    // Fallback to recent fill-ups if no data in selected timeframe
    if (data.length === 0) {
      const recentFillUps = sortedFillUps.slice(-10)
      labels = recentFillUps.map(f => {
        const date = new Date(f.date)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
      data = recentFillUps.map(f => f.mpg!)
    }

    return {
      labels,
      datasets: [
        {
          label: chartView === 'weekly' ? 'MPG' : 'Average MPG',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          fill: true
        }
      ]
    }
  }

  // Get maintenance status for all types
  const getMaintenanceStatus = () => {
    const alerts: Array<{
      type: string
      typeKey: string
      status: 'overdue' | 'due_soon' | 'good' | 'no_record'
      message: string
      lastDate?: string
      daysUntilDue?: number
    }> = []

    // Define maintenance intervals (in days) and labels
    const maintenanceTypes = {
      'oil_change': { label: 'Oil Change', interval: 90 }, // 3 months
      'tire_rotation': { label: 'Tire Rotation', interval: 180 }, // 6 months
      'brake_service': { label: 'Brake Service', interval: 365 }, // 1 year
      'tune_up': { label: 'Tune-up', interval: 365 }, // 1 year
    }

    // Group maintenance by type, get most recent for each
    const maintenanceByType = maintenanceRecords.reduce((acc, record) => {
      if (!acc[record.type] || new Date(record.date) > new Date(acc[record.type].date)) {
        acc[record.type] = record
      }
      return acc
    }, {} as Record<string, MaintenanceRecord>)

    // Process each maintenance type
    Object.entries(maintenanceTypes).forEach(([typeKey, config]) => {
      const record = maintenanceByType[typeKey]

      if (!record) {
        // No record exists for this maintenance type
        alerts.push({
          type: config.label,
          typeKey,
          status: 'no_record',
          message: `No ${config.label.toLowerCase()} records found. Add your first record to start tracking.`
        })
        return
      }

      const lastDate = new Date(record.date)
      const nextDueDate = new Date(lastDate.getTime() + config.interval * 24 * 60 * 60 * 1000)
      const today = new Date()
      const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

      let status: 'overdue' | 'due_soon' | 'good'
      let message: string

      if (daysUntilDue < 0) {
        status = 'overdue'
        const overdueDays = Math.abs(daysUntilDue)
        message = `Last ${config.label.toLowerCase()} was ${lastDate.toLocaleDateString()}. Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}!`
      } else if (daysUntilDue <= 30) {
        status = 'due_soon'
        const daysText = daysUntilDue === 1 ? '1 day' : `${daysUntilDue} days`
        message = `Last ${config.label.toLowerCase()} was ${lastDate.toLocaleDateString()}. Due in ${daysText}.`
      } else {
        status = 'good'
        const daysText = daysUntilDue === 1 ? '1 day' : `${daysUntilDue} days`
        message = `Last ${config.label.toLowerCase()} was ${lastDate.toLocaleDateString()}. Next due in ${daysText}.`
      }

      alerts.push({
        type: config.label,
        typeKey,
        status,
        message,
        lastDate: lastDate.toLocaleDateString(),
        daysUntilDue: daysUntilDue > 0 ? daysUntilDue : undefined
      })
    })

    // Sort by status priority: overdue, due_soon, no_record, good
    return alerts.sort((a, b) => {
      const priorityOrder = { 'overdue': 0, 'due_soon': 1, 'no_record': 2, 'good': 3 }
      return priorityOrder[a.status] - priorityOrder[b.status]
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show landing page only if no data is available (not just no user)
  if (!user && (!cars || cars.length === 0)) {
    return (
      <div className="relative overflow-hidden min-h-screen">
        <BackgroundAnimation />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Vehicle Analytics
            </h1>
            <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Professional-grade vehicle tracking with comprehensive analytics and maintenance scheduling
            </p>
          </div>

          {/* Features Section */}
          <section className="mb-16 py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="px-8">
              <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Platform Features</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="group text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Advanced Analytics
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Monitor fuel efficiency with automatic MPG calculations, trend analysis, and performance insights
                  </p>
                </div>

                <div className="group text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Smart Maintenance
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Automated scheduling, service reminders, and comprehensive maintenance history tracking
                  </p>
                </div>

                <div className="group text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Data Visualization
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Interactive charts, trend analysis, and detailed performance reports across multiple time frames
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-12 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-3xl mx-auto text-center px-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to Optimize Your Vehicle Management?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Join the platform that brings professional-grade analytics to personal vehicle tracking
              </p>
              <button
                onClick={signIn}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                Sign In with GitHub to Get Started
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />

      {/* Admin Sign-In Corner */}
      <div className="fixed bottom-6 right-6 z-50">
        {user ? (
          <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Admin</span>
            </div>
            <button
              onClick={signOut}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="text-xs bg-gray-700/90 hover:bg-gray-800/90 text-gray-300 hover:text-white px-3 py-2 rounded-lg font-medium transition-all backdrop-blur-sm border border-gray-600/50 hover:border-gray-500/50"
            title="Enable Admin Access"
          >
            Enable Admin
          </button>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-gradient-primary">
            Vehicle Analytics
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Professional Vehicle Fleet Management & Analytics Dashboard
          </p>
        </div>

        {/* Access Status - Subtle Professional Indicator */}
        {!userIsOwner ? (
          <div className="mb-8 flex justify-end">
            <div className="inline-flex items-center px-4 py-2 glass-morphism rounded-full shadow-elegant">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Demo Mode</span>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex justify-end">
            <div className="inline-flex items-center px-4 py-2 glass-morphism rounded-full shadow-elegant">
              <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Access</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-12 glass-morphism rounded-xl p-1 shadow-elegant">
          {[
            { id: 'dashboard', label: 'Dashboard', adminOnly: false },
            { id: 'add-car', label: 'Add Car', adminOnly: true },
            { id: 'add-fillup', label: 'Add Fill-up', adminOnly: true },
            { id: 'add-maintenance', label: 'Add Maintenance', adminOnly: true }
          ].map((tab) => {
            const isDisabled = tab.adminOnly && !userIsOwner
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id as 'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance')}
                disabled={isDisabled}
                title={isDisabled ? 'Admin access required - Enable Admin to access this feature' : ''}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-elegant-lg'
                    : isDisabled
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                {tab.label}
                {isDisabled && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Admin access required
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Stats Overview */}
        {stats && (
          <section className="relative py-24 px-4 sm:px-6 lg:px-8 mb-16">
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border-y border-gray-200/30 dark:border-gray-700/30 rounded-2xl"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold mb-12 text-center text-gradient-primary">Performance Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="card-professional p-8 text-center animate-fade-in-up">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-elegant-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-3">{stats.total_cars}</div>
                  <div className="text-gray-600 dark:text-gray-300 font-semibold text-lg">Vehicles</div>
                </div>
                <div className="card-professional p-8 text-center animate-fade-in-up">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{stats.average_mpg}</div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">Avg MPG</div>
                </div>
                <div className="card-professional p-8 text-center animate-fade-in-up">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{stats.total_fill_ups}</div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">Fill-ups</div>
                </div>
                <div className="card-professional p-8 text-center animate-fade-in-up">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">${stats.total_spent}</div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">Total Spent</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-16">
            {/* MPG Timeline Chart */}
            {prepareChartData() && (
              <section className="py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="px-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Fuel Efficiency Analytics</h2>
                    <div className="flex bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg p-1 border border-gray-300/50 dark:border-gray-600/50">
                      {[
                        { id: 'weekly', label: 'Weekly' },
                        { id: 'monthly', label: 'Monthly' },
                        { id: 'yearly', label: 'Yearly' }
                      ].map((view) => (
                        <button
                          key={view.id}
                          onClick={() => setChartView(view.id as 'weekly' | 'monthly' | 'yearly')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            chartView === view.id
                              ? 'bg-blue-600 text-white shadow-md transform scale-105'
                              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          {view.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50/50 to-blue-50/30 dark:from-gray-700/30 dark:to-gray-600/20 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                    <Line
                      data={prepareChartData()!}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: false,
                            title: {
                              display: true,
                              text: 'Miles per Gallon',
                              font: {
                                size: 14,
                                weight: 'bold'
                              }
                            },
                            grid: {
                              color: 'rgba(156, 163, 175, 0.2)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: chartView === 'weekly' ? 'Fill-up Date' :
                                   chartView === 'monthly' ? 'Month' : 'Year',
                              font: {
                                size: 14,
                                weight: 'bold'
                              }
                            },
                            grid: {
                              color: 'rgba(156, 163, 175, 0.2)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Maintenance Status */}
            <section className="py-12 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="px-8">
                <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Maintenance Status</h2>
                <div className="space-y-4">
                  {getMaintenanceStatus().map((status, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        status.status === 'overdue'
                          ? 'bg-red-50/80 border-red-200/50 dark:bg-red-900/20 dark:border-red-700/50'
                          : status.status === 'due_soon'
                          ? 'bg-yellow-50/80 border-yellow-200/50 dark:bg-yellow-900/20 dark:border-yellow-700/50'
                          : status.status === 'good'
                          ? 'bg-green-50/80 border-green-200/50 dark:bg-green-900/20 dark:border-green-700/50'
                          : 'bg-gray-50/80 border-gray-200/50 dark:bg-gray-700/20 dark:border-gray-600/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <svg
                            className={`w-5 h-5 mt-0.5 mr-3 ${
                              status.status === 'overdue'
                                ? 'text-red-600 dark:text-red-400'
                                : status.status === 'due_soon'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : status.status === 'good'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            {status.status === 'overdue' ? (
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            ) : status.status === 'due_soon' ? (
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            ) : status.status === 'good' ? (
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            )}
                          </svg>
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                status.status === 'overdue'
                                  ? 'text-red-800 dark:text-red-200'
                                  : status.status === 'due_soon'
                                  ? 'text-yellow-800 dark:text-yellow-200'
                                  : status.status === 'good'
                                  ? 'text-green-800 dark:text-green-200'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {status.type}
                            </p>
                            <p
                              className={`text-sm ${
                                status.status === 'overdue'
                                  ? 'text-red-700 dark:text-red-300'
                                  : status.status === 'due_soon'
                                  ? 'text-yellow-700 dark:text-yellow-300'
                                  : status.status === 'good'
                                  ? 'text-green-700 dark:text-green-300'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {status.message}
                            </p>
                          </div>
                        </div>
                        {status.status === 'no_record' && userIsOwner && (
                          <button
                            onClick={() => setActiveTab('add-maintenance')}
                            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors duration-200 flex-shrink-0"
                          >
                            Add Record
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Vehicles Section */}
            <section className="py-12 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="px-8">
                <h2 className="text-4xl font-bold mb-12 text-center text-gradient-primary">Vehicle Fleet</h2>
                {cars.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.map((car) => (
                      <div key={car.id} className="group card-professional p-8 animate-fade-in-up">
                        <div className="flex items-start mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-elegant relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7L8 4l4 2v10m6-6h1.5a2.5 2.5 0 010 5H20m-8 0H4a2 2 0 01-2-2V9a2 2 0 012-2h8m0 6v2a2 2 0 002 2h4a2 2 0 002-2v-2" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                              {car.year} {car.make} {car.model}
                            </h3>
                            {car.nickname && (
                              <p className="text-purple-600 dark:text-purple-400 font-medium italic mb-1">&quot;{car.nickname}&quot;</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {car.color && (
                            <div className="flex items-center">
                              <span className="text-gray-500 dark:text-gray-400 text-sm w-16">Color:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{car.color}</span>
                            </div>
                          )}
                          {car.license_plate && userIsOwner && (
                            <div className="flex items-center">
                              <span className="text-gray-500 dark:text-gray-400 text-sm w-16">Plate:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-mono font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{car.license_plate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {userIsOwner ? 'No vehicles added yet' : 'No vehicle data available'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {userIsOwner ? 'Add your first vehicle to start tracking fuel efficiency and maintenance.' : 'Vehicle data is not available in demo mode.'}
                    </p>
                    {userIsOwner && (
                      <button
                        onClick={() => setActiveTab('add-car')}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Add Your First Vehicle
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'add-car' && (
          <section className="py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="px-8">
              <AddCarForm onSuccess={() => { loadData(); setActiveTab('dashboard'); }} />
            </div>
          </section>
        )}

        {activeTab === 'add-fillup' && cars.length > 0 && (
          <section className="py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="px-8">
              <AddFillUpForm cars={cars} onSuccess={() => { loadData(); setActiveTab('dashboard'); }} />
            </div>
          </section>
        )}

        {activeTab === 'add-maintenance' && cars.length > 0 && (
          <section className="py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="px-8">
              <AddMaintenanceForm cars={cars} onSuccess={() => { loadData(); setActiveTab('dashboard'); }} />
            </div>
          </section>
        )}

        {(activeTab === 'add-fillup' || activeTab === 'add-maintenance') && cars.length === 0 && (
          <section className="py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {userIsOwner ? 'Add a Vehicle First' : 'No vehicle data available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {userIsOwner ? 'You need to add a vehicle before you can track fill-ups or maintenance.' : 'Vehicle data is not available in demo mode.'}
              </p>
              {userIsOwner && (
                <button
                  onClick={() => setActiveTab('add-car')}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Add Your First Vehicle
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// Add Car Form Component
function AddCarForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
    nickname: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add car')
      }
    } catch (error) {
      console.error('Error adding car:', error)
      alert('Failed to add car')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Car</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Make *</label>
            <input
              type="text"
              required
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Toyota, Honda, Ford..."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Model *</label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Camry, Civic, F-150..."
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Year *</label>
            <input
              type="number"
              required
              min="1900"
              max="2030"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="2020"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Silver, Black, Red..."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">License Plate</label>
            <input
              type="text"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="ABC-1234"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Nickname</label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="My daily driver, The truck..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Adding...' : 'Add Car'}
        </button>
      </form>
    </div>
  )
}

// Add Fill-up Form Component
function AddFillUpForm({ cars, onSuccess }: { cars: Car[], onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    car_id: cars[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    odometer_reading: '',
    gallons: '',
    price_per_gallon: '',
    gas_station: '',
    location: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/fill-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add fill-up')
      }
    } catch (error) {
      console.error('Error adding fill-up:', error)
      alert('Failed to add fill-up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Fill-up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Car *</label>
            <select
              required
              value={formData.car_id}
              onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.year} {car.make} {car.model} {car.nickname && `(${car.nickname})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Odometer Reading *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.odometer_reading}
              onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Miles"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Gallons *</label>
            <input
              type="number"
              required
              min="0"
              step="0.001"
              value={formData.gallons}
              onChange={(e) => setFormData({ ...formData, gallons: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="10.5"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Price per Gallon *</label>
            <input
              type="number"
              required
              min="0"
              step="0.001"
              value={formData.price_per_gallon}
              onChange={(e) => setFormData({ ...formData, price_per_gallon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="3.45"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Gas Station</label>
            <input
              type="text"
              value={formData.gas_station}
              onChange={(e) => setFormData({ ...formData, gas_station: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Shell, Chevron, etc."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="City, State"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Adding...' : 'Add Fill-up'}
        </button>
      </form>
    </div>
  )
}

// Add Maintenance Form Component
function AddMaintenanceForm({ cars, onSuccess }: { cars: Car[], onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    car_id: cars[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    type: 'oil_change',
    description: '',
    cost: '',
    mileage: '',
    service_provider: '',
    location: '',
    next_service_date: '',
    next_service_mileage: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const maintenanceTypes = [
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'tire_rotation', label: 'Tire Rotation' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'tune_up', label: 'Tune-up' },
    { value: 'repair', label: 'Repair' },
    { value: 'other', label: 'Other' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add maintenance record')
      }
    } catch (error) {
      console.error('Error adding maintenance record:', error)
      alert('Failed to add maintenance record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Maintenance Record</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Car *</label>
            <select
              required
              value={formData.car_id}
              onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.year} {car.make} {car.model} {car.nickname && `(${car.nickname})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {maintenanceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Current Mileage *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Miles"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Description *</label>
          <input
            type="text"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Oil change with 5W-30 synthetic..."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Cost *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="89.99"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Service Provider</label>
            <input
              type="text"
              value={formData.service_provider}
              onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Jiffy Lube, Dealership..."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="City, State"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Next Service Date</label>
            <input
              type="date"
              value={formData.next_service_date}
              onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Next Service Mileage</label>
            <input
              type="number"
              min="0"
              value={formData.next_service_mileage}
              onChange={(e) => setFormData({ ...formData, next_service_mileage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Miles"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Adding...' : 'Add Maintenance Record'}
        </button>
      </form>
    </div>
  )
}