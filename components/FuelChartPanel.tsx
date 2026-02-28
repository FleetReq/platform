'use client'

import { useState, useMemo } from 'react'
import { useTheme } from '@/app/theme-provider'
import { type FillUp } from '@/lib/supabase-client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface FuelChartPanelProps {
  fillUps: FillUp[]
  onAddFillUp: () => void
}

export default function FuelChartPanel({ fillUps, onAddFillUp }: FuelChartPanelProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')

  const chartData = useMemo(() => {
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
        monthlyData[monthKey].mpgs.push(f.mpg ?? 0)
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
        yearlyData[year].push(f.mpg ?? 0)
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
      data = recentFillUps.map(f => f.mpg ?? 0)
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
  }, [fillUps, chartView])

  return (
    <div className="card-professional p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fuel Efficiency Analytics</h3>
        <div className="flex space-x-1">
          {['weekly', 'monthly', 'yearly'].map((view) => (
            <button
              key={view}
              onClick={() => setChartView(view as 'weekly' | 'monthly' | 'yearly')}
              className={`px-3 py-2 text-sm rounded-lg capitalize transition-colors ${
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
      <div className="h-96 relative">
        {chartData ? (
          <Line data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Miles Per Gallon (MPG)',
                  color: isDark ? '#9ca3af' : '#374151'
                },
                ticks: {
                  color: isDark ? '#9ca3af' : '#6b7280'
                },
                grid: {
                  color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Date',
                  color: isDark ? '#9ca3af' : '#374151'
                },
                ticks: {
                  color: isDark ? '#9ca3af' : '#6b7280'
                },
                grid: {
                  color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top' as const,
                labels: {
                  color: isDark ? '#d1d5db' : '#374151'
                }
              },
              title: {
                display: true,
                text: `MPG Trends - ${chartView.charAt(0).toUpperCase() + chartView.slice(1)} View`,
                color: isDark ? '#f3f4f6' : '#111827'
              }
            }
          }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Fuel Data Yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add your first fill-up to see MPG trends and analytics
              </p>
              <button
                onClick={onAddFillUp}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Fill-up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
