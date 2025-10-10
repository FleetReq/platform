/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiting for API endpoints.
 * For production scale, consider Upstash Redis or Vercel Edge Config.
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number
  /** Time window in seconds */
  window: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success flag and metadata
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 10, window: 60 }
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.window * 1000
  const key = `${identifier}:${config.limit}:${config.window}`

  if (!store[key] || store[key].resetAt < now) {
    // Initialize or reset the counter
    store[key] = {
      count: 1,
      resetAt: now + windowMs
    }

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: store[key].resetAt
    }
  }

  // Increment the counter
  store[key].count++

  const remaining = Math.max(0, config.limit - store[key].count)
  const success = store[key].count <= config.limit

  return {
    success,
    limit: config.limit,
    remaining,
    reset: store[key].resetAt
  }
}

/**
 * Get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    'Retry-After': result.success ? '' : Math.ceil((result.reset - Date.now()) / 1000).toString()
  }
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  /** Authentication endpoints - strict limit */
  AUTH: { limit: 5, window: 60 * 15 }, // 5 attempts per 15 minutes

  /** Read operations - generous limit */
  READ: { limit: 100, window: 60 }, // 100 requests per minute

  /** Write operations - moderate limit */
  WRITE: { limit: 30, window: 60 }, // 30 requests per minute

  /** Expensive operations - strict limit */
  EXPENSIVE: { limit: 10, window: 60 }, // 10 requests per minute

  /** Anonymous/unauthenticated - very strict */
  ANONYMOUS: { limit: 20, window: 60 * 5 }, // 20 requests per 5 minutes
} as const
