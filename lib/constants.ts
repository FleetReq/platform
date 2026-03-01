/**
 * Shared constants used across the FleetReq application.
 * Centralizes values that were previously scattered/duplicated.
 */

// ---------------------------------------------------------------------------
// Auth & Access Control
// ---------------------------------------------------------------------------

// Admin user IDs — server-side only. Use ADMIN_USER_IDS (no NEXT_PUBLIC_ prefix)
// so the values are not bundled into the client JS. Client-side isAdmin() calls
// will always return false; real enforcement is server-side in API routes.
export const ADMIN_USER_IDS: readonly string[] =
  process.env.ADMIN_USER_IDS
    ?.split(',').map(s => s.trim()).filter(Boolean) ?? []

export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId)
}

// isOwner is an alias for isAdmin — retained for call-site clarity in UI contexts
export function isOwner(userId: string): boolean {
  return isAdmin(userId)
}

// ---------------------------------------------------------------------------
// Subscription Tiers
// ---------------------------------------------------------------------------

export type SubscriptionPlan = 'free' | 'personal' | 'business'

export type OrgRole = 'owner' | 'editor' | 'viewer'

/** Sentinel value meaning "no vehicle limit" for display purposes. */
export const UNLIMITED_VEHICLES = 999

/** Single source of truth for per-plan vehicle and member limits. */
export const PLAN_LIMITS: Record<SubscriptionPlan, { maxVehicles: number; maxMembers: number }> = {
  free:     { maxVehicles: 1,   maxMembers: 1 },
  personal: { maxVehicles: 3,   maxMembers: 3 },
  business: { maxVehicles: UNLIMITED_VEHICLES, maxMembers: 6 },
}

/** Display names for each subscription plan (DB value → UI label). */
export const PLAN_DISPLAY_NAMES: Record<SubscriptionPlan, string> = {
  free:     'Free',
  personal: 'Family',
  business: 'Business',
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/** Personal tier price per month, in USD. */
export const PERSONAL_PRICE_USD = 4

/** Business tier price per vehicle per month, in USD. Used for proration calculations. */
export const BUSINESS_PRICE_PER_VEHICLE_USD = 12

/** Default vehicle count for new Business subscriptions when no vehicle count is provided. */
export const DEFAULT_BUSINESS_VEHICLE_COUNT = 4

/** Grace period after subscription ends before account data is deleted. */
export const ACCOUNT_DELETION_GRACE_DAYS = 30

/** Maximum plausible fuel price per gallon (covers aviation fuel and future diesel). */
export const PRICE_PER_GALLON_MAX = 100

/** Maximum odometer/mileage reading accepted in validation (supports high-mileage commercial fleets). */
export const MAX_ODOMETER_MILES = 9_999_999

/** Records fetched per dashboard load (fill-ups and maintenance). */
export const DASHBOARD_RECORDS_LIMIT = 50

/** Records displayed per page in the dashboard records table. */
export const RECORDS_PER_PAGE = 20

/** Records fetched by form dropdowns for recent activity context. */
export const FORM_RECORDS_LIMIT = 10

/** Supabase Storage bucket name for receipt photos. */
export const STORAGE_BUCKET_RECEIPTS = 'receipts'

/** Minimum password length (matches Supabase auth default). */
export const MIN_PASSWORD_LENGTH = 6

/** Timeout (ms) for sign-out network call before optimistic clear proceeds. */
export const SIGN_OUT_TIMEOUT_MS = 1500

/** Timeout (ms) for pending invite check to prevent blocking login. */
export const INVITE_CHECK_TIMEOUT_MS = 3000

/** Abort timeout (ms) for fetchWithTimeout — fits within Vercel function limit. */
export const FETCH_TIMEOUT_MS = 8000

/** Canonical site URL. Single source of truth — used in emails, sitemaps, and structured data. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fleetreq.vercel.app'

// ---------------------------------------------------------------------------
// IRS Mileage Rates
// ---------------------------------------------------------------------------

export const IRS_MILEAGE_RATES: Record<number, number> = {
  2024: 0.67,  // IRS Rev. Proc. 2023-34
  2025: 0.70,  // IRS Rev. Proc. 2024-25
  2026: 0.725, // IRS Rev. Proc. 2025-37 (confirmed January 2026)
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
  { key: 'transmission_service', label: 'Transmission Service', icon: '\u2699\uFE0F' },
  { key: 'coolant_flush', label: 'Coolant Flush', icon: '\u{1F9CA}' },
  { key: 'air_filter', label: 'Air Filter', icon: '\u{1F32C}\uFE0F' },
  { key: 'cabin_air_filter', label: 'Cabin Air Filter', icon: '\u{1F33F}' },
  { key: 'spark_plugs', label: 'Spark Plugs', icon: '\u26A1' },
  // Tires & Brakes
  { key: 'tire_rotation', label: 'Tire Rotation', icon: '\u{1F504}' },
  { key: 'tire_change', label: 'Tire Change', icon: '\u{1F6DE}' },
  { key: 'brake_pads', label: 'Brake Pads', icon: '\u{1F6D1}' },
  { key: 'rotors', label: 'Rotors', icon: '\u{1F4BF}' },
  { key: 'brake_fluid_flush', label: 'Brake Fluid Flush', icon: '\u{1F4A7}' },
  // Electrical & Belts
  { key: 'battery', label: 'Battery', icon: '\u{1F50B}' },
  { key: 'serpentine_belt', label: 'Serpentine Belt', icon: '\u{1F517}' },
  // Drivetrain
  { key: 'differential_fluid', label: 'Differential Fluid', icon: '\u{1F527}' },
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
