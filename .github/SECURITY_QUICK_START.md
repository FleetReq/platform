# Security Quick Start Guide

> **Quick reference for integrating security libraries into API routes**

---

## 🚀 Complete API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import {
  sanitizeString,
  validateInteger,
  validateUUID,
  ValidationError
} from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // 1. Check database connection
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // 2. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Rate limiting
    const identifier = user.id
    const rateLimitResult = rateLimit(identifier, RATE_LIMITS.WRITE)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      )
    }

    // 4. Parse and validate input
    const body = await request.json()

    const make = sanitizeString(body.make, { maxLength: 50 })
    const year = validateInteger(body.year, { min: 1900, max: 2030 })
    const mileage = validateInteger(body.current_mileage, { min: 0, max: 999999 })

    if (!make || !year) {
      return NextResponse.json(
        { error: 'Make and year are required' },
        { status: 400 }
      )
    }

    // 5. Verify resource ownership (if updating existing resource)
    if (body.carId) {
      const carId = validateUUID(body.carId)
      if (!carId) {
        return NextResponse.json({ error: 'Invalid car ID' }, { status: 400 })
      }

      const { data: car } = await supabase
        .from('cars')
        .select('id')
        .eq('id', carId)
        .eq('user_id', user.id)  // ⚠️ CRITICAL
        .single()

      if (!car) {
        return NextResponse.json({ error: 'Car not found' }, { status: 404 })
      }
    }

    // 6. Perform database operation
    const { data, error } = await supabase
      .from('cars')
      .insert({
        user_id: user.id,
        make,
        year,
        current_mileage: mileage
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        {
          error: 'Failed to create car',
          // Only expose details in development
          ...(process.env.NODE_ENV !== 'production' && {
            details: error.message,
            code: error.code
          })
        },
        { status: 500 }
      )
    }

    // 7. Return success response
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 📝 Rate Limit Configuration Reference

```typescript
import { RATE_LIMITS } from '@/lib/rate-limit'

// Available rate limit presets:
RATE_LIMITS.AUTH       // 5 requests / 15 min (authentication)
RATE_LIMITS.READ       // 100 requests / min (GET operations)
RATE_LIMITS.WRITE      // 30 requests / min (POST/PATCH/DELETE)
RATE_LIMITS.EXPENSIVE  // 10 requests / min (complex queries)
RATE_LIMITS.ANONYMOUS  // 20 requests / 5 min (unauthenticated)

// Custom rate limit:
const customLimit = { limit: 50, window: 60 } // 50 per minute
```

---

## 🔍 Validation Function Reference

```typescript
import {
  sanitizeString,
  validateEmail,
  validateInteger,
  validateFloat,
  validateUUID,
  validateDate,
  validateYear,
  validateLicensePlate,
  validateMaintenanceType,
  validateFuelType,
  validateSubscriptionPlan,
} from '@/lib/validation'

// String sanitization (removes HTML, limits length)
const name = sanitizeString(input, { maxLength: 50, allowHtml: false })

// Email validation (RFC 5322)
const email = validateEmail(input)

// Integer validation with range
const age = validateInteger(input, { min: 0, max: 150 })

// Float validation with precision
const price = validateFloat(input, { min: 0, max: 10000, precision: 2 })

// UUID validation
const id = validateUUID(input)

// Date validation (ISO 8601)
const date = validateDate(input, { allowFuture: false, allowPast: true })

// Vehicle year (1900 - current+2)
const year = validateYear(input)

// License plate (alphanumeric)
const plate = validateLicensePlate(input)

// Maintenance type (enum: 8 types)
const type = validateMaintenanceType(input)

// Fuel type (enum: 6 types)
const fuelType = validateFuelType(input)

// Subscription plan (enum: free/personal/business)
const plan = validateSubscriptionPlan(input)
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ **DON'T: Skip authentication**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  // Missing auth check - anyone can access!
}
```

### ✅ **DO: Always authenticate first**
```typescript
export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### ❌ **DON'T: Forget resource ownership check**
```typescript
const { data } = await supabase
  .from('cars')
  .update({ make: 'Toyota' })
  .eq('id', carId)  // User could update ANY car!
```

### ✅ **DO: Always verify ownership**
```typescript
const { data } = await supabase
  .from('cars')
  .update({ make: 'Toyota' })
  .eq('id', carId)
  .eq('user_id', user.id)  // Only user's own cars
```

---

### ❌ **DON'T: Use raw user input**
```typescript
const make = body.make  // Could contain HTML, scripts, etc.
```

### ✅ **DO: Validate and sanitize**
```typescript
const make = sanitizeString(body.make, { maxLength: 50 })
if (!make) return NextResponse.json({ error: 'Invalid make' }, { status: 400 })
```

---

### ❌ **DON'T: Expose debug info in production**
```typescript
return NextResponse.json({
  cars,
  _debug: {
    userId: user.id,        // ⚠️ PII exposure
    userEmail: user.email   // ⚠️ PII exposure
  }
})
```

### ✅ **DO: Hide debug info in production**
```typescript
return NextResponse.json({
  cars,
  ...(process.env.NODE_ENV !== 'production' && {
    _debug: { userId: user.id, count: cars.length }
  })
})
```

---

### ❌ **DON'T: Expose database errors**
```typescript
if (error) {
  return NextResponse.json({
    error: error.message,  // ⚠️ Exposes DB schema
    code: error.code       // ⚠️ Exposes DB version
  }, { status: 500 })
}
```

### ✅ **DO: Hide errors in production**
```typescript
if (error) {
  console.error('DB error:', error)
  return NextResponse.json({
    error: 'Operation failed',
    ...(process.env.NODE_ENV !== 'production' && {
      details: error.message
    })
  }, { status: 500 })
}
```

---

## 🧪 Testing Security

### **Test Rate Limiting**
```bash
# Install Apache Bench
brew install apache-bench  # macOS
apt-get install apache2-utils  # Linux

# Test rate limit (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:3000/api/cars

# Should see 429 responses after threshold
```

### **Test Input Validation**
```javascript
// Test malicious inputs
await fetch('/api/cars', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    make: '<script>alert("XSS")</script>',  // Should be sanitized
    year: 'DROP TABLE cars;',               // Should be rejected
    current_mileage: -999999                // Should be rejected
  })
})
```

### **Test Security Headers**
```bash
# After deployment, check headers
curl -I https://fleetreq.vercel.app

# Should see:
# Strict-Transport-Security: max-age=63072000
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
```

---

## 📋 API Route Security Checklist

When creating/updating API routes, ensure:

- [ ] Authenticate user with `supabase.auth.getUser()`
- [ ] Apply rate limiting with `rateLimit()`
- [ ] Validate ALL user inputs with validation functions
- [ ] Sanitize string inputs with `sanitizeString()`
- [ ] Verify resource ownership with `.eq('user_id', user.id)`
- [ ] Use parameterized queries (Supabase client methods)
- [ ] Hide debug info in production (`NODE_ENV !== 'production'`)
- [ ] Hide database errors in production
- [ ] Return proper HTTP status codes (401, 403, 404, 429, 500)
- [ ] Log security events (auth failures, rate limits)
- [ ] Add rate limit headers to responses
- [ ] Never expose PII unnecessarily

---

## 🚨 Emergency Response

If you discover a security vulnerability:

1. **DO NOT** commit the vulnerability fix publicly
2. Email: `deeahtee@live.com` with details
3. Expected response: 48 hours
4. Expected fix: 7 days (high severity), 30 days (medium)

---

## 📚 Additional Resources

- **Full Documentation**: See `SECURITY.md`
- **Implementation Details**: See `SECURITY_IMPROVEMENTS_SUMMARY.md`
- **Database Schema**: See `SCHEMA.md`
- **Database Functions**: See `FUNCTIONS.md`

---

*Last Updated: 2025-10-10*
*Quick Start Guide v1.0*
