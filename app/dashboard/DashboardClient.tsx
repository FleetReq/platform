'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase, type Car, type FillUp, type MaintenanceRecord, isOwner } from '@/lib/supabase-client'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'
import { MAINTENANCE_INTERVALS, getMaintenanceStatus, getLatestMaintenanceRecord } from '@/lib/maintenance'
import { MAINTENANCE_TYPES, MAINTENANCE_TYPE_FILTER_OPTIONS, getStatusColor, getStatusTextColor, getIrsRate, DASHBOARD_RECORDS_LIMIT, RECORDS_PER_PAGE, type MaintenanceStatus } from '@/lib/constants'
import BackgroundAnimation from '../components/BackgroundAnimation'
import RecordDetailModal from '../../components/RecordDetailModal'
import OrgManagement from '@/components/OrgManagement'
import AddCarForm from '@/components/forms/AddCarForm'
import AddFillUpForm from '@/components/forms/AddFillUpForm'
import AddTripForm from '@/components/forms/AddTripForm'
import AddMaintenanceForm from '@/components/forms/AddMaintenanceForm'
import type { User } from '@supabase/supabase-js'
import UserSettings from '@/components/UserSettings'
import FuelChartPanel from '@/components/FuelChartPanel'

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
}: {
  selectedCarId: string | null,
  cars: Car[],
  maintenanceRecords: MaintenanceRecord[],
  subscriptionPlan: 'free' | 'personal' | 'business',
}) {
  const [showUntracked, setShowUntracked] = useState(false)

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

  // All tiers can view maintenance status (🟢/🔴). Adding/editing records is
  // gated on the add-maintenance form, not here.
  const hasMaintenanceAccess = true

  const maintenanceTypes = MAINTENANCE_TYPES

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
        className={`border-l-4 p-2 rounded-r-lg ${dimmed ? 'border-gray-300 dark:border-gray-600 bg-gray-100/60 dark:bg-gray-800/30' : getStatusColor(status as MaintenanceStatus)}`}
      >
        <div className="flex items-center">
          <span className={`text-sm mr-2 ${dimmed ? 'opacity-50' : ''}`}>{icon}</span>
          <span className={`text-xs font-semibold ${dimmed ? 'text-gray-400 dark:text-gray-500' : getStatusTextColor(status as MaintenanceStatus)}`}>
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
                    className="border-l-4 p-2 rounded-r-lg border-green-500 bg-green-200 dark:bg-green-900/20"
                  >
                    <div className="flex items-center">
                      <span className="text-sm mr-2">{icon}</span>
                      <span className="text-xs font-semibold text-green-700 dark:text-green-300">
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
                href="/pricing#family"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-lg transition-colors"
              >
                Upgrade to Family - $4/mo
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
  const [deleteError, setDeleteError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<{ type: 'fillup' | 'maintenance', record: FillUp | MaintenanceRecord, car: Car } | null>(null)
  const recordsPerPage = RECORDS_PER_PAGE

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
      return { id: userId, name: isOwner(userId) ? 'Owner' : `User ${userId?.slice(0, 8) || 'Unknown'}...` }
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
    setDeleteError('')
    try {
      const endpoint = type === 'fillup' ? '/api/fill-ups' : '/api/maintenance'
      const response = await fetchWithTimeout(`${endpoint}/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteConfirm(null)
        onRecordDeleted() // Call the callback to refresh data
      } else {
        setDeleteError('Failed to delete record')
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      setDeleteError('Failed to delete record')
    }
  }

  const maintenanceTypeOptions = MAINTENANCE_TYPE_FILTER_OPTIONS

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
              <label htmlFor="records-search" className="sr-only">Search records</label>
              <input
                id="records-search"
                type="text"
                placeholder="Search by service type, description, notes, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
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
                  onBlur={() => setShowUserDropdown(false)}
                  className="w-full px-4 py-2 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white pr-10"
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
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleUserSelect('all')}
                    >
                      <span className="text-sm text-gray-900 dark:text-white">All Users</span>
                    </div>
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()}
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
                className="input-field"
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
                className="input-field"
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
                  className="input-field"
                >
                  {maintenanceTypeOptions.map(type => (
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
                        aria-label="Delete record"
                        className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
              {searchTerm || recordType !== 'all' || maintenanceType !== 'all' || selectedCarId !== 'all' ? (
                <div>
                  <p className="mb-3">No records match your current filters.</p>
                  <button
                    onClick={() => { setSearchTerm(''); setRecordType('all'); setMaintenanceType('all'); setSelectedCarId('all'); }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <p>No records yet. Add a fill-up or maintenance record to get started.</p>
              )}
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
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onKeyDown={(e) => e.key === 'Escape' && setDeleteConfirm(null)}
          tabIndex={-1}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-xl"
          >
            <h3 id="delete-modal-title" className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this record?
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-6">
              {deleteConfirm.description}
            </p>
            {deleteError && (
              <p role="alert" className="text-red-600 dark:text-red-400 text-sm mb-4">{deleteError}</p>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteError(''); }}
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
  const [errorMessage, setErrorMessage] = useState('')

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
      const response = await fetchWithTimeout('/api/cars', {
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
        setErrorMessage('')
      } else {
        setErrorMessage('Failed to update mileage')
      }
    } catch (error) {
      console.error('Error updating mileage:', error)
      setErrorMessage('Failed to update mileage')
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
      <div className="space-y-1">
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
            aria-label="Save mileage"
            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            aria-label="Cancel editing"
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>
        {errorMessage && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-xs">{errorMessage}</p>
        )}
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

// Car Detail Editor Component
function CarDetailEditor({ carId, cars, onUpdate }: { carId: string, cars: Car[], onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const selectedCar = cars.find(car => car.id === carId)

  const [form, setForm] = useState({
    make: '', model: '', year: '', color: '', license_plate: '', nickname: ''
  })

  useEffect(() => {
    if (selectedCar) {
      setForm({
        make: selectedCar.make || '',
        model: selectedCar.model || '',
        year: selectedCar.year?.toString() || '',
        color: selectedCar.color || '',
        license_plate: selectedCar.license_plate || '',
        nickname: selectedCar.nickname || '',
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: listing specific props avoids re-running when parent re-renders and cars.find() returns a new object reference with the same data
  }, [selectedCar?.id, selectedCar?.make, selectedCar?.model, selectedCar?.year, selectedCar?.color, selectedCar?.license_plate, selectedCar?.nickname])

  if (!selectedCar) return null

  const handleSave = async () => {
    if (!form.make.trim() || !form.model.trim() || !form.year.trim()) {
      setErrorMessage('Make, model, and year are required')
      return
    }
    setErrorMessage('')
    setLoading(true)
    try {
      const response = await fetchWithTimeout('/api/cars', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId,
          make: form.make.trim(),
          model: form.model.trim(),
          year: parseInt(form.year),
          color: form.color.trim() || null,
          license_plate: form.license_plate.trim() || null,
          nickname: form.nickname.trim() || null,
        })
      })
      if (response.ok) {
        onUpdate()
        setEditing(false)
        setErrorMessage('')
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to update vehicle')
      }
    } catch (err) {
      console.error('[Dashboard] Vehicle update failed:', err)
      setErrorMessage('Failed to update vehicle')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setForm({
      make: selectedCar.make || '',
      model: selectedCar.model || '',
      year: selectedCar.year?.toString() || '',
      color: selectedCar.color || '',
      license_plate: selectedCar.license_plate || '',
      nickname: selectedCar.nickname || '',
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">Make *</label>
            <input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">Model *</label>
            <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">Year *</label>
            <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">Color</label>
            <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">Plate</label>
            <input value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">Nickname</label>
            <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        {errorMessage && (
          <p role="alert" className="text-red-600 dark:text-red-400 text-xs">{errorMessage}</p>
        )}
        <div className="flex space-x-2">
          <button onClick={handleSave} disabled={loading}
            className="flex-1 px-2 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleCancel} disabled={loading}
            className="flex-1 px-2 py-1.5 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Vehicle Details</span>
        <button onClick={() => setEditing(true)}
          className="px-2 py-0.5 text-[10px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors">
          Edit
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div><span className="text-gray-500 dark:text-gray-400">Year:</span> <span className="text-gray-900 dark:text-white">{selectedCar.year}</span></div>
        <div><span className="text-gray-500 dark:text-gray-400">Make:</span> <span className="text-gray-900 dark:text-white">{selectedCar.make}</span></div>
        <div><span className="text-gray-500 dark:text-gray-400">Model:</span> <span className="text-gray-900 dark:text-white">{selectedCar.model}</span></div>
        {selectedCar.color && <div><span className="text-gray-500 dark:text-gray-400">Color:</span> <span className="text-gray-900 dark:text-white">{selectedCar.color}</span></div>}
        {selectedCar.license_plate && <div><span className="text-gray-500 dark:text-gray-400">Plate:</span> <span className="text-gray-900 dark:text-white">{selectedCar.license_plate}</span></div>}
        {selectedCar.nickname && <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">Nickname:</span> <span className="text-gray-900 dark:text-white">{selectedCar.nickname}</span></div>}
      </div>
    </div>
  )
}


const VALID_TABS = ['overview', 'dashboard', 'add-car', 'add-fillup', 'add-trip', 'add-maintenance', 'records', 'settings'] as const

interface DashboardClientProps {
  initialUser: User
  initialOrgRole: 'owner' | 'editor' | 'viewer'
  initialSubscriptionPlan: 'free' | 'personal' | 'business'
  initialMaxVehicles: number
  initialCars: Car[]
  initialFillUps: FillUp[]
  initialMaintenanceRecords: MaintenanceRecord[]
}

export default function DashboardClient({
  initialUser,
  initialOrgRole,
  initialSubscriptionPlan,
  initialMaxVehicles,
  initialCars,
  initialFillUps,
  initialMaintenanceRecords,
}: DashboardClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(initialUser)
  const [cars, setCars] = useState<Car[]>(initialCars)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [fillUps, setFillUps] = useState<FillUp[]>(initialFillUps)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(initialMaintenanceRecords)
  const [loading, setLoading] = useState(false)
  const userIsOwner = isOwner(initialUser.id)
  const userOrgRole = initialOrgRole
  const userSubscriptionPlan = initialSubscriptionPlan
  const maxVehicles = initialMaxVehicles
  const [allOrgs, setAllOrgs] = useState<{org_id: string, org_name: string, role: string, subscription_plan: string}[]>([])
  const [allOrgsLoadError, setAllOrgsLoadError] = useState(false)
  const [leavingOrgId, setLeavingOrgId] = useState<string | null>(null)
  const [leaveOrgError, setLeaveOrgError] = useState<string>('')
  const [pendingLeaveOrgId, setPendingLeaveOrgId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance' | 'add-trip' | 'records' | 'settings'>('overview')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const carPrefLoaded = useRef(false)

  // Read ?tab= URL param to allow navigation from hamburger menu
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && VALID_TABS.includes(tabParam as typeof VALID_TABS[number])) {
      setActiveTab(tabParam as typeof activeTab)
    }
  }, [searchParams])

  // Initialize selectedCarId from saved preference or first car (runs once on first car load)
  useEffect(() => {
    if (cars.length === 0 || !supabase || carPrefLoaded.current) return
    carPrefLoaded.current = true
    const initCarSelection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSelectedCarId(cars[0].id); return }
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('default_car_id')
          .eq('id', user.id)
          .maybeSingle()
        const savedId = profile?.default_car_id
        const valid = savedId ? cars.find(c => c.id === savedId) : null
        setSelectedCarId(valid ? savedId as string : cars[0].id)
      } catch (err) {
        console.error('[Dashboard] Failed to restore vehicle selection:', err)
        setSelectedCarId(cars[0].id)
      }
    }
    initCarSelection()
  }, [cars])

  // Fetch all orgs when settings tab is opened (for Leave Organization section)
  useEffect(() => {
    if (activeTab !== 'settings') return
    const loadOrgs = async () => {
      setAllOrgsLoadError(false)
      try {
        const r = await fetchWithTimeout('/api/org?all=true')
        if (r.ok) {
          const data = await r.json()
          if (data?.orgs) setAllOrgs(data.orgs)
        } else if (r.status !== 401) {
          console.error('[Settings] Failed to load organizations, status:', r.status)
        }
      } catch (err) {
        console.error('[Settings] Failed to load organizations:', err)
        setAllOrgsLoadError(true)
      }
    }
    loadOrgs()
  }, [activeTab])

  // Listen for sign-out and fetch initial stats on mount
  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') router.replace('/login')
      // Keep local user state in sync if token refreshes
      if (event === 'TOKEN_REFRESHED' && session?.user) setUser(session.user)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- intentional: mount-only, deps would cause infinite loop

  // Fetch stats on mount (stats aren't pre-loaded by the server component)
  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- intentional: mount-only; supabase is a module singleton and React state setters are guaranteed stable

  const loadData = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setLoading(true)
    try {
      if (!supabase) return

      // Fetch ALL data concurrently — allSettled prevents one slow/failing endpoint
      // from taking down the entire dashboard load
      const [carsResult, statsResult, fillUpsResult, maintenanceResult] = await Promise.allSettled([
        fetchWithTimeout('/api/cars', { credentials: 'include' }),
        fetchWithTimeout('/api/stats'),
        fetchWithTimeout(`/api/fill-ups?limit=${DASHBOARD_RECORDS_LIMIT}`, { credentials: 'include' }),
        fetchWithTimeout(`/api/maintenance?limit=${DASHBOARD_RECORDS_LIMIT}`, { credentials: 'include' })
      ])

      const carsResponse = carsResult.status === 'fulfilled' ? carsResult.value : null
      const statsResponse = statsResult.status === 'fulfilled' ? statsResult.value : null
      const fillUpsResponse = fillUpsResult.status === 'fulfilled' ? fillUpsResult.value : null
      const maintenanceResponse = maintenanceResult.status === 'fulfilled' ? maintenanceResult.value : null

      // 401 means the session expired — redirect to login rather than showing empty data
      if (carsResponse?.status === 401 || fillUpsResponse?.status === 401 || maintenanceResponse?.status === 401) {
        router.replace('/login')
        return
      }

      // Extract data
      const carsData = carsResponse?.ok ? (await carsResponse.json()).cars || [] : []
      const statsData = statsResponse?.ok ? (await statsResponse.json()).stats : null
      const fillUpsData = fillUpsResponse?.ok ? (await fillUpsResponse.json()).fillUps || [] : []
      const maintenanceData = maintenanceResponse?.ok ? (await maintenanceResponse.json()).maintenanceRecords || [] : []

      // Set ALL state in one batch - React will batch these updates
      setCars(carsData)
      setStats(statsData)
      setFillUps(fillUpsData)
      setMaintenanceRecords(maintenanceData)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [router])


  // Show loading overlay during mutation-triggered refreshes (mileage update, vehicle edit, etc.)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Skeleton layout hint */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
            <div className="space-y-6">
              <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
              <div className="h-56 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
              <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
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

        {loadError && (
          <div role="alert" className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
            <span>Failed to load your data. Please refresh the page.</span>
            <button onClick={() => window.location.reload()} className="ml-4 text-sm underline font-medium">Refresh</button>
          </div>
        )}

        {/* Professional 3-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicle Info, Performance, and Maintenance */}
          {/* On mobile: only show on Overview tab (other tabs show content directly without scrolling past) */}
          <div className={`lg:col-span-1 space-y-6 ${activeTab === 'overview' ? '' : 'hidden lg:block'}`}>
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
                    onChange={(e) => {
                      const newCarId = e.target.value || null
                      setSelectedCarId(newCarId)
                      fetchWithTimeout('/api/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ default_car_id: newCarId }),
                      }).catch((err) => console.error('[Dashboard] Failed to persist default car:', err))
                    }}
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
                    {/* Vehicle Detail Editor (hidden for viewers) */}
                    {userOrgRole !== 'viewer' && (
                      <CarDetailEditor
                        carId={selectedCarId}
                        cars={cars}
                        onUpdate={loadData}
                      />
                    )}
                  </div>
                )}
                </>
              )}
            </div>

            {/* Performance Overview - Dual Panel Design */}
            <div className="card-professional p-4 space-y-3 overflow-hidden">
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
                      <div className="text-center p-2 bg-orange-200 dark:bg-orange-900/20 border border-orange-400 dark:border-orange-800/30 rounded min-w-0">
                        <div className="text-xs font-bold text-orange-700 dark:text-orange-400 truncate">${stats.cost_per_mile.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">Cost/Mile</div>
                      </div>
                      <div className="text-center p-2 bg-purple-200 dark:bg-purple-900/20 border border-purple-400 dark:border-purple-800/30 rounded min-w-0">
                        <div className="text-xs font-bold text-purple-700 dark:text-purple-400 truncate">${stats.this_month_total_cost.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">This Month</div>
                      </div>
                      <div className="text-center p-2 bg-emerald-200 dark:bg-emerald-900/20 border border-emerald-400 dark:border-emerald-800/30 rounded min-w-0">
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">${Math.round((stats.total_spent + stats.total_maintenance_cost) * 100) / 100}</div>
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
                      {userSubscriptionPlan !== 'business' && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>

                    {/* Show metrics for Business only, locked overlay for Free/Family */}
                    {userSubscriptionPlan === 'business' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-gray-200 dark:bg-gray-700/20 border border-gray-400 dark:border-gray-600/30 rounded min-w-0">
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">${stats.ytd_total_cost.toFixed(2)}</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">YTD Total</div>
                          </div>
                          <div className="text-center p-2 bg-green-200 dark:bg-green-900/20 border border-green-400 dark:border-green-800/30 rounded min-w-0">
                            <div className="text-xs font-bold text-green-700 dark:text-green-400 truncate">${Math.round(stats.business_miles * CURRENT_IRS_RATE).toLocaleString()}</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">Tax Deduction</div>
                          </div>
                          <div className="text-center p-2 bg-blue-200 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-800/30 rounded min-w-0">
                            <div className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">{stats.business_percentage}%</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">Business</div>
                          </div>
                        </div>
                        <div className="text-center p-2 bg-emerald-200 dark:bg-emerald-900/20 border border-emerald-400 dark:border-emerald-800/30 rounded">
                          <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Business Miles (YTD)</div>
                          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{stats.business_miles.toLocaleString()}</div>
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-400 text-center bg-amber-200 dark:bg-amber-900/20 rounded p-1.5 border border-amber-400 dark:border-amber-800">
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
                            <div className="text-center p-2 bg-gray-200 dark:bg-gray-700/20 border border-gray-400 dark:border-gray-600/30 rounded min-w-0">
                              <div className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">12,450</div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">Miles Tracked</div>
                            </div>
                            <div className="text-center p-2 bg-blue-200 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-800/30 rounded min-w-0">
                              <div className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">$8,715</div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">Potential Ded.</div>
                            </div>
                            <div className="text-center p-2 bg-orange-200 dark:bg-orange-900/20 border border-orange-400 dark:border-orange-800/30 rounded min-w-0">
                              <div className="text-xs font-bold text-orange-700 dark:text-orange-400 truncate">$0.45</div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">$/Mile</div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Link
                            href="/pricing#family"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-lg transition-colors"
                          >
                            Upgrade to Family - $4/mo
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
              />
            )}
          </div>

          {/* Right Column - Navigation Tabs + Charts/Forms */}
          <div className="lg:col-span-2 space-y-6 relative pb-24 sm:pb-0">
              {/* Navigation Tabs - hidden on mobile (bottom tab bar used instead) */}
              <div className="relative z-50 hidden sm:flex gap-1 glass-morphism rounded-xl p-1 shadow-elegant">
                {[
                  { id: 'dashboard', label: 'Graph', adminOnly: false, requiresEdit: false },
                  { id: 'add-car', label: 'Add Car', adminOnly: false, requiresEdit: true },
                  { id: 'add-fillup', label: 'Add Fill-up', adminOnly: false, requiresEdit: true },
                  { id: 'add-trip', label: 'Add Trip', adminOnly: false, requiresEdit: true },
                  { id: 'add-maintenance', label: 'Maintenance', adminOnly: false, requiresEdit: true },
                  { id: 'records', label: 'Records', adminOnly: false, requiresEdit: false },
                  { id: 'settings', label: 'Settings', adminOnly: false, requiresEdit: false }
                ].map((tab) => {
                  // Check if vehicle limit reached (only for Add Car tab)
                  const isVehicleLimitReached = tab.id === 'add-car' && cars.length >= maxVehicles

                  // Viewers can't access edit tabs
                  const isViewerBlocked = tab.requiresEdit && userOrgRole === 'viewer'

                  // All tabs are now accessible - they show empty states if no cars exist
                  // Only disable based on admin access, vehicle limit, or viewer role
                  const isDisabledNoCars = false // Removed: all tabs accessible with empty states

                  const isDisabled = (tab.adminOnly && !userIsOwner) || isVehicleLimitReached || isDisabledNoCars || isViewerBlocked
                  const isActive = activeTab === tab.id || (tab.id === 'dashboard' && activeTab === 'overview')

                  // Show vehicle count for Add Car tab
                  const tabLabel = tab.id === 'add-car'
                    ? `${tab.label} (${cars.length}/${maxVehicles})`
                    : tab.label

                  // Determine tooltip message
                  let tooltipMessage = ''
                  if (isViewerBlocked) {
                    tooltipMessage = 'View-only access — ask your org owner for editor permissions'
                  } else if (isDisabledNoCars) {
                    tooltipMessage = 'Add a vehicle first'
                  } else if (isVehicleLimitReached) {
                    tooltipMessage = 'Vehicle limit reached - Upgrade to add more'
                  } else if (tab.adminOnly && !userIsOwner) {
                    tooltipMessage = 'Admin access required'
                  }

                  // Add gold ring for Add Car tab when tutorial is showing (no pulsing)
                  const showTutorial = cars.length === 0 && activeTab !== 'add-car'
                  const shouldHighlight = showTutorial && tab.id === 'add-car'

                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isDisabled && setActiveTab(tab.id as 'overview' | 'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance' | 'records' | 'settings')}
                      disabled={isDisabled}
                      title={tooltipMessage}
                      className={`py-2 px-2 sm:px-3 text-center sm:flex-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 relative group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-elegant-lg'
                          : isDisabled
                          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                      } ${
                        shouldHighlight
                          ? 'ring-4 ring-amber-400 dark:ring-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                          : ''
                      }`}
                    >
                      {tabLabel}
                      {isDisabled && tooltipMessage && (
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                          {tooltipMessage}
                        </div>
                      )}
                      {shouldHighlight && (
                        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none whitespace-nowrap">
                          <div className="relative inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl px-6 py-4 shadow-2xl animate-bounce-gentle">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-transparent border-b-blue-500"></div>
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
                    </button>
                  )
                })}
              </div>

              {/* Dashboard - Fuel Efficiency Analytics */}
              {(activeTab === 'dashboard' || activeTab === 'overview') && (
                <div className={`card-professional ${activeTab === 'overview' ? 'hidden lg:block' : ''}`}>
                  <FuelChartPanel fillUps={fillUps} onAddFillUp={() => setActiveTab('add-fillup')} />
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
                    <AddCarForm onSuccess={() => { loadData(true); setActiveTab('dashboard'); }} />
                  )}
                </div>
              )}

              {/* Add Fill-up Form */}
              {activeTab === 'add-fillup' && cars.length > 0 && (
                <div className="card-professional p-6">
                  <AddFillUpForm cars={cars} onSuccess={() => { loadData(true); setActiveTab('dashboard'); }} subscriptionPlan={userSubscriptionPlan} userId={user?.id || ''} />
                </div>
              )}

              {/* Trip Tab - Add Trip Form */}
              {activeTab === 'add-trip' && cars.length > 0 && (
                <div className="card-professional p-6">
                  <AddTripForm cars={cars} onSuccess={() => { loadData(true); setActiveTab('dashboard'); }} />
                </div>
              )}

              {/* Maintenance Tab - Add Maintenance Form */}
              {activeTab === 'add-maintenance' && cars.length > 0 && (
                <div className="card-professional p-6">
                  <AddMaintenanceForm
                    cars={cars}
                    onSuccess={() => { loadData(true); setActiveTab('dashboard'); }}
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
                    onRecordDeleted={() => loadData(true)}
                    userId={user?.id || ''}
                    subscriptionPlan={userSubscriptionPlan}
                  />
                </div>
              )}

              {/* User Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="card-professional p-6">
                    <UserSettings cars={cars} onCarDeleted={() => loadData(true)} initialSubscriptionPlan={userSubscriptionPlan} orgRole={userOrgRole} />
                  </div>
                  {userSubscriptionPlan !== 'free' && <OrgManagement />}
                  {/* Leave Organization — shown only for non-owner memberships */}
                  {allOrgsLoadError && (
                    <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                      Could not load organization list. Please refresh to try again.
                    </p>
                  )}
                  {!allOrgsLoadError && allOrgs.filter(o => o.role !== 'owner').length > 0 && (
                    <div className="card-professional p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Other Organizations</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Organizations you&apos;ve joined via invitation. You can leave at any time — the owner can reinvite you.
                      </p>
                      <div className="space-y-3">
                        {leaveOrgError && (
                          <p role="alert" className="text-sm text-red-600 dark:text-red-400">{leaveOrgError}</p>
                        )}
                        {allOrgs.filter(o => o.role !== 'owner').map(org => (
                          <div key={org.org_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{org.org_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{org.role} · {org.subscription_plan}</p>
                            </div>
                            {pendingLeaveOrgId === org.org_id ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Leave?</span>
                                <button
                                  disabled={leavingOrgId === org.org_id}
                                  onClick={async () => {
                                    setPendingLeaveOrgId(null)
                                    setLeaveOrgError('')
                                    setLeavingOrgId(org.org_id)
                                    try {
                                      const res = await fetchWithTimeout('/api/org/leave', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ org_id: org.org_id }),
                                      })
                                      if (res.ok) {
                                        window.location.reload()
                                      } else {
                                        const data = await res.json()
                                        setLeaveOrgError(data.error || 'Failed to leave organization')
                                      }
                                    } catch (err) {
                                      console.error('[Dashboard] Failed to leave organization:', err)
                                      setLeaveOrgError('Failed to leave organization. Please try again.')
                                    } finally {
                                      setLeavingOrgId(null)
                                    }
                                  }}
                                  className="text-red-600 dark:text-red-400 font-medium hover:underline disabled:opacity-50"
                                >
                                  {leavingOrgId === org.org_id ? 'Leaving...' : 'Yes, leave'}
                                </button>
                                <button
                                  onClick={() => setPendingLeaveOrgId(null)}
                                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                disabled={leavingOrgId === org.org_id}
                                onClick={() => setPendingLeaveOrgId(org.org_id)}
                                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Leave
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* Mobile Bottom Tab Bar */}
      <MobileBottomTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        carsCount={cars.length}
        maxVehicles={maxVehicles}
      />
    </div>
  )
}

// Mobile Bottom Tab Bar - fixed bottom navigation visible only on mobile
function MobileBottomTabBar({
  activeTab,
  setActiveTab,
  carsCount,
  maxVehicles,
}: {
  activeTab: string
  setActiveTab: (tab: 'overview' | 'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance' | 'add-trip' | 'records' | 'settings') => void
  carsCount: number
  maxVehicles: number
}) {
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!addMenuOpen) return
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [addMenuOpen])

  const isAddActive = activeTab === 'add-car' || activeTab === 'add-fillup' || activeTab === 'add-trip' || activeTab === 'add-maintenance'
  const isVehicleLimitReached = carsCount >= maxVehicles

  const switchTab = (tab: 'overview' | 'dashboard' | 'add-car' | 'add-fillup' | 'add-maintenance' | 'add-trip' | 'records' | 'settings') => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddOption = (tab: 'add-car' | 'add-fillup' | 'add-trip' | 'add-maintenance') => {
    switchTab(tab)
    setAddMenuOpen(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      <div
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {/* Overview */}
          <button
            onClick={() => switchTab('overview')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Overview</span>
          </button>

          {/* Graph */}
          <button
            onClick={() => switchTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'dashboard' || activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Graph</span>
          </button>

          {/* Add (center, with popup) */}
          <div className="relative flex-1 flex justify-center" ref={addMenuRef}>
            <button
              onClick={() => setAddMenuOpen(!addMenuOpen)}
              aria-expanded={addMenuOpen}
              aria-haspopup="menu"
              aria-label="Add new record"
              className="flex flex-col items-center justify-center py-1"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                isAddActive || addMenuOpen
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${
                isAddActive || addMenuOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>Add</span>
            </button>

            {/* Add popup menu */}
            {addMenuOpen && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-visible min-w-[170px]">
                <div className="overflow-hidden rounded-2xl">
                  <button
                    onClick={() => handleAddOption('add-car')}
                    disabled={isVehicleLimitReached}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25" />
                    </svg>
                    Car{isVehicleLimitReached ? ` (${carsCount}/${maxVehicles})` : ''}
                  </button>
                  <button
                    onClick={() => handleAddOption('add-fillup')}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-t border-gray-100 dark:border-gray-700/50"
                  >
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                    Fill-up
                  </button>
                  <button
                    onClick={() => handleAddOption('add-trip')}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-t border-gray-100 dark:border-gray-700/50"
                  >
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    Trip
                  </button>
                  <button
                    onClick={() => handleAddOption('add-maintenance')}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-t border-gray-100 dark:border-gray-700/50"
                  >
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
                    </svg>
                    Maintenance
                  </button>
                </div>
                {/* Arrow pointing down to Add button */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-transparent border-t-white dark:border-t-gray-800"></div>
              </div>
            )}
          </div>

          {/* Records */}
          <button
            onClick={() => switchTab('records')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'records' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Records</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => switchTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}


