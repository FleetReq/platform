/**
 * Shared maintenance logic used by both the dashboard UI and the
 * maintenance-notifications cron job. Pure TypeScript — no React or browser deps.
 */

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
  wipers: { months: 12, yellowThreshold: 0.75, redThreshold: 1.0 },
  registration: { months: 24, yellowThreshold: 0.9, redThreshold: 1.0 },
}

export const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  oil_change: 'Oil Change',
  tire_rotation: 'Tire Rotation',
  tire_change: 'Tire Change',
  brake_pads: 'Brake Pads',
  rotors: 'Rotors',
  air_filter: 'Air Filter',
  transmission_service: 'Transmission Service',
  coolant_flush: 'Coolant Flush',
  brake_fluid_flush: 'Brake Fluid Flush',
  spark_plugs: 'Spark Plugs',
  battery: 'Battery',
  cabin_air_filter: 'Cabin Air Filter',
  serpentine_belt: 'Serpentine Belt',
  wipers: 'Wipers',
  registration: 'Registration',
}

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

export function getLatestMaintenanceRecord(
  maintenanceRecords: MaintenanceRecord[],
  type: string
): MaintenanceRecord | undefined {
  return maintenanceRecords
    .filter(record => record.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
}
