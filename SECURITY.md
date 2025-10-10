# FleetReq Security Documentation

> **CRITICAL**: Security is a continuous process, not a one-time task.
> This document outlines security measures, vulnerabilities addressed, and best practices.
> Last Updated: 2025-10-10

---

## 🔐 Security Overview

FleetReq implements defense-in-depth security across multiple layers:

1. **Database Security** - Row Level Security (RLS) policies
2. **Application Security** - Authentication, authorization, input validation
3. **Network Security** - HTTPS, security headers, rate limiting
4. **Code Security** - Parameterized queries, sanitization, secure dependencies

---

## ✅ Implemented Security Measures

### **1. Database Security (Row Level Security)**

**Status**: ✅ Implemented

**Implementation**: Supabase RLS policies enforce data isolation at the database level

```sql
-- Example RLS Policy Pattern
CREATE POLICY "users_select_own_data"
  ON table_name FOR SELECT TO public
  USING (auth.uid() = user_id);
```

**Benefits**:
- Prevents data leakage between users
- Enforced at database level (cannot be bypassed by application code)
- Protects against IDOR (Insecure Direct Object Reference) attacks

**Verification**:
- All tables (cars, fill_ups, maintenance_records) have RLS enabled
- Test accounts (free, personal, business) see only their own data

---

### **2. Authentication & Session Management**

**Status**: ✅ Implemented

**Implementation**:
- Supabase Auth with Email/Password + Google OAuth
- Cookie-based sessions (httpOnly, sameSite=lax, secure in production)
- Server-side session validation on every API request

**Security Features**:
- Passwords hashed with bcrypt by Supabase
- Session tokens stored in httpOnly cookies (prevents XSS theft)
- CSRF protection via sameSite=lax cookies
- Automatic session refresh in middleware

**Files**:
- `lib/supabase.ts` - Server-side auth clients
- `lib/supabase-client.ts` - Client-side auth
- `middleware.ts` - Session refresh middleware

---

### **3. SQL Injection Protection**

**Status**: ✅ Implemented

**Implementation**:
- All database queries use Supabase client (parameterized queries)
- NO raw SQL queries in application code
- Input validation before database operations

**Example**:
```typescript
// ✅ SAFE - Parameterized query
await supabase
  .from('cars')
  .select('*')
  .eq('user_id', user.id)

// ❌ UNSAFE - Never do this (not used in our codebase)
await supabase.raw(`SELECT * FROM cars WHERE user_id = '${userId}'`)
```

---

### **4. Security Headers (NEW - 2025-10-10)**

**Status**: ✅ Implemented

**Implementation**: `vercel.json` configuration

**Headers Configured**:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing attacks |
| `X-XSS-Protection` | `1; mode=block` | Enable browser XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer data leakage |
| `Permissions-Policy` | `camera=(), microphone=()...` | Disable unnecessary browser features |
| `Content-Security-Policy` | See vercel.json | Prevent XSS, code injection |

**Testing**:
- Test at: https://securityheaders.com
- Expected grade: A or A+ after deployment

**Rationale**: Protects against XSS, clickjacking, MIME sniffing, and information disclosure

---

### **5. Rate Limiting (NEW - 2025-10-10)**

**Status**: ✅ Library implemented, ⏳ API integration pending

**Implementation**: `lib/rate-limit.ts`

**Rate Limit Tiers**:
- **AUTH** (5 requests / 15 min) - Authentication endpoints
- **READ** (100 requests / min) - GET operations
- **WRITE** (30 requests / min) - POST/PATCH/DELETE operations
- **EXPENSIVE** (10 requests / min) - Complex queries/exports
- **ANONYMOUS** (20 requests / 5 min) - Unauthenticated requests

**Usage Example**:
```typescript
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()

  // Rate limit by user ID or IP address
  const identifier = user?.id || request.headers.get('x-forwarded-for') || 'anonymous'
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

  // Continue with request...
}
```

**Benefits**:
- Prevents brute force attacks on authentication
- Prevents DDoS and resource exhaustion
- Prevents abuse by automated bots
- Prevents free tier spam account creation

**Next Steps**:
1. Add rate limiting to all API routes (see implementation example above)
2. For production scale, consider Upstash Redis or Vercel Edge Config
3. Monitor rate limit metrics in production

**Rationale**: Prevents brute force, DDoS, and abuse attacks

---

### **6. Input Validation & Sanitization (NEW - 2025-10-10)**

**Status**: ✅ Library implemented, ⏳ API integration pending

**Implementation**: `lib/validation.ts`

**Validation Functions**:
- `sanitizeString()` - Remove HTML, control chars, limit length
- `validateEmail()` - RFC 5322 email validation
- `validateInteger()` - Parse and range-check integers
- `validateFloat()` - Parse and range-check floats with precision
- `validateUUID()` - Validate UUID format
- `validateDate()` - Validate ISO 8601 dates with past/future checks
- `validateYear()` - Vehicle year validation (1900 - current+2)
- `validateLicensePlate()` - Alphanumeric validation
- `validateMaintenanceType()` - Enum validation (8 valid types)
- `validateFuelType()` - Enum validation (6 valid types)

**Usage Example**:
```typescript
import { sanitizeString, validateInteger, validateDate, ValidationError } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate and sanitize inputs
  const make = sanitizeString(body.make, { maxLength: 50 })
  const year = validateYear(body.year)
  const mileage = validateInteger(body.current_mileage, { min: 0, max: 999999 })

  if (!make || !year) {
    return NextResponse.json(
      { error: 'Invalid input data' },
      { status: 400 }
    )
  }

  // Continue with clean data...
}
```

**Benefits**:
- Prevents XSS attacks (sanitizes HTML)
- Prevents SQL injection (validates data types)
- Prevents integer overflow attacks
- Prevents business logic bypass (validates ranges)
- Ensures data integrity

**Next Steps**:
1. Integrate validation into all API routes
2. Replace manual `trim()` and `parseInt()` with validation functions
3. Add validation tests for edge cases

**Rationale**: Prevents injection attacks and ensures data integrity

---

## 🚨 Known Vulnerabilities & Mitigations

### **1. Debug Information Exposure (MEDIUM)**

**Issue**: `app/api/cars/route.ts` lines 39-47 expose debug info in production

```typescript
return NextResponse.json({
  cars,
  _debug: {
    userId: user.id,
    userEmail: user.email,  // ⚠️ PII exposure
    carCount: cars?.length || 0,
    hasError: !!carsError
  }
})
```

**Risk**: Exposes user IDs and emails to client-side (information disclosure)

**Mitigation**:
```typescript
// Remove _debug block in production
return NextResponse.json({
  cars,
  ...(process.env.NODE_ENV !== 'production' && {
    _debug: {
      userId: user.id,
      carCount: cars?.length || 0
    }
  })
})
```

**Status**: ⏳ Pending fix

---

### **2. No CSRF Protection on State-Changing Operations (LOW)**

**Issue**: POST/PATCH/DELETE operations don't verify CSRF tokens

**Risk**: Cross-Site Request Forgery if cookies are stolen or session fixation occurs

**Mitigation**:
- Current: sameSite=lax cookies provide some protection
- Enhanced: Add CSRF token validation for sensitive operations
- Best: Use double-submit cookie pattern or synchronizer tokens

**Status**: ⏳ Deferred (low risk with current cookie configuration)

**Rationale**: sameSite=lax prevents most CSRF attacks, but explicit tokens would add defense-in-depth

---

### **3. No Content Security Policy for Inline Styles (LOW)**

**Issue**: CSP allows `'unsafe-inline'` for styles and scripts

```
style-src 'self' 'unsafe-inline';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
```

**Risk**: Reduces XSS protection effectiveness

**Mitigation**:
- Use nonce-based CSP for scripts
- Extract inline styles to CSS files
- Use Tailwind's production build (already doing this)

**Status**: ⏳ Deferred (requires Next.js nonce integration)

**Rationale**: Modern frameworks require some inline styles/scripts. Nonce-based CSP is the proper solution but requires framework integration.

---

### **4. Error Messages Leak Implementation Details (LOW)**

**Issue**: Error responses include database error codes and messages

```typescript
return NextResponse.json({
  error: 'Failed to create car',
  details: error.message,  // ⚠️ May expose DB schema
  code: error.code         // ⚠️ May expose DB version
}, { status: 500 })
```

**Risk**: Information disclosure may help attackers

**Mitigation**:
```typescript
// Production mode
return NextResponse.json({
  error: 'Failed to create car',
  ...(process.env.NODE_ENV !== 'production' && {
    details: error.message,
    code: error.code
  })
}, { status: 500 })
```

**Status**: ⏳ Pending fix

---

## 🔄 Security Best Practices

### **When Writing New API Routes**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, ValidationError } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // 1. Check Supabase connection
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // 2. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Rate limiting
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.WRITE)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // 4. Parse and validate input
    const body = await request.json()
    const make = sanitizeString(body.make, { maxLength: 50 })
    const year = validateInteger(body.year, { min: 1900, max: 2030 })

    if (!make || !year) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // 5. Verify resource ownership (if needed)
    const { data: car } = await supabase
      .from('cars')
      .select('id')
      .eq('id', body.carId)
      .eq('user_id', user.id)  // ⚠️ CRITICAL - ensure user owns resource
      .single()

    if (!car) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 6. Perform database operation
    const { data, error } = await supabase
      .from('cars')
      .insert({ user_id: user.id, make, year })
      .select()
      .single()

    if (error) {
      console.error('DB error:', error)
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### **Key Security Checklist for API Routes**

- [ ] Authenticate user with `supabase.auth.getUser()`
- [ ] Apply rate limiting with `rateLimit()`
- [ ] Validate and sanitize ALL user inputs
- [ ] Verify resource ownership with `.eq('user_id', user.id)`
- [ ] Use parameterized queries (Supabase client)
- [ ] Return generic error messages in production
- [ ] Log security events for monitoring
- [ ] Never expose PII in responses
- [ ] Add proper status codes (401, 403, 429, etc.)

---

## 🔍 Security Testing Checklist

### **Before Deployment**

- [ ] Test securityheaders.com score (target: A or A+)
- [ ] Verify RLS policies with test accounts
- [ ] Test rate limiting thresholds
- [ ] Verify input validation rejects malicious payloads
- [ ] Check for exposed debug information
- [ ] Verify HTTPS redirect works
- [ ] Test authentication flows (login, logout, session refresh)
- [ ] Verify user can only access their own data
- [ ] Test CORS policy (should allow only same-origin)
- [ ] Review error messages for information disclosure

### **Ongoing Monitoring**

- [ ] Monitor rate limit violations in logs
- [ ] Track authentication failures (potential brute force)
- [ ] Review database RLS policy violations
- [ ] Monitor 401/403 responses (potential attacks)
- [ ] Review CSP violation reports
- [ ] Track unusual API usage patterns
- [ ] Monitor Supabase audit logs

---

## 🛡️ Dependency Security

### **Current Approach**

- Using latest stable versions of Next.js, React, Supabase
- Vercel automatically patches platform vulnerabilities
- Supabase manages database security updates

### **Recommendations**

1. **Run dependency audits regularly**:
   ```bash
   npm audit
   npm audit fix
   ```

2. **Enable Dependabot on GitHub**:
   - Auto-creates PRs for security updates
   - Configure in `.github/dependabot.yml`

3. **Review package permissions**:
   - Avoid packages with unnecessary file system access
   - Check npm package download stats and age
   - Verify packages have active maintenance

---

## 📞 Security Incident Response

### **If a Security Issue is Discovered**

1. **Do NOT publicly disclose** the vulnerability
2. Email security contact: `deeahtee@live.com`
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact assessment
   - Suggested remediation (if any)

4. **Expected response time**: 48 hours
5. **Expected fix timeline**: 7 days for high severity, 30 days for medium

---

## 🔐 Future Security Enhancements

### **High Priority (Next 3 Months)**

1. **Integrate rate limiting** into all API routes
2. **Integrate validation library** into all API routes
3. **Remove debug info** from production responses
4. **Add CSRF tokens** for critical operations (account deletion, plan changes)
5. **Implement audit logging** for sensitive operations

### **Medium Priority (6 Months)**

1. **Add 2FA/MFA** support (Supabase supports TOTP)
2. **Implement security monitoring** dashboard
3. **Add anomaly detection** for unusual usage patterns
4. **Create security compliance reports** (SOC 2 prep)
5. **Implement nonce-based CSP** for inline scripts

### **Low Priority (12+ Months)**

1. **Penetration testing** by third party
2. **Bug bounty program** launch
3. **SOC 2 Type II certification**
4. **Security training** for development team
5. **Automated security scanning** in CI/CD pipeline

---

## 📚 References & Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Supabase Security**: https://supabase.com/docs/guides/platform/security
- **Next.js Security**: https://nextjs.org/docs/app/building-your-application/configuring/security
- **SecurityHeaders.com**: https://securityheaders.com
- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/

---

*Last Updated: 2025-10-10*
*Status: Active Development - Security Hardening in Progress*
*Next Review: 2025-11-10 (monthly security review)*
