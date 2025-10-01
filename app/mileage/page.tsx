'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase, type Car, type FillUp, type MaintenanceRecord, isOwner, isAdmin, getUserSubscriptionPlan, getUserMaxVehicles, hasFeatureAccess, getUpgradeMessage } from '@/lib/supabase-client'
import BackgroundAnimation from '../components/BackgroundAnimation'
import AuthComponent from '../../components/AuthComponent'
import UpgradePrompt from '../../components/UpgradePrompt'
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

interface MaintenanceInterval {
  months?: number
  miles?: number
  yellowThreshold?: number // percentage (0.75 = 75%)
  redThreshold?: number // percentage (1.0 = 100%)
}

const MAINTENANCE_INTERVALS: Record<string, MaintenanceInterval> = {
  oil_change: { months: 6, miles: 5000, yellowThreshold: 0.8, redThreshold: 1.0 },
  tire_rotation: { months: 6, miles: 7500, yellowThreshold: 0.8, redThreshold: 1.0 },
  brake_inspection: { months: 12, miles: 12000, yellowThreshold: 0.8, redThreshold: 1.0 },
  air_filter: { months: 12, miles: 15000, yellowThreshold: 0.8, redThreshold: 1.0 },
  transmission_service: { months: 24, miles: 30000, yellowThreshold: 0.8, redThreshold: 1.0 },
  coolant_flush: { months: 24, miles: 30000, yellowThreshold: 0.8, redThreshold: 1.0 },
  wipers: { months: 12, yellowThreshold: 0.75, redThreshold: 1.0 }, // Time-based only: 9mo yellow (75% of 12), 12mo red
  registration: { months: 24, yellowThreshold: 0.9, redThreshold: 1.0 } // Time-based only: 2 years, yellow at 21.6mo (90%)
}

type MaintenanceStatus = 'good' | 'warning' | 'overdue' | 'unknown'

function getMaintenanceStatus(
  maintenanceType: string,
  lastMaintenanceRecord: MaintenanceRecord | null,
  currentMileage: number | null
): MaintenanceStatus {
  const interval = MAINTENANCE_INTERVALS[maintenanceType]
  if (!interval) return 'unknown'

  if (!lastMaintenanceRecord) return 'unknown'

  const today = new Date()
  let timeStatus: MaintenanceStatus = 'good'
  let mileageStatus: MaintenanceStatus = 'good'

  // Priority 1: Check user-specified next service date
  if (lastMaintenanceRecord.next_service_date) {
    const nextServiceDate = new Date(lastMaintenanceRecord.next_service_date)
    const daysUntilService = (nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)

    if (daysUntilService <= 0) {
      timeStatus = 'overdue'
    } else if (daysUntilService <= 30) { // 30 days = yellow warning
      timeStatus = 'warning'
    }
  } else if (interval.months) {
    // Fallback: Use default time interval
    const lastDate = new Date(lastMaintenanceRecord.date)
    const monthsElapsed = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    const timeProgress = monthsElapsed / interval.months

    if (timeProgress >= (interval.redThreshold || 1.0)) {
      timeStatus = 'overdue'
    } else if (timeProgress >= (interval.yellowThreshold || 0.8)) {
      timeStatus = 'warning'
    }
  }

  // Priority 2: Check user-specified next service mileage
  if (lastMaintenanceRecord.next_service_mileage && currentMileage !== null) {
    const milesUntilService = lastMaintenanceRecord.next_service_mileage - currentMileage

    if (milesUntilService <= 0) {
      mileageStatus = 'overdue'
    } else if (milesUntilService <= 1000) { // 1000 miles = yellow warning
      mileageStatus = 'warning'
    }
  } else if (interval.miles && lastMaintenanceRecord.mileage && currentMileage !== null) {
    // Fallback: Use default mileage interval
    const mileageElapsed = currentMileage - lastMaintenanceRecord.mileage
    const mileageProgress = mileageElapsed / interval.miles

    if (mileageProgress >= (interval.redThreshold || 1.0)) {
      mileageStatus = 'overdue'
    } else if (mileageProgress >= (interval.yellowThreshold || 0.8)) {
      mileageStatus = 'warning'
    }
  }

  // Return the most urgent status (whichever comes first)
  if (timeStatus === 'overdue' || mileageStatus === 'overdue') {
    return 'overdue'
  } else if (timeStatus === 'warning' || mileageStatus === 'warning') {
    return 'warning'
  }

  return 'good'
}

// Helper function to get latest maintenance record for a type
function getLatestMaintenanceRecord(maintenanceRecords: MaintenanceRecord[], type: string) {
  return maintenanceRecords
    .filter(record => record.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
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

  const maintenanceTypes = [
    { key: 'oil_change', label: 'Oil Change', icon: '🛢️' },
    { key: 'tire_rotation', label: 'Tire Rotation', icon: '🔄' },
    { key: 'brake_inspection', label: 'Brakes', icon: '🛑' },
    { key: 'air_filter', label: 'Air Filter', icon: '🌬️' },
    { key: 'transmission_service', label: 'Transmission', icon: '⚙️' },
    { key: 'coolant_flush', label: 'Coolant', icon: '🧊' },
    { key: 'wipers', label: 'Wipers', icon: '🌧️' },
    { key: 'registration', label: 'Registration', icon: '📋' }
  ]

  return (
    <div className="card-professional p-4">
      <h3 className="text-sm font-bold mb-3 text-gray-900 dark:text-white">Maintenance Status</h3>

      {hasMaintenanceAccess ? (
        <div className="grid grid-cols-2 gap-1">
          {maintenanceTypes.map(({ key, label, icon }) => {
            const latestRecord = getLatestMaintenanceRecord(carMaintenanceRecords, key)
            const status = getMaintenanceStatus(
              key,
              latestRecord || null,
              selectedCar?.current_mileage || null
            )

            return (
              <div
                key={key}
                className={`border-l-4 p-2 rounded-r-lg ${getStatusColor(status)}`}
              >
                <div className="flex items-center">
                  <span className="text-sm mr-2">{icon}</span>
                  <span className={`text-xs font-semibold ${getTextColor(status)}`}>
                    {label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="relative">
          {/* Grayed out preview */}
          <div className="grid grid-cols-2 gap-1 opacity-40 pointer-events-none">
            {maintenanceTypes.map(({ key, label, icon }) => (
              <div
                key={key}
                className="border-l-4 p-2 rounded-r-lg border-gray-400 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center">
                  <span className="text-sm mr-2">{icon}</span>
                  <span className="text-xs font-semibold text-gray-500">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade overlay */}
          <UpgradePrompt
            message={getUpgradeMessage('maintenance_tracking')}
            className="absolute inset-0"
          />
        </div>
      )}
    </div>
  )
}

// Records Management Component
function RecordsManager({
  cars,
  fillUps,
  maintenanceRecords,
  onRecordDeleted
}: {
  cars: Car[],
  fillUps: FillUp[],
  maintenanceRecords: MaintenanceRecord[],
  onRecordDeleted: () => void
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
    { value: 'tire_rotation', label: 'Tire Rotation' },
    { value: 'brake_inspection', label: 'Brake Inspection' },
    { value: 'air_filter', label: 'Air Filter' },
    { value: 'transmission_service', label: 'Transmission Service' },
    { value: 'coolant_flush', label: 'Coolant Flush' },
    { value: 'wipers', label: 'Wipers' },
    { value: 'registration', label: 'Registration' }
  ]

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
          <div className="grid md:grid-cols-4 gap-4">
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
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                    User
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
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
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
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
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className="text-xs text-gray-900 dark:text-white truncate">
                        {uniqueUsers.find(u => u.id === record.user_id)?.name?.split(' ')[0] || `User ${record.user_id?.slice(0, 6) || 'Unknown'}...`}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
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
                        onClick={() => setDeleteConfirm({
                          type: record.type,
                          id: record.id,
                          description: record.description
                        })}
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
function UserSettings({ cars, onCarDeleted }: { cars?: Car[], onCarDeleted?: () => void }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null)
  const [confirmDeleteCarId, setConfirmDeleteCarId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
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

  const isGoogleLinked = currentUser?.app_metadata?.providers?.includes('google')

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
    </div>
  )
}

export default function MileageTracker() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cars, setCars] = useState<Car[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [fillUps, setFillUps] = useState<FillUp[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  // Auth state is now managed by AuthComponent
  const [userIsOwner, setUserIsOwner] = useState(false)
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<'free' | 'personal' | 'business'>('free')
  const [maxVehicles, setMaxVehicles] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance' | 'records' | 'settings'>('add-car')
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

  // Auto-switch to dashboard when first car is added (for new users)
  useEffect(() => {
    if (cars.length > 0 && activeTab === 'add-car') {
      setActiveTab('dashboard')
    }
  }, [cars.length, activeTab])

  // Handle auth state changes from AuthComponent
  const handleAuthChange = useCallback(async (newUser: User | null) => {
    console.log('Auth state changed:', newUser ? `${newUser.email} (${newUser.id})` : 'null')
    setUser(newUser)
    setAuthLoading(false)
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

    setLoading(false)

    // Load data for the new user (or demo data if no user) - but don't await it
    loadData().catch(error => {
      console.error('Error loading data:', error)
    })
  }, [])

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

      // Initialize auth state
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const currentUser = session?.user ?? null
          setUser(currentUser)
          setUserIsOwner(currentUser ? isOwner(currentUser.id) : false)
        } catch (error) {
          console.error('Error getting session:', error)
          setUser(null)
          setUserIsOwner(false)
        }
      }

      // Always set loading to false after auth check
      setLoading(false)

      // Load initial data
      loadData().catch(console.error)
    }

    initializeAuth()
  }, [])

  const loadData = useCallback(async () => {
    try {
      if (!supabase) return

      // Load cars
      const carsResponse = await fetch('/api/cars', {
        credentials: 'include'
      })
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
      const fillUpsResponse = await fetch('/api/fill-ups?limit=50', {
        credentials: 'include'
      })
      if (fillUpsResponse.ok) {
        const { fillUps } = await fillUpsResponse.json()
        setFillUps(fillUps || [])
      }

      // Load maintenance records for alerts
      const maintenanceResponse = await fetch('/api/maintenance?limit=50', {
        credentials: 'include'
      })
      if (maintenanceResponse.ok) {
        const { maintenanceRecords } = await maintenanceResponse.json()
        setMaintenanceRecords(maintenanceRecords || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [])

  // Authentication is now handled by AuthComponent

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

  // Show loading while checking auth (but still render AuthComponent to trigger callback)
  if (authLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative flex items-center justify-center">
        <div className="hidden">
          <AuthComponent onAuthChange={handleAuthChange} />
        </div>
        <div className="text-white text-xl">Loading...</div>
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

      {/* Admin/Demo Mode Toggle Corner */}
      <div className="fixed bottom-6 right-6 z-50">
        {user && (
          <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-900 dark:text-white font-medium">
                Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </span>
              {isAdmin(user.id) && (
                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  ADMIN
                </span>
              )}
            </div>
            <button
              onClick={signOut}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Professional 3-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicle Info, Performance, and Maintenance */}
          {cars.length > 0 && (
            <div className="lg:col-span-1 space-y-6">
              {/* Vehicle Selector */}
              <div className="card-professional p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Selected Vehicle</h3>
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
              </div>

              {/* Performance Overview - Compact */}
              <div className="card-professional p-4">
                <h3 className="text-sm font-bold mb-3 text-gradient-primary">Performance Overview</h3>
                {stats && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                        </svg>
                      </div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.total_cars}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Cars</div>
                    </div>

                    <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.average_mpg}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">MPG</div>
                    </div>

                    <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 18v-2h2v-3h2v-2h6v2h2v3h2v2H5zM9 4v4l1.5 1L12 8l1.5 1L15 4V2H9v2z"/>
                          <circle cx="7" cy="16" r="1"/>
                          <circle cx="17" cy="16" r="1"/>
                          <path d="M12 8v3" stroke="white" strokeWidth="2" fill="none"/>
                        </svg>
                      </div>
                      <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.total_fill_ups}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Fill-ups</div>
                    </div>

                    <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                        </svg>
                      </div>
                      <div className="text-sm font-bold text-orange-600 dark:text-orange-400">${stats.total_spent}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Spent</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Maintenance Status - Dynamic */}
              <MaintenanceStatusGrid
                selectedCarId={selectedCarId}
                cars={cars}
                maintenanceRecords={maintenanceRecords}
                subscriptionPlan={userSubscriptionPlan}
                userId={user?.id || null}
              />
            </div>
          )}

          {/* Right Column - Navigation Tabs + Charts/Forms */}
          <div className={`${cars.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
              {/* Navigation Tabs */}
              <div className="flex space-x-1 glass-morphism rounded-xl p-1 shadow-elegant">
                {[
                  { id: 'dashboard', label: 'Graph', adminOnly: false },
                  { id: 'add-car', label: 'Add Car', adminOnly: false },
                  { id: 'add-fillup', label: 'Add Fill-up', adminOnly: false },
                  { id: 'add-maintenance', label: 'Maintenance', adminOnly: false },
                  { id: 'records', label: 'Records', adminOnly: false },
                  { id: 'settings', label: 'Settings', adminOnly: false }
                ].map((tab) => {
                  // Check if vehicle limit reached (only for Add Car tab)
                  const isVehicleLimitReached = tab.id === 'add-car' && cars.length >= maxVehicles

                  // Disable data tabs (Graph, Fill-up, Maintenance, Records) when no cars
                  const requiresCars = ['dashboard', 'add-fillup', 'add-maintenance', 'records'].includes(tab.id)
                  const isDisabledNoCars = requiresCars && cars.length === 0

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

                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isDisabled && setActiveTab(tab.id as 'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance' | 'records' | 'settings')}
                      disabled={isDisabled}
                      title={tooltipMessage}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 relative group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-elegant-lg'
                          : isDisabled
                          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
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
                  <AddFillUpForm cars={cars} onSuccess={() => { loadData(); setActiveTab('dashboard'); }} />
                </div>
              )}

              {/* Maintenance Tab - View/Edit based on subscription */}
              {activeTab === 'add-maintenance' && cars.length > 0 && (
                <>
                  {/* Maintenance Status Grid (visible to all) */}
                  <MaintenanceStatusGrid
                    selectedCarId={selectedCarId}
                    cars={cars}
                    maintenanceRecords={maintenanceRecords}
                    subscriptionPlan={subscriptionPlan}
                    userId={user?.id || null}
                  />

                  {/* Add Maintenance Form (Personal+ only) */}
                  {hasFeatureAccess(user?.id || null, subscriptionPlan, 'maintenance_tracking') ? (
                    <div className="card-professional p-6 mt-6">
                      <AddMaintenanceForm cars={cars} onSuccess={() => { loadData(); setActiveTab('dashboard'); }} />
                    </div>
                  ) : (
                    <div className="card-professional p-6 mt-6 relative">
                      {/* Grayed out preview of form */}
                      <div className="opacity-30 pointer-events-none">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Maintenance Record</h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle</label>
                            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                              <option>Select a vehicle...</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maintenance Type</label>
                            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                              <option>Select maintenance type...</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Paywall overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg">
                        <div className="text-center px-6 max-w-md">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Maintenance Tracking Locked
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Upgrade to <span className="font-semibold text-blue-600 dark:text-blue-400">Personal</span> or <span className="font-semibold text-purple-600 dark:text-purple-400">Business</span> to add and track maintenance records
                          </p>
                          <Link
                            href="/pricing"
                            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            View Pricing
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Records Management */}
              {activeTab === 'records' && (
                <div className="card-professional p-6">
                  <RecordsManager
                    cars={cars}
                    fillUps={fillUps}
                    maintenanceRecords={maintenanceRecords}
                    onRecordDeleted={() => loadData()}
                  />
                </div>
              )}

              {/* User Settings */}
              {activeTab === 'settings' && (
                <div className="card-professional p-6">
                  <UserSettings cars={cars} onCarDeleted={() => loadData()} />
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

// Add Fill-up Form Component
function AddFillUpForm({ cars, onSuccess }: { cars: Car[], onSuccess: () => void }) {
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

  const maintenanceTypes = [
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'tire_rotation', label: 'Tire Rotation' },
    { value: 'brake_inspection', label: 'Brake Inspection' },
    { value: 'air_filter', label: 'Air Filter' },
    { value: 'transmission_service', label: 'Transmission Service' },
    { value: 'coolant_flush', label: 'Coolant Flush' },
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
        // Reset form to initial state
        setFormData({
          car_id: cars[0]?.id || '',
          date: new Date().toISOString().split('T')[0],
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