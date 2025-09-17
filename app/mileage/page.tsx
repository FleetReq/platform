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
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [userIsOwner, setUserIsOwner] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance'>('dashboard')
  const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)

  // Set default car to 2006 Camry when cars are loaded
  useEffect(() => {
    if (cars.length > 0 && !selectedCarId) {
      const camry2006 = cars.find(car =>
        car.year === 2006 &&
        car.make.toLowerCase().includes('toyota') &&
        car.model.toLowerCase().includes('camry')
      )
      if (camry2006) {
        setSelectedCarId(camry2006.id)
      } else {
        // Fallback to first car if no 2006 Camry found
        setSelectedCarId(cars[0].id)
      }
    }
  }, [cars, selectedCarId])

  const checkUser = useCallback(async () => {
    try {
      if (!supabase) {
        console.log('checkUser: Database not configured, skipping auth check')
        setLoading(false)
        return
      }

      console.log('checkUser: Checking authentication state...')

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 10000)
      )

      // Get the current session with timeout
      const sessionPromise = supabase.auth.getSession()
      const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise])

      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      const userPromise = supabase.auth.getUser()
      const { data: { user } } = await Promise.race([userPromise, timeoutPromise])

      console.log('checkUser: User data:', user ? `${user.email} (${user.id})` : 'null')
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
      // Set user to null on auth errors to show demo mode
      setUser(null)
      setUserIsOwner(false)
      // Still try to load demo data
      try {
        await loadData()
      } catch (loadError) {
        console.error('Error loading demo data:', loadError)
      }
    } finally {
      console.log('checkUser: Setting loading to false')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkUser()

    // Check for OAuth callback completion (access_token in hash OR auth=success in search params)
    const urlParams = new URLSearchParams(window.location.hash.substring(1))
    const searchParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const authSuccess = searchParams.get('auth')

    if (accessToken || authSuccess === 'success') {
      // OAuth callback completed, force auth state refresh immediately
      console.log('Detected successful OAuth callback, refreshing user state...')

      // Immediately check user state
      checkUser().then(() => {
        console.log('User state refreshed after OAuth callback')
      })

      // Clear the URL parameters to clean up the URL
      if (authSuccess === 'success') {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('auth')
        window.history.replaceState({}, '', newUrl.pathname)
      }
    }

    // Listen for auth state changes (e.g., after OAuth callback)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User just signed in, sync session and reload data
          setIsSigningIn(false)
          try {
            await fetch('/api/sync-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session }),
              credentials: 'include'
            })
            // Reload user state and data immediately
            await checkUser()
            // Force a re-render to update UI state
            await loadData()
          } catch (error) {
            console.error('Failed to sync session after sign in:', error)
            setIsSigningIn(false)
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear state
          setUser(null)
          setUserIsOwner(false)
          // Return to dashboard when signing out
          setActiveTab('dashboard')
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

      setIsSigningIn(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/mileage`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
      setIsSigningIn(false)
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
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden">
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
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden">
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
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden">
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
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center shadow-lg hover:shadow-xl"
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

      {/* Admin/Demo Mode Toggle Corner */}
      <div className="fixed bottom-6 right-6 z-50">
        {user ? (
          <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Admin Mode</span>
            </div>
            <button
              onClick={signOut}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Demo Mode</span>
            </div>
            <button
              onClick={signIn}
              disabled={isSigningIn}
              className="text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-1 rounded font-medium transition-colors"
            >
              {isSigningIn ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-gradient-primary">
            Vehicle Analytics
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Professional Vehicle Fleet Management & Analytics Dashboard
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex space-x-1 flex-1 glass-morphism rounded-xl p-1 shadow-elegant">
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

        </div>


        {/* Vehicle Selector for Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="mb-8">
            <div className="card-professional p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Selected Vehicle</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Choose vehicle to view analytics and maintenance status</p>
                </div>
                <div className="relative">
                  <select
                    value={selectedCarId || ''}
                    onChange={(e) => setSelectedCarId(e.target.value || null)}
                    className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-64"
                  >
                    <option value="">All Vehicles</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.nickname || `${car.year} ${car.make} ${car.model}`}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Layout - Charts + Performance Sidebar (Hidden in admin mode for add forms) */}
        {activeTab === 'dashboard' && (
          cars.length > 0 ? (
            <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - Charts and Analytics */}
          <div className="lg:col-span-3 space-y-8">

            {/* Maintenance Status Grid */}
            <div className="card-professional p-6">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Maintenance Status</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Oil Change */}
                <div className="border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2c-1.1 0-2 .9-2 2v1h-1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1h-1V4c0-1.1-.9-2-2-2zm-1 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                    </svg>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Oil Change</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No oil change records. Add your first one!</p>
                </div>

                {/* Tire Rotation */}
                <div className="border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    </svg>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Tire Rotation</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No tire rotation records. Add your first one!</p>
                </div>

                {/* Brake Inspection */}
                <div className="border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                      <rect x="10" y="6" width="4" height="2" fill="currentColor"/>
                      <rect x="10" y="16" width="4" height="2" fill="currentColor"/>
                      <rect x="6" y="10" width="2" height="4" fill="currentColor"/>
                      <rect x="16" y="10" width="2" height="4" fill="currentColor"/>
                    </svg>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Brake Inspection</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No brake inspection records. Add your first one!</p>
                </div>

                {/* Air Filter */}
                <div className="border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 9h10M7 12h10M7 15h10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M2 10l2-1M2 12l2 0M2 14l2 1" stroke="currentColor" strokeWidth="1" fill="none"/>
                      <path d="M20 10l2 1M20 12l2 0M20 14l2-1" stroke="currentColor" strokeWidth="1" fill="none"/>
                    </svg>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Air Filter</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No air filter records. Add your first one!</p>
                </div>

                {/* Transmission Service */}
                <div className="border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Transmission Service</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No transmission records. Add your first one!</p>
                </div>

                {/* Coolant Flush */}
                <div className="border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Coolant Flush</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No coolant flush records. Add your first one!</p>
                </div>
              </div>
            </div>

            {/* Fuel Efficiency Analytics */}
            {prepareChartData() && (
              <div className="card-professional p-8">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Fuel Efficiency Analytics</h3>
                  <div className="flex space-x-1 mb-6">
                    {['weekly', 'monthly', 'yearly'].map((view) => (
                      <button
                        key={view}
                        onClick={() => setChartView(view as 'weekly' | 'monthly' | 'yearly')}
                        className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                          chartView === view
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-80">
                  <Line data={prepareChartData()!} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: false,
                        title: {
                          display: true,
                          text: 'Miles Per Gallon (MPG)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Date'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: `MPG Trends - ${chartView.charAt(0).toUpperCase() + chartView.slice(1)} View`
                      }
                    }
                  }} />
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar - Performance Overview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-2xl font-bold mb-6 text-gradient-primary">Performance Overview</h3>
              {stats && (
                <div className="space-y-4">
                  <div className="card-professional p-6 text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elegant">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stats.total_cars}</div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium">Vehicles</div>
                  </div>

                  <div className="card-professional p-6 text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elegant">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{stats.average_mpg}</div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium">Avg MPG</div>
                  </div>

                  <div className="card-professional p-6 text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elegant">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 18v-2h2v-3h2v-2h6v2h2v3h2v2H5zM9 4v4l1.5 1L12 8l1.5 1L15 4V2H9v2z"/>
                        <circle cx="7" cy="16" r="1"/>
                        <circle cx="17" cy="16" r="1"/>
                        <path d="M12 8v3" stroke="white" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{stats.total_fill_ups}</div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium">Fill-ups</div>
                  </div>

                  <div className="card-professional p-6 text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elegant">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">${stats.total_spent}</div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium">Total Spent</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7L8 4l4 2v10m6-6h1.5a2.5 2.5 0 010 5H20m-8 0H4a2 2 0 01-2-2V9a2 2 0 012-2h8m0 6v2a2 2 0 002 2h4a2 2 0 002-2v-2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Add your first car to unlock the dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Start tracking your vehicle&apos;s fuel efficiency and maintenance by adding your first car.
              </p>
              {userIsOwner && (
                <button
                  onClick={() => setActiveTab('add-car')}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Add Your First Vehicle
                </button>
              )}
            </div>
          )
        )}


        {/* Content based on active tab */}
        {activeTab === 'dashboard' && null}


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
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="2020"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Silver, Black, Red..."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">License Plate</label>
            <input
              type="text"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.nickname || `${car.year} ${car.make} ${car.model}`}
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Shell, Chevron, etc."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
    { value: 'air_filter', label: 'Air Filter' },
    { value: 'transmission_service', label: 'Transmission Service' },
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.nickname || `${car.year} ${car.make} ${car.model}`}
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="89.99"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Service Provider</label>
            <input
              type="text"
              value={formData.service_provider}
              onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Jiffy Lube, Dealership..."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Next Service Mileage</label>
            <input
              type="number"
              min="0"
              value={formData.next_service_mileage}
              onChange={(e) => setFormData({ ...formData, next_service_mileage: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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