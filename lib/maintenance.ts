/**
 * Shared maintenance logic used by both the dashboard UI and the
 * maintenance-notifications cron job. Pure TypeScript — no React or browser deps.
 */

import { MAINTENANCE_TYPES } from '@/lib/constants'
import type { MaintenanceRecord } from './supabase-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MaintenanceInterval {
  months?: number
  miles?: number
  yellowThreshold?: number // percentage (0.75 = 75%)
  redThreshold?: number   // percentage (1.0 = 100%)
}

export type MaintenanceStatus = 'good' | 'warning' | 'overdue' | 'unknown'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAINTENANCE_INTERVALS: Record<string, MaintenanceInterval> = {
  oil_change: { months: 6, miles: 5000, yellowThreshold: 0.8, redThreshold: 1.0 },
  tire_rotation: { months: 6, miles: 7500, yellowThreshold: 0.8, redThreshold: 1.0 },
  tire_change: { months: 48, miles: 50000, yellowThreshold: 0.8, redThreshold: 1.0 },
  brake_pads: { months: 12, miles: 40000, yellowThreshold: 0.8, redThreshold: 1.0 },
  rotors: { months: 24, miles: 60000, yellowThreshold: 0.8, redThreshold: 1.0 },
  air_filter: { months: 12, miles: 15000, yellowThreshold: 0.8, redThreshold: 1.0 },
  transmission_service: { months: 24, miles: 30000, yellowThreshold: 0.8, redThreshold: 1.0 },
  coolant_flush: { months: 24, miles: 30000, yellowThreshold: 0.8, redThreshold: 1.0 },
  brake_fluid_flush: { months: 24, yellowThreshold: 0.8, redThreshold: 1.0 },
  spark_plugs: { months: 36, miles: 30000, yellowThreshold: 0.8, redThreshold: 1.0 },
  battery: { months: 48, yellowThreshold: 0.8, redThreshold: 1.0 },
  cabin_air_filter: { months: 12, miles: 15000, yellowThreshold: 0.8, redThreshold: 1.0 },
  serpentine_belt: { months: 60, miles: 60000, yellowThreshold: 0.8, redThreshold: 1.0 },
  differential_fluid: { months: 36, miles: 30000, yellowThreshold: 0.8, redThreshold: 1.0 },
  wipers: { months: 12, yellowThreshold: 0.75, redThreshold: 1.0 },
  registration: { months: 24, yellowThreshold: 0.9, redThreshold: 1.0 },
}

// Derived from MAINTENANCE_TYPES — single source of truth.
// Adding a new maintenance type only requires updating lib/constants.ts.
export const MAINTENANCE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  MAINTENANCE_TYPES.map(t => [t.key, t.label])
)

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export function getMaintenanceStatus(
  maintenanceType: string,
  lastMaintenanceRecord: MaintenanceRecord | null,
  currentMileage: number | null,
  subscriptionTier: 'free' | 'personal' | 'business' = 'free'
): MaintenanceStatus {
  const interval = MAINTENANCE_INTERVALS[maintenanceType]
  if (!interval) return 'unknown'

  if (!lastMaintenanceRecord) return 'unknown'

  const today = new Date()
  let timeStatus: MaintenanceStatus = 'good'
  let mileageStatus: MaintenanceStatus = 'good'

  // Priority 1: Check user-specified next service date (Personal+ only)
  if (lastMaintenanceRecord.next_service_date && subscriptionTier !== 'free') {
    const nextServiceDate = new Date(lastMaintenanceRecord.next_service_date)
    const daysUntilService = (nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)

    if (daysUntilService <= 0) {
      timeStatus = 'overdue'
    } else if (daysUntilService <= 30) {
      timeStatus = 'warning'
    }
  } else if (interval.months) {
    // Fallback: Use default time interval
    const lastDate = new Date(lastMaintenanceRecord.date)
    const monthsElapsed = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    const timeProgress = monthsElapsed / interval.months

    if (timeProgress >= (interval.redThreshold || 1.0)) {
      timeStatus = 'overdue'
    } else if (timeProgress >= (interval.yellowThreshold || 0.8) && subscriptionTier !== 'free') {
      timeStatus = 'warning'
    }
  }

  // Priority 2: Check user-specified next service mileage (Personal+ only)
  if (lastMaintenanceRecord.next_service_mileage && currentMileage !== null && subscriptionTier !== 'free') {
    const milesUntilService = lastMaintenanceRecord.next_service_mileage - currentMileage

    if (milesUntilService <= 0) {
      mileageStatus = 'overdue'
    } else if (milesUntilService <= 1000) {
      mileageStatus = 'warning'
    }
  } else if (interval.miles && lastMaintenanceRecord.mileage != null && currentMileage !== null) {
    // Fallback: Use default mileage interval
    const mileageElapsed = currentMileage - lastMaintenanceRecord.mileage
    const mileageProgress = mileageElapsed / interval.miles

    if (mileageProgress >= (interval.redThreshold || 1.0)) {
      mileageStatus = 'overdue'
    } else if (mileageProgress >= (interval.yellowThreshold || 0.8) && subscriptionTier !== 'free') {
      mileageStatus = 'warning'
    }
  }

  // Return the most urgent status
  if (timeStatus === 'overdue' || mileageStatus === 'overdue') {
    return 'overdue'
  } else if (timeStatus === 'warning' || mileageStatus === 'warning') {
    return 'warning'
  }

  return 'good'
}

/**
 * Returns a human-readable detail string for a maintenance item,
 * e.g. "12,000 mi overdue · 3 months overdue" or "500 mi remaining · 15 days remaining".
 */
export function getMaintenanceDetail(
  maintenanceType: string,
  lastMaintenanceRecord: MaintenanceRecord | null,
  currentMileage: number | null,
  subscriptionTier: 'free' | 'personal' | 'business' = 'free'
): string {
  const interval = MAINTENANCE_INTERVALS[maintenanceType]
  if (!interval || !lastMaintenanceRecord) return ''

  const today = new Date()
  const parts: string[] = []

  // --- Time detail ---
  if (lastMaintenanceRecord.next_service_date && subscriptionTier !== 'free') {
    const nextDate = new Date(lastMaintenanceRecord.next_service_date)
    const daysLeft = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) {
      parts.push(`${Math.abs(daysLeft)} days overdue`)
    } else {
      parts.push(`${daysLeft} days remaining`)
    }
  } else if (interval.months) {
    const lastDate = new Date(lastMaintenanceRecord.date)
    const monthsElapsed = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    const monthsRemaining = interval.months - monthsElapsed

    if (monthsRemaining <= 0) {
      const overdue = Math.abs(monthsRemaining)
      if (overdue < 1) {
        parts.push(`${Math.round(overdue * 30)} days overdue`)
      } else {
        parts.push(`${Math.round(overdue)} mo overdue`)
      }
    } else {
      if (monthsRemaining < 1) {
        parts.push(`${Math.round(monthsRemaining * 30)} days remaining`)
      } else {
        parts.push(`${Math.round(monthsRemaining)} mo remaining`)
      }
    }
  }

  // --- Mileage detail ---
  if (lastMaintenanceRecord.next_service_mileage && currentMileage !== null && subscriptionTier !== 'free') {
    const milesLeft = lastMaintenanceRecord.next_service_mileage - currentMileage
    if (milesLeft <= 0) {
      parts.push(`${Math.abs(milesLeft).toLocaleString()} mi overdue`)
    } else {
      parts.push(`${milesLeft.toLocaleString()} mi remaining`)
    }
  } else if (interval.miles && lastMaintenanceRecord.mileage != null && currentMileage !== null) {
    const milesElapsed = currentMileage - lastMaintenanceRecord.mileage
    const milesRemaining = interval.miles - milesElapsed

    if (milesRemaining <= 0) {
      parts.push(`${Math.abs(milesRemaining).toLocaleString()} mi overdue`)
    } else {
      parts.push(`${milesRemaining.toLocaleString()} mi remaining`)
    }
  }

  return parts.join(' · ')
}

export function getLatestMaintenanceRecord(
  maintenanceRecords: MaintenanceRecord[],
  type: string
): MaintenanceRecord | undefined {
  return maintenanceRecords
    .filter(record => record.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
}
