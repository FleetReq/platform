'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase, type Car, type FillUp, type MaintenanceRecord, isOwner, getUserSubscriptionPlan, getUserMaxVehicles, hasFeatureAccess } from '@/lib/supabase-client'
import { MAINTENANCE_INTERVALS, getMaintenanceStatus, getLatestMaintenanceRecord, type MaintenanceStatus } from '@/lib/maintenance'
import BackgroundAnimation from '../components/BackgroundAnimation'
import AuthComponent from '../../components/AuthComponent'
import RecordDetailModal from '../../components/RecordDetailModal'
import ReceiptPhotoPicker from '../../components/ReceiptPhotoPicker'
import { useReceiptUpload } from '@/lib/use-receipt-upload'
import type { User } from '@supabase/supabase-js'
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

// IRS Standard Mileage Rates (business use)
// Updated annually — IRS announces the new rate in late December for the following year.
// When the new rate is announced, add the new year + rate here.
// Source: https://www.irs.gov/tax-professionals/standard-mileage-rates
const IRS_MILEAGE_RATES: Record<number, number> = {
  2024: 0.67,
  2025: 0.70,
  2026: 0.725,
}

function getIrsRate(year: number): number {
  if (IRS_MILEAGE_RATES[year]) return IRS_MILEAGE_RATES[year]
  // Fall back to most recent known rate if current year isn't added yet
  const knownYears = Object.keys(IRS_MILEAGE_RATES).map(Number).sort((a, b) => b - a)
  return IRS_MILEAGE_RATES[knownYears[0]]
}

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_IRS_RATE = getIrsRate(CURRENT_YEAR)

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
  total_miles: number
  cost_per_mile: number
  business_miles: number
  business_percentage: number
  ytd_fuel_cost: number
  ytd_maintenance_cost: number
  ytd_total_cost: number
  this_month_fuel_cost: number
  this_month_maintenance_cost: number
  this_month_total_cost: number
}

// Helper function to get interval display text for a maintenance type
function getIntervalDisplay(
  type: string,
  latestRecord: MaintenanceRecord | null | undefined
): string {
  const interval = MAINTENANCE_INTERVALS[type]
  if (!interval) return ''

  // If user has custom next service values, show those
  const customParts: string[] = []
  if (latestRecord?.next_service_mileage) {
    customParts.push(`Next: ${latestRecord.next_service_mileage.toLocaleString()} mi`)
  }
  if (latestRecord?.next_service_date) {
    const date = new Date(latestRecord.next_service_date)
    customParts.push(`Next: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
  }
  if (customParts.length > 0) return customParts.join(' · ')

  // Default intervals
  const parts: string[] = []
  if (interval.miles) parts.push(`${(interval.miles / 1000).toFixed(0)}k mi`)
  if (interval.months) parts.push(`${interval.months} mo`)
  return parts.length > 0 ? `Every ${parts.join(' / ')}` : ''
}

// Maintenance Status Grid Component
function MaintenanceStatusGrid({
  selectedCarId,
  cars,
  maintenanceRecords,
  subscriptionPlan,
  userId
}: {
  selectedCarId: string | null,
  cars: Car[],
  maintenanceRecords: MaintenanceRecord[],
  subscriptionPlan: 'free' | 'personal' | 'business',
  userId: string | null
}) {
  if (!selectedCarId) {
    return (
      <div className="card-professional p-4">
        <h3 className="text-sm font-bold mb-3 text-gray-900 dark:text-white">Maintenance Status</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Select a vehicle to view maintenance status</p>
      </div>
    )
  }

  const selectedCar = cars.find(car => car.id === selectedCarId)
  const carMaintenanceRecords = maintenanceRecords.filter(record => record.car_id === selectedCarId)

  // Check if user has access to maintenance tracking
  const hasMaintenanceAccess = userId ? hasFeatureAccess(userId, subscriptionPlan, 'maintenance_tracking') : false

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'good': return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'overdue': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      default: return 'border-gray-400 bg-gray-50 dark:bg-gray-800/50'
    }
  }

  const getTextColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-300'
      case 'warning': return 'text-yellow-600 dark:text-yellow-300'
      case 'overdue': return 'text-red-600 dark:text-red-300'
      default: return 'text-gray-600 dark:text-gray-300'
    }
  }

  const [showUntracked, setShowUntracked] = useState(false)

  const maintenanceTypes = [
    // Engine & Fluids
    { key: 'oil_change', label: 'Oil Change', icon: '🛢️' },
    { key: 'transmission_service', label: 'Transmission', icon: '⚙️' },
    { key: 'coolant_flush', label: 'Coolant', icon: '🧊' },
    { key: 'air_filter', label: 'Air Filter', icon: '🌬️' },
    { key: 'cabin_air_filter', label: 'Cabin Filter', icon: '🌿' },
    { key: 'spark_plugs', label: 'Spark Plugs', icon: '⚡' },
    // Tires & Brakes
    { key: 'tire_rotation', label: 'Tire Rotation', icon: '🔄' },
    { key: 'tire_change', label: 'Tire Change', icon: '🛞' },
    { key: 'brake_pads', label: 'Brake Pads', icon: '🛑' },
    { key: 'rotors', label: 'Rotors', icon: '💿' },
    { key: 'brake_fluid_flush', label: 'Brake Fluid', icon: '💧' },
    // Electrical & Belts
    { key: 'battery', label: 'Battery', icon: '🔋' },
    { key: 'serpentine_belt', label: 'Serp. Belt', icon: '🔗' },
    // Other
    { key: 'wipers', label: 'Wipers', icon: '🌧️' },
    { key: 'registration', label: 'Registration', icon: '📋' }
  ]

  // Split types into tracked (has records) and untracked (no records)
  const trackedTypes = maintenanceTypes.filter(({ key }) =>
    carMaintenanceRecords.some(r => r.type === key)
  )
  const untrackedTypes = maintenanceTypes.filter(({ key }) =>
    !carMaintenanceRecords.some(r => r.type === key)
  )

  const renderStatusItem = ({ key, label, icon }: { key: string, label: string, icon: string }, dimmed = false) => {
    const latestRecord = getLatestMaintenanceRecord(carMaintenanceRecords, key)
    const status = dimmed ? 'unknown' as MaintenanceStatus : getMaintenanceStatus(
      key,
      latestRecord || null,
      selectedCar?.current_mileage || null,
      subscriptionPlan
    )

    return (
      <div
        key={key}
        className={`border-l-4 p-2 rounded-r-lg ${dimmed ? 'border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30' : getStatusColor(status)}`}
      >
        <div className="flex items-center">
          <span className={`text-sm mr-2 ${dimmed ? 'opacity-50' : ''}`}>{icon}</span>
          <span className={`text-xs font-semibold ${dimmed ? 'text-gray-400 dark:text-gray-500' : getTextColor(status)}`}>
            {label}
          </span>
        </div>
        <div className="ml-6 text-[10px] text-gray-500 dark:text-gray-400 truncate">
          {dimmed ? 'No records yet' : getIntervalDisplay(key, latestRecord)}
        </div>
      </div>
    )
  }

  return (
    <div className="card-professional p-4">
      <h3 className="text-sm font-bold mb-3 text-gradient-primary">Maintenance Status</h3>

      <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Status Overview</h4>
          {!hasMaintenanceAccess && (
            <span className="ml-auto text-[10px] px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
              🔒 LOCKED
            </span>
          )}
        </div>

        {hasMaintenanceAccess ? (
          <>
            <div className="grid grid-cols-2 gap-1">
              {trackedTypes.length > 0 ? (
                trackedTypes.map(item => renderStatusItem(item))
              ) : (
                <div className="col-span-2 text-center py-3 text-xs text-gray-500 dark:text-gray-400">
                  No maintenance records yet. Add your first record below.
                </div>
              )}
            </div>

            {untrackedTypes.length > 0 && (
              <>
                <button
                  onClick={() => setShowUntracked(!showUntracked)}
                  className="w-full mt-2 py-1.5 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${showUntracked ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {showUntracked ? `Hide ${untrackedTypes.length} untracked` : `Show ${untrackedTypes.length} more...`}
                </button>

                {showUntracked && (
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {untrackedTypes.map(item => renderStatusItem(item, true))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="relative">
            {/* Blurred preview */}
            <div className="filter blur-sm pointer-events-none select-none">
              <div className="grid grid-cols-2 gap-1">
                {maintenanceTypes.slice(0, 6).map(({ key, label, icon }) => (
                  <div
                    key={key}
                    className="border-l-4 p-2 rounded-r-lg border-green-500 bg-green-50 dark:bg-green-900/20"
                  >
                    <div className="flex items-center">
                      <span className="text-sm mr-2">{icon}</span>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-300">
                        {label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Centered upgrade button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                href="/pricing#personal"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-lg transition-colors"
              >
                Upgrade to Personal - $4/mo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Records Management Component
function RecordsManager({
  cars,
  fillUps,
  maintenanceRecords,
  onRecordDeleted,
  userId,
  subscriptionPlan
}: {
  cars: Car[],
  fillUps: FillUp[],
  maintenanceRecords: MaintenanceRecord[],
  onRecordDeleted: () => void,
  userId: string,
  subscriptionPlan: 'free' | 'personal' | 'business'
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [recordType, setRecordType] = useState<'all' | 'fillups' | 'maintenance'>('all')
  const [maintenanceType, setMaintenanceType] = useState<string>('all')
  const [selectedCarId, setSelectedCarId] = useState<string>('all')
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [jumpToPage, setJumpToPage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'fillup' | 'maintenance', id: string, description: string } | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<{ type: 'fillup' | 'maintenance', record: FillUp | MaintenanceRecord, car: Car } | null>(null)
  const recordsPerPage = 20

  // Filter records based on search and filters
  const filteredRecords = useMemo(() => {
    let allRecords: Array<{
      id: string
      type: 'fillup' | 'maintenance'
      date: string
      car: Car
      user_id: string
      created_at: string
      description: string
      details: string
      record: FillUp | MaintenanceRecord
    }> = []

    // Add fill-ups
    if (recordType === 'all' || recordType === 'fillups') {
      const fillUpRecords = fillUps
        .filter(fillUp => {
          const car = cars.find(c => c.id === fillUp.car_id)
          return car !== undefined
        })
        .map(fillUp => {
          const car = cars.find(c => c.id === fillUp.car_id)!
          return {
            id: fillUp.id,
            type: 'fillup' as const,
            date: fillUp.date,
            car,
            user_id: fillUp.created_by_user_id || car.user_id, // Fallback to car owner for existing records
            created_at: fillUp.created_at,
            description: `Fill-up - ${fillUp.gallons} gallons`,
            details: `${fillUp.odometer_reading} miles • ${fillUp.mpg ? fillUp.mpg + ' MPG' : 'MPG N/A'}${fillUp.total_cost ? ' • $' + fillUp.total_cost : ''}`,
            record: fillUp
          }
        })
      allRecords.push(...fillUpRecords)
    }

    // Add maintenance records
    if (recordType === 'all' || recordType === 'maintenance') {
      const maintenanceRecordsFiltered = maintenanceRecords
        .filter(record => {
          const maintenanceTypeMatch = maintenanceType === 'all' || record.type === maintenanceType
          const car = cars.find(c => c.id === record.car_id)
          return maintenanceTypeMatch && car !== undefined
        })
        .map(maintenance => {
          const car = cars.find(c => c.id === maintenance.car_id)!
          const typeLabel = maintenance.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
          return {
            id: maintenance.id,
            type: 'maintenance' as const,
            date: maintenance.date,
            car,
            user_id: maintenance.created_by_user_id || car.user_id, // Fallback to car owner for existing records
            created_at: maintenance.created_at,
            description: `${typeLabel}${maintenance.oil_type ? ` (${maintenance.oil_type})` : ''}`,
            details: `${maintenance.mileage ? maintenance.mileage + ' miles' : 'Mileage N/A'}${maintenance.cost ? ' • $' + maintenance.cost : ''}${maintenance.next_service_date ? ' • Next: ' + new Date(maintenance.next_service_date).toLocaleDateString() : ''}`,
            record: maintenance
          }
        })
      allRecords.push(...maintenanceRecordsFiltered)
    }

    // Filter by car
    if (selectedCarId !== 'all') {
      allRecords = allRecords.filter(record => record.car.id === selectedCarId)
    }

    // Filter by user
    if (selectedUserId !== 'all') {
      allRecords = allRecords.filter(record => record.user_id === selectedUserId)
    }

    // Filter by search term
    if (searchTerm) {
      allRecords = allRecords.filter(record =>
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.record as FillUp | MaintenanceRecord).notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ('location' in record.record && record.record.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ('gas_station' in record.record && record.record.gas_station?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Sort by date
    return allRecords.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
  }, [fillUps, maintenanceRecords, cars, searchTerm, recordType, maintenanceType, selectedCarId, selectedUserId, sortOrder])

  // Pagination
  const totalPages = Math.ceil((filteredRecords?.length || 0) / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const paginatedRecords = filteredRecords?.slice(startIndex, startIndex + recordsPerPage) || []

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, recordType, maintenanceType, selectedCarId, selectedUserId])

  // Handle page jump
  const handlePageJump = () => {
    const pageNum = parseInt(jumpToPage)
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      setJumpToPage('')
    }
  }

  // Get unique users for dropdown (based on record creators)
  const uniqueUsers = useMemo(() => {
    const userIds = new Set<string>()

    // Add user IDs from fill-ups
    fillUps.forEach(fillUp => {
      if (fillUp.created_by_user_id) {
        userIds.add(fillUp.created_by_user_id)
      } else {
        // Fallback to car owner for existing records
        const car = cars.find(c => c.id === fillUp.car_id)
        if (car) userIds.add(car.user_id)
      }
    })

    // Add user IDs from maintenance records
    maintenanceRecords.forEach(maintenance => {
      if (maintenance.created_by_user_id) {
        userIds.add(maintenance.created_by_user_id)
      } else {
        // Fallback to car owner for existing records
        const car = cars.find(c => c.id === maintenance.car_id)
        if (car) userIds.add(car.user_id)
      }
    })

    return Array.from(userIds).map(userId => {
      // For now, we'll just show the user ID. In a real app, you'd fetch user profiles
      return { id: userId, name: userId === 'b73a07b2-ed72-41b1-943f-e119afc9eddb' ? 'Owner (Bruce)' : `User ${userId?.slice(0, 8) || 'Unknown'}...` }
    })
  }, [cars, fillUps, maintenanceRecords])

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return uniqueUsers
    return uniqueUsers.filter(user =>
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
  }, [uniqueUsers, userSearchTerm])

  // Get display text for selected user
  const selectedUserDisplay = useMemo(() => {
    if (selectedUserId === 'all') return 'All Users'
    const user = uniqueUsers.find(u => u.id === selectedUserId)
    return user?.name || 'Unknown User'
  }, [selectedUserId, uniqueUsers])

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    setUserSearchTerm('')
    setShowUserDropdown(false)
  }

  const handleDelete = async (type: 'fillup' | 'maintenance', id: string) => {
    try {
      const endpoint = type === 'fillup' ? '/api/fill-ups' : '/api/maintenance'
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteConfirm(null)
        onRecordDeleted() // Call the callback to refresh data
      } else {
        alert('Failed to delete record')
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete record')
    }
  }

  const maintenanceTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'transmission_service', label: 'Transmission Service' },
    { value: 'coolant_flush', label: 'Coolant Flush' },
    { value: 'air_filter', label: 'Air Filter' },
    { value: 'cabin_air_filter', label: 'Cabin Air Filter' },
    { value: 'spark_plugs', label: 'Spark Plugs' },
    { value: 'tire_rotation', label: 'Tire Rotation' },
    { value: 'tire_change', label: 'Tire Change' },
    { value: 'brake_pads', label: 'Brake Pads' },
    { value: 'rotors', label: 'Rotors' },
    { value: 'brake_fluid_flush', label: 'Brake Fluid Flush' },
    { value: 'battery', label: 'Battery' },
    { value: 'serpentine_belt', label: 'Serpentine Belt' },
    { value: 'wipers', label: 'Wipers' },
    { value: 'registration', label: 'Registration' }
  ]

  // Show empty state if no cars
  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Records Yet</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Add a vehicle first to start tracking your fill-ups and maintenance records.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Records Management</h2>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search and Sort */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by service type, description, notes, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white flex items-center gap-2"
                title={`Sort by date (${sortOrder === 'desc' ? 'newest first' : 'oldest first'})`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sortOrder === 'desc' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  )}
                </svg>
                <span className="text-sm">
                  {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </span>
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">Created By</label>
              <div className="relative">
                <input
                  type="text"
                  value={showUserDropdown ? userSearchTerm : selectedUserDisplay}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value)
                    setShowUserDropdown(true)
                  }}
                  onFocus={() => {
                    setUserSearchTerm('')
                    setShowUserDropdown(true)
                  }}
                  onBlur={() => {
                    // Delay hiding to allow clicking on options
                    setTimeout(() => setShowUserDropdown(false), 150)
                  }}
                  className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10"
                  placeholder="Type to search users..."
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {showUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600"
                      onClick={() => handleUserSelect('all')}
                    >
                      <span className="text-sm text-gray-900 dark:text-white">All Users</span>
                    </div>
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleUserSelect(user.id)}
                      >
                        <span className="text-sm text-gray-900 dark:text-white">{user.name}</span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.id}</div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && userSearchTerm && (
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        No users found matching &ldquo;{userSearchTerm}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">Vehicle</label>
              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Vehicles</option>
                {cars.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.nickname || `${car.year} ${car.make} ${car.model}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">Record Type</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as 'all' | 'fillups' | 'maintenance')}
                className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Records</option>
                <option value="fillups">Fill-ups Only</option>
                <option value="maintenance">Maintenance Only</option>
              </select>
            </div>

            {recordType !== 'fillups' && (
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-medium">Maintenance Type</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {maintenanceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Showing {paginatedRecords.length} of {filteredRecords.length} records
        </div>

        {/* Records Table */}
        <div className="card-professional overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                    Date
                  </th>
                  <th className="hidden sm:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                    User
                  </th>
                  <th className="hidden sm:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                    Created
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                    Vehicle
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                    Del
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedRecords.map((record) => (
                  <tr
                    key={`${record.type}-${record.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer"
                    onClick={() => setSelectedRecord({ type: record.type, record: record.record, car: record.car })}
                  >
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${record.type === 'fillup' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {record.type === 'fillup' ? 'Fill' : 'Maint'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className="text-xs text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-2 py-2 whitespace-nowrap">
                      <span className="text-xs text-gray-900 dark:text-white truncate">
                        {uniqueUsers.find(u => u.id === record.user_id)?.name?.split(' ')[0] || `User ${record.user_id?.slice(0, 6) || 'Unknown'}...`}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-2 py-2 whitespace-nowrap">
                      <span className="text-xs text-gray-900 dark:text-white">
                        {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(record.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs text-gray-900 dark:text-white truncate block">
                        {record.car.nickname || `${record.car.year} ${record.car.make}`}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="max-w-xs">
                        <div className="text-xs text-gray-900 dark:text-white truncate">
                          {record.description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {record.details}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({
                          type: record.type,
                          id: record.id,
                          description: record.description
                        }); }}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                        title="Delete record"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedRecords.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No records found matching your criteria
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 mt-6">
            {/* Page Info and Jump */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Go to:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePageJump()}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="1"
                />
                <button
                  onClick={handlePageJump}
                  disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                  className="px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors duration-200"
                >
                  Go
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Detail/Edit Modal */}
      {selectedRecord && (
        <RecordDetailModal
          recordType={selectedRecord.type}
          record={selectedRecord.record}
          car={selectedRecord.car}
          userId={userId}
          subscriptionPlan={subscriptionPlan}
          onClose={() => setSelectedRecord(null)}
          onSaved={() => onRecordDeleted()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this record?
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-6">
              {deleteConfirm.description}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.id)}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Current Mileage Editor Component
function CurrentMileageEditor({ carId, cars, onUpdate }: { carId: string, cars: Car[], onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [mileage, setMileage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const selectedCar = cars.find(car => car.id === carId)
  const currentMileage = selectedCar?.current_mileage || 0

  useEffect(() => {
    setMileage(currentMileage.toString())
  }, [currentMileage])

  const handleSave = async (forceUpdate = false) => {
    if (!mileage || isNaN(Number(mileage))) return

    const newMileage = Number(mileage)

    // Show warning if setting to lower value (unless forced)
    if (!forceUpdate && currentMileage > 0 && newMileage < currentMileage) {
      setShowWarning(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/cars', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId,
          current_mileage: newMileage,
          manual_override: true
        })
      })

      if (response.ok) {
        onUpdate()
        setEditing(false)
        setShowWarning(false)
      } else {
        alert('Failed to update mileage')
      }
    } catch (error) {
      console.error('Error updating mileage:', error)
      alert('Failed to update mileage')
    } finally {
      setLoading(false)
    }
  }

  const handleWarningProceed = () => {
    handleSave(true)
  }

  const handleWarningCancel = () => {
    setMileage(currentMileage.toString())
    setShowWarning(false)
  }

  const handleCancel = () => {
    setMileage(currentMileage.toString())
    setEditing(false)
    setShowWarning(false)
  }

  // Warning Dialog
  if (showWarning) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Mileage Rollback Warning</h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                You&apos;re setting the mileage to {Number(mileage).toLocaleString()} miles, which is lower than the current {currentMileage.toLocaleString()} miles. This may affect maintenance tracking.
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleWarningProceed}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors disabled:opacity-50"
          >
            Proceed Anyway
          </button>
          <button
            onClick={handleWarningCancel}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Miles"
          disabled={loading}
        />
        <button
          onClick={() => handleSave()}
          disabled={loading}
          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
        >
          ✓
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {currentMileage.toLocaleString()} miles
      </span>
      <button
        onClick={() => setEditing(true)}
        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
      >
        Edit
      </button>
    </div>
  )
}

// User Settings Component
function UserSettings({ cars, onCarDeleted, initialSubscriptionPlan = 'free' }: { cars?: Car[], onCarDeleted?: () => void, initialSubscriptionPlan?: 'free' | 'personal' | 'business' }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null)
  const [confirmDeleteCarId, setConfirmDeleteCarId] = useState<string | null>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'personal' | 'business'>(initialSubscriptionPlan)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [confirmationText, setConfirmationText] = useState('')

  // Notification preferences
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false)

  // Downgrade modal state
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [downgradeTargetTier, setDowngradeTargetTier] = useState<'free' | 'personal' | null>(null)
  const [isDowngrading, setIsDowngrading] = useState(false)
  const [showVehicleSelectionModal, setShowVehicleSelectionModal] = useState(false)
  const [vehiclesToDelete, setVehiclesToDelete] = useState<string[]>([])
  const [vehiclesNeededToDelete, setVehiclesNeededToDelete] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Fetch subscription info
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_plan, subscription_end_date, email_notifications_enabled')
          .eq('id', user.id)
          .single()

        if (profile) {
          setSubscriptionPlan(profile.subscription_plan as 'free' | 'personal' | 'business')
          setSubscriptionEndDate(profile.subscription_end_date)
          setEmailNotificationsEnabled(profile.email_notifications_enabled ?? true)
        }
      }
    }
    getUser()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    if (!currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Current password is required' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }

    if (newPassword === currentPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' })
      return
    }

    setIsChangingPassword(true)
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser?.email || '',
        password: currentPassword
      })

      if (signInError) {
        setMessage({ type: 'error', text: 'Current password is incorrect' })
        return
      }

      // If verification successful, update password
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update password'
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLinkGoogle = async () => {
    // Account linking disabled for security in single-organization setup
    setMessage({
      type: 'error',
      text: 'Account linking is disabled for security. Contact your administrator for account changes.'
    })
  }

  const handleDeleteCar = async (carId: string) => {
    if (confirmDeleteCarId !== carId) {
      setConfirmDeleteCarId(carId)
      return
    }

    setDeletingCarId(carId)
    try {
      const response = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete vehicle')
      }

      setMessage({ type: 'success', text: 'Vehicle deleted successfully' })
      setConfirmDeleteCarId(null)
      if (onCarDeleted) onCarDeleted()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete vehicle'
      })
    } finally {
      setDeletingCarId(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentUser) return

    setIsCancelling(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancellationReason
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      const data = await response.json()
      setMessage({
        type: 'success',
        text: `Account deletion scheduled. Your account will remain active until ${new Date(data.subscription_end_date).toLocaleDateString()}. All data will be permanently deleted 30 days after that date.`
      })
      setShowCancelModal(false)
      setCancellationReason('')
      setConfirmationText('')

      // Refresh subscription info
      if (supabase) {
        const { data: profile } = await supabase.from('user_profiles')
          .select('subscription_plan, subscription_end_date')
          .eq('id', currentUser.id)
          .single()

        if (profile) {
          setSubscriptionPlan(profile.subscription_plan as 'free' | 'personal' | 'business')
          setSubscriptionEndDate(profile.subscription_end_date)
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to cancel subscription'
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDowngrade = async () => {
    if (!currentUser || !downgradeTargetTier) return

    setIsDowngrading(true)
    try {
      const response = await fetch('/api/subscription/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTier: downgradeTargetTier,
          vehiclesToDelete: vehiclesToDelete.length > 0 ? vehiclesToDelete : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if vehicle selection is required
        if (data.requiresVehicleSelection) {
          setVehiclesNeededToDelete(data.vehiclesToDelete)
          setShowDowngradeModal(false)
          setShowVehicleSelectionModal(true)
          setIsDowngrading(false)
          return
        }
        throw new Error(data.error || 'Failed to downgrade subscription')
      }

      setMessage({
        type: 'success',
        text: data.message
      })
      setShowDowngradeModal(false)
      setShowVehicleSelectionModal(false)
      setDowngradeTargetTier(null)
      setVehiclesToDelete([])

      // Refresh data
      if (onCarDeleted) onCarDeleted()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to downgrade subscription'
      })
    } finally {
      setIsDowngrading(false)
    }
  }

  const isGoogleLinked = currentUser?.app_metadata?.providers?.includes('google')

  const getPlanDisplayName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1)
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-600 dark:text-gray-400'
      case 'personal': return 'text-blue-600 dark:text-blue-400'
      case 'business': return 'text-purple-600 dark:text-purple-400'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h2>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Email: </span>
            <span className="text-gray-900 dark:text-white">{currentUser?.email}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Account Created: </span>
            <span className="text-gray-900 dark:text-white">
              {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">Weekly maintenance reminders</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Get email alerts when maintenance items are overdue{subscriptionPlan !== 'free' ? ' or approaching due' : ''}
            </div>
          </div>
          <button
            onClick={async () => {
              if (!supabase || !currentUser) return
              setIsTogglingNotifications(true)
              const newValue = !emailNotificationsEnabled
              const { error } = await supabase
                .from('user_profiles')
                .update({ email_notifications_enabled: newValue })
                .eq('id', currentUser.id)
              if (!error) {
                setEmailNotificationsEnabled(newValue)
                setMessage({ type: 'success', text: newValue ? 'Email notifications enabled' : 'Email notifications disabled' })
              } else {
                setMessage({ type: 'error', text: 'Failed to update notification preference' })
              }
              setIsTogglingNotifications(false)
            }}
            disabled={isTogglingNotifications}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
              emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={emailNotificationsEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
                  ⚠️ DELETE ACCOUNT?
                </h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold">
                    This action is <span className="text-red-600 dark:text-red-400 uppercase">permanent and cannot be undone</span>.
                  </p>
                  <p>
                    Your subscription will remain active until{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString() : 'the end of your billing period'}
                    </span>.
                  </p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    30 days after that date, ALL of your data will be permanently deleted:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>All vehicles and their information</li>
                    <li>All fuel fill-up records</li>
                    <li>All maintenance records</li>
                    <li>All trip tracking data</li>
                    <li>Your account and profile</li>
                  </ul>
                  <p className="font-semibold pt-2">
                    There is no way to recover this data after deletion.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Why are you leaving? (Optional)
              </label>
              <textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                placeholder="Help us improve..."
              />
            </div>

            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg p-4">
              <label htmlFor="confirmationText" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                To confirm deletion, type <span className="text-red-600 dark:text-red-400 font-mono">Confirm Deletion</span> below:
              </label>
              <input
                id="confirmationText"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border-2 border-red-300 dark:border-red-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
                placeholder="Type: Confirm Deletion"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancellationReason('')
                  setConfirmationText('')
                }}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling || confirmationText !== 'Confirm Deletion'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isCancelling ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downgrade Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Downgrade Subscription
            </h3>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select the tier you want to downgrade to. You&apos;ll keep your current {subscriptionPlan} tier access until the end of your billing period.
              </p>

              {/* Tier Selection */}
              <div className="space-y-2">
                {subscriptionPlan === 'business' && (
                  <button
                    onClick={() => setDowngradeTargetTier('personal')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      downgradeTargetTier === 'personal'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">Personal Tier - $4/month</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Up to 3 vehicles, full maintenance tracking</div>
                  </button>
                )}
                {(subscriptionPlan === 'business' || subscriptionPlan === 'personal') && (
                  <>
                    <button
                      onClick={() => setDowngradeTargetTier('free')}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        downgradeTargetTier === 'free'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">Free Tier</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">1 vehicle, basic features</div>
                    </button>

                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDowngradeModal(false)
                  setDowngradeTargetTier(null)
                }}
                disabled={isDowngrading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDowngrade}
                disabled={isDowngrading || !downgradeTargetTier}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isDowngrading ? 'Processing...' : 'Downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Selection Modal */}
      {showVehicleSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Select Vehicles to Remove
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You have {cars?.length || 0} vehicles but the {downgradeTargetTier} tier allows {downgradeTargetTier === 'free' ? 1 : 3}.
              Please select {vehiclesNeededToDelete} vehicle{vehiclesNeededToDelete > 1 ? 's' : ''} to remove:
            </p>

            <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
              {cars?.map((car) => (
                <div
                  key={car.id}
                  onClick={() => {
                    if (vehiclesToDelete.includes(car.id)) {
                      setVehiclesToDelete(vehiclesToDelete.filter(id => id !== car.id))
                    } else if (vehiclesToDelete.length < vehiclesNeededToDelete) {
                      setVehiclesToDelete([...vehiclesToDelete, car.id])
                    }
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    vehiclesToDelete.includes(car.id)
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {car.year} {car.make} {car.model}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {car.nickname && `"${car.nickname}" • `}{car.license_plate}
                      </div>
                    </div>
                    {vehiclesToDelete.includes(car.id) && (
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVehicleSelectionModal(false)
                  setVehiclesToDelete([])
                  setShowDowngradeModal(true)
                }}
                disabled={isDowngrading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleDowngrade}
                disabled={isDowngrading || vehiclesToDelete.length !== vehiclesNeededToDelete}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isDowngrading ? 'Processing...' : `Remove ${vehiclesToDelete.length}/${vehiclesNeededToDelete} & Downgrade`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Linked Accounts */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Linked Accounts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Google</div>
                <div className="text-sm text-gray-500">Sign in with your Google account</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGoogleLinked ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Link Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Delete Vehicles */}
      {cars && cars.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Vehicles</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Deleting a vehicle will permanently remove all associated fill-up and maintenance records.
          </p>
          <div className="space-y-3">
            {cars.map((car) => (
              <div key={car.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {car.year} {car.make} {car.model}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {car.nickname && `"${car.nickname}" • `}
                    {car.license_plate}
                  </div>
                </div>
                <div className="flex gap-2">
                  {confirmDeleteCarId === car.id ? (
                    <>
                      <button
                        onClick={() => setConfirmDeleteCarId(null)}
                        className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteCar(car.id)}
                        disabled={deletingCarId === car.id}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
                      >
                        {deletingCarId === car.id ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDeleteCar(car.id)}
                      disabled={deletingCarId !== null}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Management */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Plan</div>
              <div className={`text-xl font-bold ${getPlanColor(subscriptionPlan)}`}>
                {getPlanDisplayName(subscriptionPlan)}
              </div>
            </div>
            {subscriptionPlan !== 'free' && subscriptionEndDate && (
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Renews on
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(subscriptionEndDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>

          {subscriptionPlan !== 'free' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDowngradeModal(true)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Downgrade Subscription
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {subscriptionPlan === 'free' && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upgrade to unlock more vehicles, full maintenance tracking, and professional features
              </p>
              <a
                href="/pricing"
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                View Pricing Plans
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MileageTracker() {
  const [user, setUser] = useState<User | null>(null)
  // Removed authLoading - using user && (loading || !dataLoaded) pattern instead
  const [cars, setCars] = useState<Car[]>([])
  const [dataLoaded, setDataLoaded] = useState(false) // Track if initial data load is complete
  const [stats, setStats] = useState<UserStats | null>(null)
  const [fillUps, setFillUps] = useState<FillUp[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  // Auth state is now managed by AuthComponent
  const [userIsOwner, setUserIsOwner] = useState(false)
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<'free' | 'personal' | 'business'>('free')
  const [maxVehicles, setMaxVehicles] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance' | 'add-trip' | 'records' | 'settings'>('dashboard')
  const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)

  // Set default car to first car when cars are loaded
  // TODO: Add default_car_id to user_profiles table for user preference
  useEffect(() => {
    if (cars.length > 0 && !selectedCarId) {
      setSelectedCarId(cars[0].id)
    }
  }, [cars, selectedCarId])

  // Handle auth state changes from AuthComponent
  const handleAuthChange = useCallback(async (newUser: User | null) => {
    console.log('Auth state changed:', newUser ? `${newUser.email} (${newUser.id})` : 'null')

    // If user is logging in, reset loading states to show spinner
    if (newUser) {
      setLoading(true)
      setDataLoaded(false)
    }

    setUser(newUser)
    setUserIsOwner(newUser ? isOwner(newUser.id) : false)

    // Load subscription plan and max vehicles for authenticated users
    if (newUser) {
      const plan = await getUserSubscriptionPlan(newUser.id)
      setUserSubscriptionPlan(plan)
      const maxVehicles = await getUserMaxVehicles(newUser.id)
      setMaxVehicles(maxVehicles)
    } else {
      setUserSubscriptionPlan('free')
      setMaxVehicles(1)
    }

    // Load data for the new user (or demo data if no user)
    await loadData().catch(error => {
      console.error('Error loading data:', error)
    })

    // After data is loaded, mark loading as complete
    if (newUser) {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark data as loaded only after loading completes
  // Add minimum delay to ensure smooth transition and no flash
  useEffect(() => {
    if (!loading) {
      // Wait at least 300ms to show spinner as intentional loading state, not a flash
      const timer = setTimeout(() => {
        setDataLoaded(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Initialize auth state and clean up URL parameters
  useEffect(() => {
    const initializeAuth = async () => {
      // Clean up URL parameters from auth callbacks
      const searchParams = new URLSearchParams(window.location.search)
      const errorParam = searchParams.get('error')
      const authSuccess = searchParams.get('auth')

      if (errorParam === 'auth_callback_error' || authSuccess === 'success') {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('error')
        newUrl.searchParams.delete('auth')
        window.history.replaceState({}, '', newUrl.pathname + newUrl.search)
      }

      // Initialize auth state - FIX: Use handleAuthChange to properly initialize all state
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const currentUser = session?.user ?? null

          // FIX: Call handleAuthChange instead of setting state directly
          // This ensures subscription plan, max vehicles, and data are all loaded properly
          await handleAuthChange(currentUser)
        } catch (error) {
          console.error('Error getting session:', error)
          await handleAuthChange(null)
          setLoading(false)
        }
      } else {
        // No supabase client - show error state
        setLoading(false)
      }
    }

    initializeAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    try {
      if (!supabase) return

      // Fetch ALL data first before setting any state
      const [carsResponse, statsResponse, fillUpsResponse, maintenanceResponse] = await Promise.all([
        fetch('/api/cars', { credentials: 'include' }),
        fetch('/api/stats'),
        fetch('/api/fill-ups?limit=50', { credentials: 'include' }),
        fetch('/api/maintenance?limit=50', { credentials: 'include' })
      ])

      // Extract data
      const carsData = carsResponse.ok ? (await carsResponse.json()).cars || [] : []
      const statsData = statsResponse.ok ? (await statsResponse.json()).stats : null
      const fillUpsData = fillUpsResponse.ok ? (await fillUpsResponse.json()).fillUps || [] : []
      const maintenanceData = maintenanceResponse.ok ? (await maintenanceResponse.json()).maintenanceRecords || [] : []

      // Set ALL state in one batch - React will batch these updates
      setCars(carsData)
      setStats(statsData)
      setFillUps(fillUpsData)
      setMaintenanceRecords(maintenanceData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [])


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


  // Show data loading screen (only for authenticated users fetching data)
  if (user && (loading || !dataLoaded)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <div className="text-gray-700 dark:text-gray-300 text-lg">Loading your vehicles...</div>
      </div>
    )
  }

  // Show auth component if no user is logged in
  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative">
        <BackgroundAnimation />

        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-6">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
              FleetSync
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
                    <span className="text-white font-medium">Personal</span>
                    <span className="text-blue-400">$4/month (1 user, 3 vehicles)</span>
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

  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Professional 3-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicle Info, Performance, and Maintenance */}
          <div className="lg:col-span-1 space-y-6">
            {/* Vehicle Selector */}
            <div className="card-professional p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Selected Vehicle</h3>
              {cars.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm font-medium">Add a car to unlock</p>
                </div>
              ) : (
                <>
                <div className="relative mb-3">
                  <select
                    value={selectedCarId || ''}
                    onChange={(e) => setSelectedCarId(e.target.value || null)}
                    className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  >
                    <option value="">All Vehicles</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.nickname || `${car.year} ${car.make} ${car.model}`}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Current Mileage */}
                {selectedCarId && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Mileage</label>
                    <CurrentMileageEditor
                      carId={selectedCarId}
                      cars={cars}
                      onUpdate={loadData}
                    />
                  </div>
                )}
                </>
              )}
            </div>

            {/* Performance Overview - Dual Panel Design */}
            <div className="card-professional p-4 space-y-3">
              <h3 className="text-sm font-bold text-gradient-primary">Performance Overview</h3>

              {cars.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm font-medium">Add a car to unlock</p>
                </div>
              ) : stats ? (
                <div className="space-y-3">
                  {/* Budget Focus Panel (Always Visible) */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                      </svg>
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Budget Focus</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                        <div className="text-xs font-bold text-orange-600 dark:text-orange-400">${stats.cost_per_mile.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">Cost/Mile</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400">${stats.this_month_total_cost.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">This Month</div>
                      </div>
                      <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">${Math.round((stats.total_spent + stats.total_maintenance_cost) * 100) / 100}</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">All-Time</div>
                      </div>
                    </div>
                  </div>

                  {/* Tax Tracking Panel (Locked for Free Tier) */}
                  <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                      </svg>
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Tax Tracking 2025</h4>
                      {userSubscriptionPlan === 'free' && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>

                    {/* Show metrics for Personal/Business, locked overlay for Free */}
                    {userSubscriptionPlan !== 'free' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/20 rounded">
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-200">${stats.ytd_total_cost.toFixed(2)}</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">YTD Total</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <div className="text-xs font-bold text-green-600 dark:text-green-400">${Math.round(stats.business_miles * CURRENT_IRS_RATE).toLocaleString()}</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">Tax Deduction</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{stats.business_percentage}%</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">Business</div>
                          </div>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                          <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Business Miles (YTD)</div>
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.business_miles.toLocaleString()}</div>
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 text-center bg-amber-50 dark:bg-amber-900/20 rounded p-1.5 border border-amber-200 dark:border-amber-800">
                          💡 Use &quot;Add Trip&quot; tab to log business trips for tax deductions
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                          IRS rate: ${CURRENT_IRS_RATE}/mile ({CURRENT_YEAR}) • Tracks business purpose trips
                        </div>
                      </div>
                    ) : (
                      /* Locked State for Free Tier */
                      <div className="relative">
                        <div className="filter blur-sm pointer-events-none select-none">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/20 rounded">
                              <div className="text-xs font-bold text-gray-900 dark:text-gray-200">12,450</div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">Miles Tracked</div>
                            </div>
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">$8,715</div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">Potential Ded.</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                              <div className="text-xs font-bold text-orange-600 dark:text-orange-400">$0.45</div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">$/Mile</div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Link
                            href="/pricing#personal"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-lg transition-colors"
                          >
                            Upgrade to Personal - $4/mo
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Maintenance Status - Dynamic */}
            {cars.length === 0 ? (
              <div className="card-professional p-4">
                <h3 className="text-sm font-bold mb-3 text-gradient-primary">Maintenance Status</h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm font-medium">Add a car to unlock</p>
                </div>
              </div>
            ) : (
              <MaintenanceStatusGrid
                selectedCarId={selectedCarId}
                cars={cars}
                maintenanceRecords={maintenanceRecords}
                subscriptionPlan={userSubscriptionPlan}
                userId={user?.id || null}
              />
            )}
          </div>

          {/* Right Column - Navigation Tabs + Charts/Forms */}
          <div className="lg:col-span-2 space-y-6 relative">
              {/* First-Time User Tutorial Speech Bubble - Positioned over content */}
              {dataLoaded && cars.length === 0 && activeTab !== 'add-car' && (
                <div className="fixed top-[140px] left-1/2 sm:left-[calc(50%+120px)] transform -translate-x-1/2 z-[100] pointer-events-none">
                  <div className="relative inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl px-6 py-4 shadow-2xl animate-bounce-gentle">
                    {/* Upward-pointing arrow positioned to point at Add Car tab (second tab) */}
                    <div className="absolute -top-3 left-12 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-transparent border-b-purple-500"></div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">👋</span>
                      <div>
                        <p className="font-semibold text-lg">Welcome to FleetReq!</p>
                        <p className="text-sm text-blue-50">Get started by clicking &quot;Add Car&quot; above!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="relative flex space-x-1 overflow-x-auto scrollbar-hide glass-morphism rounded-xl p-1 shadow-elegant">
                {[
                  { id: 'dashboard', label: 'Graph', adminOnly: false },
                  { id: 'add-car', label: 'Add Car', adminOnly: false },
                  { id: 'add-fillup', label: 'Add Fill-up', adminOnly: false },
                  { id: 'add-trip', label: 'Add Trip', adminOnly: false },
                  { id: 'add-maintenance', label: 'Maintenance', adminOnly: false },
                  { id: 'records', label: 'Records', adminOnly: false },
                  { id: 'settings', label: 'Settings', adminOnly: false }
                ].map((tab) => {
                  // Check if vehicle limit reached (only for Add Car tab)
                  const isVehicleLimitReached = tab.id === 'add-car' && cars.length >= maxVehicles

                  // All tabs are now accessible - they show empty states if no cars exist
                  // Only disable based on admin access or vehicle limit
                  const isDisabledNoCars = false // Removed: all tabs accessible with empty states

                  const isDisabled = (tab.adminOnly && !userIsOwner) || isVehicleLimitReached || isDisabledNoCars
                  const isActive = activeTab === tab.id

                  // Show vehicle count for Add Car tab
                  const tabLabel = tab.id === 'add-car'
                    ? `${tab.label} (${cars.length}/${maxVehicles})`
                    : tab.label

                  // Determine tooltip message
                  let tooltipMessage = ''
                  if (isDisabledNoCars) {
                    tooltipMessage = 'Add a vehicle first'
                  } else if (isVehicleLimitReached) {
                    tooltipMessage = 'Vehicle limit reached - Upgrade to add more'
                  } else if (tab.adminOnly && !userIsOwner) {
                    tooltipMessage = 'Admin access required'
                  }

                  // Add gold ring for Add Car tab when tutorial is showing (no pulsing)
                  const showTutorial = dataLoaded && cars.length === 0 && activeTab !== 'add-car'
                  const shouldHighlight = showTutorial && tab.id === 'add-car'

                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isDisabled && setActiveTab(tab.id as 'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance' | 'records' | 'settings')}
                      disabled={isDisabled}
                      title={tooltipMessage}
                      className={`py-2 px-3 whitespace-nowrap flex-shrink-0 sm:flex-1 rounded-lg text-sm font-medium transition-all duration-300 relative group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-elegant-lg'
                          : isDisabled
                          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                      } ${
                        shouldHighlight
                          ? 'ring-4 ring-amber-400 dark:ring-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                          : ''
                      }`}
                    >
                      {tabLabel}
                      {isDisabled && tooltipMessage && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          {tooltipMessage}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Dashboard - Fuel Efficiency Analytics */}
              {activeTab === 'dashboard' && (
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
                    {prepareChartData() ? (
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
                            onClick={() => setActiveTab('add-fillup')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            Add Fill-up
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add Car Form */}
              {activeTab === 'add-car' && (
                <div className="card-professional p-6">
                  {cars.length >= maxVehicles ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Vehicle Limit Reached
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        You&apos;ve reached your limit of {maxVehicles} vehicle{maxVehicles !== 1 ? 's' : ''}. Upgrade your plan to add more vehicles.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        View Upgrade Options
                      </Link>
                    </div>
                  ) : (
                    <AddCarForm onSuccess={() => { loadData(); setActiveTab('dashboard'); }} />
                  )}
                </div>
              )}

              {/* Add Fill-up Form */}
              {activeTab === 'add-fillup' && cars.length > 0 && (
                <div className="card-professional p-6">
                  <AddFillUpForm cars={cars} onSuccess={() => { loadData(); setActiveTab('dashboard'); }} subscriptionPlan={userSubscriptionPlan} userId={user?.id || ''} />
                </div>
              )}

              {/* Trip Tab - Add Trip Form */}
              {activeTab === 'add-trip' && cars.length > 0 && (
                <div className="card-professional p-6">
                  <AddTripForm cars={cars} onSuccess={() => { loadData(); setActiveTab('dashboard'); }} />
                </div>
              )}

              {/* Maintenance Tab - Add Maintenance Form */}
              {activeTab === 'add-maintenance' && cars.length > 0 && (
                <div className="card-professional p-6">
                  <AddMaintenanceForm
                    cars={cars}
                    onSuccess={() => { loadData(); setActiveTab('dashboard'); }}
                    subscriptionPlan={userSubscriptionPlan}
                    userId={user?.id || ''}
                  />
                </div>
              )}

              {/* Records Management */}
              {activeTab === 'records' && (
                <div className="card-professional p-6">
                  <RecordsManager
                    cars={cars}
                    fillUps={fillUps}
                    maintenanceRecords={maintenanceRecords}
                    onRecordDeleted={() => loadData()}
                    userId={user?.id || ''}
                    subscriptionPlan={userSubscriptionPlan}
                  />
                </div>
              )}

              {/* User Settings */}
              {activeTab === 'settings' && (
                <div className="card-professional p-6">
                  <UserSettings cars={cars} onCarDeleted={() => loadData()} initialSubscriptionPlan={userSubscriptionPlan} />
                </div>
              )}

              {/* No Cars Message for Forms */}
              {(activeTab === 'add-fillup' || activeTab === 'add-maintenance') && cars.length === 0 && (
                <div className="card-professional p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Add a Vehicle First
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      You need to add a vehicle before you can track {activeTab === 'add-fillup' ? 'fill-ups' : 'maintenance'}.
                    </p>
                    <button
                      onClick={() => setActiveTab('add-car')}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Add Your First Vehicle
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
    nickname: '',
    current_mileage: ''
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

        <div className="grid md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Current Mileage</label>
            <input
              type="number"
              value={formData.current_mileage}
              onChange={(e) => setFormData({ ...formData, current_mileage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="150000"
            />
          </div>
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

// Helper: check if a date string (YYYY-MM-DD) is in the future
function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inputDate = new Date(dateStr + 'T00:00:00')
  return inputDate > today
}

// Add Fill-up Form Component
function AddFillUpForm({ cars, onSuccess, subscriptionPlan = 'free', userId = '' }: { cars: Car[], onSuccess: () => void, subscriptionPlan?: 'free' | 'personal' | 'business', userId?: string }) {
  const receiptUpload = useReceiptUpload()
  const canUploadReceipts = hasFeatureAccess(userId, subscriptionPlan, 'receipt_upload')
  const [formData, setFormData] = useState({
    car_id: cars[0]?.id || '',
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
    odometer_reading: '',
    gallons: '',
    price_per_gallon: '',
    fuel_type: 'regular',
    gas_station: '',
    location: '',
    notes: '',
    consecutive_fillup: true
  })
  const [loading, setLoading] = useState(false)
  const [recentGasStations, setRecentGasStations] = useState<string[]>([])
  const [recentLocations, setRecentLocations] = useState<string[]>([])

  // Fetch recent fill-up data for smart defaults and autocomplete
  useEffect(() => {
    const fetchRecentData = async () => {
      if (!formData.car_id) return

      try {
        const response = await fetch(`/api/fill-ups?car_id=${formData.car_id}&limit=10`)
        if (response.ok) {
          const { fillUps } = await response.json()

          if (fillUps && fillUps.length > 0) {
            const mostRecent = fillUps[0]
            const selectedCar = cars.find(c => c.id === formData.car_id)

            // Set smart defaults from most recent fill-up and car data
            setFormData(prev => ({
              ...prev,
              odometer_reading: selectedCar?.current_mileage?.toString() || '',
              gallons: mostRecent.gallons?.toString() || '',
              price_per_gallon: mostRecent.price_per_gallon?.toString() || '',
              fuel_type: mostRecent.fuel_type || 'regular'
            }))

            // Build unique lists for autocomplete (filter out nulls/empty strings)
            const stations = [...new Set(fillUps
              .map((f: FillUp) => f.gas_station)
              .filter((s: string | null): s is string => s !== null && s.trim() !== '')
            )]
            const locations = [...new Set(fillUps
              .map((f: FillUp) => f.location)
              .filter((l: string | null): l is string => l !== null && l.trim() !== '')
            )]

            setRecentGasStations(stations as string[])
            setRecentLocations(locations as string[])
          } else {
            // No previous fill-ups, just set current mileage
            const selectedCar = cars.find(c => c.id === formData.car_id)
            setFormData(prev => ({
              ...prev,
              odometer_reading: selectedCar?.current_mileage?.toString() || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching recent fill-ups:', error)
      }
    }

    fetchRecentData()
  }, [formData.car_id, cars])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First, create the record
      const response = await fetch('/api/fill-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const { fillUp: createdFillUp } = await response.json()

        // Upload receipt photos if any
        const pendingPhotos = receiptUpload.files.filter(f => f.status === 'pending')
        if (pendingPhotos.length > 0 && createdFillUp?.id && userId) {
          const paths = await receiptUpload.uploadAll(userId, 'fill_ups', createdFillUp.id)
          if (paths.length > 0) {
            // Update the record with receipt URLs
            await fetch(`/api/fill-ups/${createdFillUp.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ receipt_urls: paths })
            })
          }
        }

        // Reset form to initial state
        setFormData({
          car_id: cars[0]?.id || '',
          date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
          odometer_reading: '',
          gallons: '',
          price_per_gallon: '',
          fuel_type: 'regular',
          gas_station: '',
          location: '',
          notes: '',
          consecutive_fillup: true
        })
        receiptUpload.reset()
        // Small delay to ensure API completes before refresh
        setTimeout(() => {
          onSuccess()
        }, 100)
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
              className={`w-full px-4 py-2 h-12 border rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white ${isFutureDate(formData.date) ? 'border-yellow-500 dark:border-yellow-500 focus:ring-yellow-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
            />
            {isFutureDate(formData.date) && (
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">This date is in the future</p>
            )}
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
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Price per Gallon</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={formData.price_per_gallon}
              onChange={(e) => setFormData({ ...formData, price_per_gallon: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="3.45"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Fuel Type</label>
            <select
              value={formData.fuel_type}
              onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="regular">Regular (87 Octane)</option>
              <option value="midgrade">Midgrade (89 Octane)</option>
              <option value="premium">Premium (91-93 Octane)</option>
              <option value="diesel">Diesel</option>
              <option value="e85">E85 (Flex Fuel)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Gas Station</label>
            <input
              type="text"
              list="gas-stations-list"
              value={formData.gas_station}
              onChange={(e) => setFormData({ ...formData, gas_station: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Shell, Chevron, etc."
            />
            <datalist id="gas-stations-list">
              {recentGasStations.map((station, idx) => (
                <option key={idx} value={station} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              list="locations-list"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="City, State"
            />
            <datalist id="locations-list">
              {recentLocations.map((location, idx) => (
                <option key={idx} value={location} />
              ))}
            </datalist>
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

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.consecutive_fillup}
              onChange={(e) => setFormData({ ...formData, consecutive_fillup: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Consecutive Fill-up</span>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Check this if this fill-up immediately follows your last fill-up (tank was filled completely both times).
                This ensures accurate MPG calculations. Uncheck if you missed recording previous fill-ups.
              </p>
            </div>
          </label>
        </div>

        {canUploadReceipts && (
          <ReceiptPhotoPicker
            files={receiptUpload.files}
            canAddMore={receiptUpload.canAddMore}
            remainingSlots={receiptUpload.remainingSlots}
            isUploading={receiptUpload.isUploading}
            onAddFiles={receiptUpload.addFiles}
            onRemoveFile={receiptUpload.removeFile}
          />
        )}

        <button
          type="submit"
          disabled={loading || receiptUpload.isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Adding...' : 'Add Fill-up'}
        </button>
      </form>
    </div>
  )
}

// Add Trip Form Component
function AddTripForm({ cars, onSuccess }: { cars: Car[], onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    car_id: cars[0]?.id || '',
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
    start_location: '',
    end_location: '',
    purpose: 'business',
    business_purpose: '',
    miles: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          miles: parseFloat(formData.miles)
        })
      })

      if (response.ok) {
        alert('Trip added successfully!')
        // Reset form
        setFormData({
          car_id: cars[0]?.id || '',
          date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
          start_location: '',
          end_location: '',
          purpose: 'business',
          business_purpose: '',
          miles: '',
          notes: ''
        })
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add trip')
      }
    } catch (error) {
      console.error('Error adding trip:', error)
      alert('Failed to add trip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Trip</h2>
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
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Start Location</label>
            <input
              type="text"
              value={formData.start_location}
              onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Home, Office, etc."
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">End Location *</label>
            <input
              type="text"
              required
              value={formData.end_location}
              onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Client site, Job location, etc."
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Purpose *</label>
            <select
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Miles Driven *</label>
            <input
              type="number"
              required
              min="0"
              step="0.1"
              value={formData.miles}
              onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="25.5"
            />
          </div>
        </div>

        {formData.purpose === 'business' && (
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Business Purpose * (IRS Required)</label>
            <input
              type="text"
              required
              value={formData.business_purpose}
              onChange={(e) => setFormData({ ...formData, business_purpose: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Client meeting at ABC Corp, Job site visit for Project X, etc."
            />
          </div>
        )}

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
            placeholder="Additional trip details..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Trip'}
        </button>
      </form>
    </div>
  )
}

// Add Maintenance Form Component
function AddMaintenanceForm({ cars, onSuccess, subscriptionPlan = 'free', userId = '' }: { cars: Car[], onSuccess: () => void, subscriptionPlan?: 'free' | 'personal' | 'business', userId?: string }) {
  const receiptUpload = useReceiptUpload()
  const canUploadReceipts = hasFeatureAccess(userId, subscriptionPlan, 'receipt_upload')
  const [formData, setFormData] = useState({
    car_id: cars[0]?.id || '',
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
    type: 'oil_change',
    oil_type: 'conventional',
    cost: '',
    mileage: '',
    service_provider: '',
    location: '',
    next_service_date: '',
    next_service_mileage: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [recentServiceProviders, setRecentServiceProviders] = useState<string[]>([])
  const [recentLocations, setRecentLocations] = useState<string[]>([])

  // Fetch recent maintenance data for smart defaults and autocomplete
  useEffect(() => {
    const fetchRecentData = async () => {
      if (!formData.car_id) return

      try {
        const response = await fetch(`/api/maintenance?car_id=${formData.car_id}&limit=10`)
        if (response.ok) {
          const { maintenanceRecords } = await response.json()

          if (maintenanceRecords && maintenanceRecords.length > 0) {
            const selectedCar = cars.find(c => c.id === formData.car_id)

            // Set smart defaults from car data
            setFormData(prev => ({
              ...prev,
              mileage: selectedCar?.current_mileage?.toString() || ''
            }))

            // Build unique lists for autocomplete (filter out nulls/empty strings)
            const providers = [...new Set(maintenanceRecords
              .map((m: MaintenanceRecord) => m.service_provider)
              .filter((p: string | null): p is string => p !== null && p.trim() !== '')
            )]
            const locations = [...new Set(maintenanceRecords
              .map((m: MaintenanceRecord) => m.location)
              .filter((l: string | null): l is string => l !== null && l.trim() !== '')
            )]

            setRecentServiceProviders(providers as string[])
            setRecentLocations(locations as string[])
          } else {
            // No previous maintenance, just set current mileage
            const selectedCar = cars.find(c => c.id === formData.car_id)
            setFormData(prev => ({
              ...prev,
              mileage: selectedCar?.current_mileage?.toString() || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching recent maintenance:', error)
      }
    }

    fetchRecentData()
  }, [formData.car_id, cars])

  const maintenanceTypes = [
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'transmission_service', label: 'Transmission Service' },
    { value: 'coolant_flush', label: 'Coolant Flush' },
    { value: 'air_filter', label: 'Air Filter' },
    { value: 'cabin_air_filter', label: 'Cabin Air Filter' },
    { value: 'spark_plugs', label: 'Spark Plugs' },
    { value: 'tire_rotation', label: 'Tire Rotation' },
    { value: 'tire_change', label: 'Tire Change' },
    { value: 'brake_pads', label: 'Brake Pads' },
    { value: 'rotors', label: 'Rotors' },
    { value: 'brake_fluid_flush', label: 'Brake Fluid Flush' },
    { value: 'battery', label: 'Battery' },
    { value: 'serpentine_belt', label: 'Serpentine Belt' },
    { value: 'wipers', label: 'Wipers' },
    { value: 'registration', label: 'Registration' }
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
        const { maintenanceRecord: createdRecord } = await response.json()

        // Upload receipt photos if any
        const pendingPhotos = receiptUpload.files.filter(f => f.status === 'pending')
        if (pendingPhotos.length > 0 && createdRecord?.id && userId) {
          const paths = await receiptUpload.uploadAll(userId, 'maintenance', createdRecord.id)
          if (paths.length > 0) {
            await fetch(`/api/maintenance/${createdRecord.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ receipt_urls: paths })
            })
          }
        }

        // Reset form to initial state
        setFormData({
          car_id: cars[0]?.id || '',
          date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
          type: 'oil_change',
          oil_type: 'conventional',
          cost: '',
          mileage: '',
          service_provider: '',
          location: '',
          next_service_date: '',
          next_service_mileage: '',
          notes: ''
        })
        receiptUpload.reset()
        // Small delay to ensure API completes before refresh
        setTimeout(() => {
          onSuccess()
        }, 100)
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
              className={`w-full px-4 py-2 h-12 border rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white ${isFutureDate(formData.date) ? 'border-yellow-500 dark:border-yellow-500 focus:ring-yellow-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
            />
            {isFutureDate(formData.date) && (
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">This date is in the future</p>
            )}
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
          {formData.type === 'oil_change' && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Oil Type</label>
              <select
                value={formData.oil_type}
                onChange={(e) => setFormData({ ...formData, oil_type: e.target.value })}
                className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="conventional">Conventional Oil</option>
                <option value="full_synthetic">Full Synthetic Oil</option>
                <option value="synthetic_blend">Synthetic Blend Oil</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Odometer Reading</label>
            <input
              type="number"
              min="0"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Miles"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Cost</label>
            <input
              type="number"
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
              list="service-providers-list"
              value={formData.service_provider}
              onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Jiffy Lube, Dealership..."
            />
            <datalist id="service-providers-list">
              {recentServiceProviders.map((provider, idx) => (
                <option key={idx} value={provider} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              list="maintenance-locations-list"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="City, State"
            />
            <datalist id="maintenance-locations-list">
              {recentLocations.map((location, idx) => (
                <option key={idx} value={location} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Next Service fields - Personal+ only */}
        {subscriptionPlan !== 'free' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Next Service Date <span className="text-xs text-blue-600 dark:text-blue-400">(Personal+)</span>
              </label>
              <input
                type="date"
                value={formData.next_service_date}
                onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Next Service Mileage <span className="text-xs text-blue-600 dark:text-blue-400">(Personal+)</span>
              </label>
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
        )}

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

        {canUploadReceipts && (
          <ReceiptPhotoPicker
            files={receiptUpload.files}
            canAddMore={receiptUpload.canAddMore}
            remainingSlots={receiptUpload.remainingSlots}
            isUploading={receiptUpload.isUploading}
            onAddFiles={receiptUpload.addFiles}
            onRemoveFile={receiptUpload.removeFile}
          />
        )}

        <button
          type="submit"
          disabled={loading || receiptUpload.isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Adding...' : 'Add Maintenance Record'}
        </button>
      </form>
    </div>
  )
}