/**
 * Input Validation & Sanitization
 *
 * Centralized validation functions to prevent XSS, injection attacks,
 * and ensure data integrity across the application.
 */

/**
 * Sanitize string input - remove dangerous characters and limit length
 */
export function sanitizeString(
  input: string | null | undefined,
  options: { maxLength?: number; allowHtml?: boolean } = {}
): string | null {
  if (!input) return null

  const { maxLength = 1000, allowHtml = false } = options

  let sanitized = String(input).trim()

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  }

  // Remove null bytes and control characters (except newlines/tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized || null
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email: string | null | undefined): string | null {
  if (!email) return null

  const sanitized = String(email).trim().toLowerCase()

  // Basic email validation regex (RFC 5322 simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(sanitized)) {
    return null
  }

  // Limit length
  if (sanitized.length > 320) {
    return null
  }

  return sanitized
}

/**
 * Validate and parse integer with range check
 */
export function validateInteger(
  input: string | number | null | undefined,
  options: { min?: number; max?: number } = {}
): number | null {
  if (input === null || input === undefined || input === '') return null

  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options

  const num = typeof input === 'string' ? parseInt(input, 10) : input

  if (isNaN(num) || !Number.isInteger(num)) {
    return null
  }

  if (num < min || num > max) {
    return null
  }

  return num
}

/**
 * Validate and parse float with range check
 */
export function validateFloat(
  input: string | number | null | undefined,
  options: { min?: number; max?: number; precision?: number } = {}
): number | null {
  if (input === null || input === undefined || input === '') return null

  const { min = -Infinity, max = Infinity, precision } = options

  const num = typeof input === 'string' ? parseFloat(input) : input

  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  if (num < min || num > max) {
    return null
  }

  // Round to specified precision
  if (precision !== undefined) {
    return parseFloat(num.toFixed(precision))
  }

  return num
}

/**
 * Validate UUID format
 */
export function validateUUID(input: string | null | undefined): string | null {
  if (!input) return null

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  const sanitized = String(input).trim().toLowerCase()

  if (!uuidRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Validate date string (ISO 8601 or YYYY-MM-DD)
 */
export function validateDate(
  input: string | null | undefined,
  options: { allowFuture?: boolean; allowPast?: boolean } = {}
): string | null {
  if (!input) return null

  const { allowFuture = true, allowPast = true } = options

  const sanitized = String(input).trim()

  // Check for YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  if (!dateRegex.test(sanitized)) {
    return null
  }

  const date = new Date(sanitized)

  // Check if valid date
  if (isNaN(date.getTime())) {
    return null
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const inputDate = new Date(sanitized)
  inputDate.setHours(0, 0, 0, 0)

  if (!allowFuture && inputDate > now) {
    return null
  }

  if (!allowPast && inputDate < now) {
    return null
  }

  return sanitized
}

/**
 * Validate year (for vehicle model year)
 */
export function validateYear(input: string | number | null | undefined): number | null {
  const currentYear = new Date().getFullYear()
  return validateInteger(input, { min: 1900, max: currentYear + 2 })
}

/**
 * Validate license plate (alphanumeric with limited special chars)
 */
export function validateLicensePlate(input: string | null | undefined): string | null {
  if (!input) return null

  const sanitized = String(input).trim().toUpperCase()

  // Allow letters, numbers, spaces, hyphens (typical license plate format)
  const plateRegex = /^[A-Z0-9\s-]{1,15}$/

  if (!plateRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Validate maintenance type (must match database constraint)
 */
const VALID_MAINTENANCE_TYPES = [
  'oil_change',
  'tire_rotation',
  'tire_change',
  'brake_pads',
  'rotors',
  'air_filter',
  'transmission_service',
  'coolant_flush',
  'brake_fluid_flush',
  'spark_plugs',
  'battery',
  'cabin_air_filter',
  'serpentine_belt',
  'wipers',
  'registration'
] as const

export type MaintenanceType = typeof VALID_MAINTENANCE_TYPES[number]

export function validateMaintenanceType(
  input: string | null | undefined
): MaintenanceType | null {
  if (!input) return null

  const sanitized = String(input).trim().toLowerCase()

  if (!VALID_MAINTENANCE_TYPES.includes(sanitized as MaintenanceType)) {
    return null
  }

  return sanitized as MaintenanceType
}

/**
 * Validate fuel type
 */
const VALID_FUEL_TYPES = [
  'regular',
  'mid-grade',
  'premium',
  'diesel',
  'electric',
  'e85'
] as const

export type FuelType = typeof VALID_FUEL_TYPES[number]

export function validateFuelType(input: string | null | undefined): FuelType | null {
  if (!input) return null

  const sanitized = String(input).trim().toLowerCase()

  if (!VALID_FUEL_TYPES.includes(sanitized as FuelType)) {
    return null
  }

  return sanitized as FuelType
}

/**
 * Validate subscription plan
 */
const VALID_SUBSCRIPTION_PLANS = ['free', 'personal', 'business'] as const

export type SubscriptionPlan = typeof VALID_SUBSCRIPTION_PLANS[number]

export function validateSubscriptionPlan(
  input: string | null | undefined
): SubscriptionPlan | null {
  if (!input) return null

  const sanitized = String(input).trim().toLowerCase()

  if (!VALID_SUBSCRIPTION_PLANS.includes(sanitized as SubscriptionPlan)) {
    return null
  }

  return sanitized as SubscriptionPlan
}

/**
 * Validation error class for consistent error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
