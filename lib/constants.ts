/**
 * Shared constants used across the FleetReq application.
 * Centralizes values that were previously scattered/duplicated.
 */

// ---------------------------------------------------------------------------
// Auth & Access Control
// ---------------------------------------------------------------------------

export const ADMIN_USER_IDS = ['b73a07b2-ed72-41b1-943f-e119afc9eddb'] as const

export const OWNER_USER_ID = 'b73a07b2-ed72-41b1-943f-e119afc9eddb'

export function isAdmin(userId: string): boolean {
  return (ADMIN_USER_IDS as readonly string[]).includes(userId)
}

export function isOwner(userId: string): boolean {
  return userId === OWNER_USER_ID
}

// ---------------------------------------------------------------------------
// Subscription Tiers
// ---------------------------------------------------------------------------

export type SubscriptionPlan = 'free' | 'personal' | 'business'

export type OrgRole = 'owner' | 'editor' | 'viewer'

/** Single source of truth for per-plan vehicle and member limits. */
export const PLAN_LIMITS: Record<SubscriptionPlan, { maxVehicles: number; maxMembers: number }> = {
  free:     { maxVehicles: 1,   maxMembers: 1 },
  personal: { maxVehicles: 3,   maxMembers: 3 },
  business: { maxVehicles: 999, maxMembers: 6 },
}

// ---------------------------------------------------------------------------
// IRS Mileage Rates
// ---------------------------------------------------------------------------

export const IRS_MILEAGE_RATES: Record<number, number> = {
  2024: 0.67,
  2025: 0.70,
  2026: 0.725,
}

export function getIrsRate(year: number): number {
  if (IRS_MILEAGE_RATES[year]) return IRS_MILEAGE_RATES[year]
  const knownYears = Object.keys(IRS_MILEAGE_RATES).map(Number).sort((a, b) => b - a)
  return IRS_MILEAGE_RATES[knownYears[0]]
}

// ---------------------------------------------------------------------------
// Maintenance Types (with icons for UI)
// ---------------------------------------------------------------------------

export interface MaintenanceTypeInfo {
  key: string
  label: string
  icon: string
}

/** Canonical list of maintenance types with display labels and icons. */
export const MAINTENANCE_TYPES: MaintenanceTypeInfo[] = [
  // Engine & Fluids
  { key: 'oil_change', label: 'Oil Change', icon: '\u{1F6E2}\uFE0F' },
  { key: 'transmission_service', label: 'Transmission', icon: '\u2699\uFE0F' },
  { key: 'coolant_flush', label: 'Coolant', icon: '\u{1F9CA}' },
  { key: 'air_filter', label: 'Air Filter', icon: '\u{1F32C}\uFE0F' },
  { key: 'cabin_air_filter', label: 'Cabin Filter', icon: '\u{1F33F}' },
  { key: 'spark_plugs', label: 'Spark Plugs', icon: '\u26A1' },
  // Tires & Brakes
  { key: 'tire_rotation', label: 'Tire Rotation', icon: '\u{1F504}' },
  { key: 'tire_change', label: 'Tire Change', icon: '\u{1F6DE}' },
  { key: 'brake_pads', label: 'Brake Pads', icon: '\u{1F6D1}' },
  { key: 'rotors', label: 'Rotors', icon: '\u{1F4BF}' },
  { key: 'brake_fluid_flush', label: 'Brake Fluid', icon: '\u{1F4A7}' },
  // Electrical & Belts
  { key: 'battery', label: 'Battery', icon: '\u{1F50B}' },
  { key: 'serpentine_belt', label: 'Serp. Belt', icon: '\u{1F517}' },
  // Drivetrain
  { key: 'differential_fluid', label: 'Diff Fluid', icon: '\u{1F527}' },
  // Other
  { key: 'wipers', label: 'Wipers', icon: '\u{1F327}\uFE0F' },
  { key: 'registration', label: 'Registration', icon: '\u{1F4CB}' },
]

/** Maintenance types as filter options (includes "All Types"). */
export const MAINTENANCE_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  ...MAINTENANCE_TYPES.map(t => ({ value: t.key, label: t.label })),
]

// ---------------------------------------------------------------------------
// Maintenance Status Colors
// ---------------------------------------------------------------------------

export type MaintenanceStatus = 'good' | 'warning' | 'overdue' | 'unknown'

export const STATUS_COLORS: Record<MaintenanceStatus, { border: string; bg: string; text: string }> = {
  good: {
    border: 'border-green-500',
    bg: 'bg-green-200 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
  },
  warning: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-200 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  overdue: {
    border: 'border-red-500',
    bg: 'bg-red-200 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
  },
  unknown: {
    border: 'border-gray-400',
    bg: 'bg-gray-200 dark:bg-gray-800/50',
    text: 'text-gray-700 dark:text-gray-300',
  },
}

export function getStatusColor(status: MaintenanceStatus): string {
  const c = STATUS_COLORS[status]
  return `${c.border} ${c.bg}`
}

export function getStatusTextColor(status: MaintenanceStatus): string {
  return STATUS_COLORS[status].text
}

// ---------------------------------------------------------------------------
// Plan Display Colors
// ---------------------------------------------------------------------------

export function getPlanColor(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'business': return 'text-purple-700 dark:text-purple-400'
    case 'personal': return 'text-blue-700 dark:text-blue-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}
