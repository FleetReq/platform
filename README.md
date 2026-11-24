# FleetReq - Vehicle Fleet Management & Maintenance Platform

A professional SaaS platform for vehicle maintenance tracking and fuel efficiency monitoring. Designed for families, small contractors, and service businesses who need reliable vehicle management without enterprise complexity.

🌐 **Live Site**: [fleetreq.vercel.app](https://fleetreq.vercel.app)
🚀 **Full-Stack SaaS** • **Freemium Model** • **Production-Ready**

---

## 🎯 What is FleetReq?

FleetReq helps you **stop guessing when maintenance is due** and **track every dollar spent on vehicles**. Perfect for:

- **Families** managing 2-3 personal vehicles
- **Small Contractors** tracking 5-15 work vehicles
- **Service Businesses** needing tax-compliant mileage logs

### Key Features

- ✅ **10 Maintenance Types** - Oil change, tire rotation, tire change, brake pads, rotors, air filter, transmission, coolant, wipers, registration
- ✅ **Color-Coded Status** - 🟢 Good / 🟡 Warning / 🔴 Overdue at a glance
- ✅ **Fuel Efficiency Tracking** - MPG analytics with trends and cost-per-mile
- ✅ **IRS Tax Deduction Tracking** - Dynamic yearly mileage rates with business trip logging (Business tier)
- ✅ **Stripe Billing** - Subscription management with cancellation and downgrade flows
- ✅ **Smart Automation** - Auto-creates tire rotation when tire change is logged

---

## 💰 Pricing Tiers

### **Free Tier** - Try Before You Buy
- 1 vehicle maximum
- Basic fuel tracking & MPG analysis
- **View-only** maintenance status (no yellow warnings)
- Unlimited data history

### **Personal Tier** - $4/month
- Up to 3 vehicles
- **Full maintenance tracking** with yellow warning alerts
- Custom next service date/mileage scheduling
- Unlimited data history

### **Business Tier** - $12/vehicle/month
- Unlimited vehicles (4+ recommended)
- IRS-compliant business trip logging with tax deduction calculations
- All Personal tier features
- Priority support

**Why these prices?** Personal tier = "coffee money" impulse purchase. Business tier = 65% below market average ($35/vehicle/month typical).

---

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 16** - App Router with Turbopack bundler
- **React 19** - Latest React with Server Components
- **TypeScript** - Full type safety
- **Tailwind CSS 3** - Professional design system
- **Chart.js** - Interactive fuel efficiency graphs
- **next-themes** - Light/dark mode toggle

### **Backend**
- **Supabase** - PostgreSQL database with Row Level Security (RLS)
- **Supabase Auth** - Email/Password + Google OAuth (cookie-based SSR sessions)
- **Stripe** - Payment processing, subscriptions, webhooks
- **RESTful APIs** - 29 route handlers with input validation

### **Hosting & DevOps**
- **Vercel** - Auto-deployment from GitHub main branch
- **Vercel Cron** - 4 scheduled jobs (`vercel.json`)
- **Security Headers** - CSP, HSTS, X-Frame-Options via vercel.json

---

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - For cloning the repository
- **Supabase Account** - Free tier works fine ([supabase.com](https://supabase.com))

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone git@github.com:FleetReq/platform.git
cd fleetreq-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create `.env.local` in the root directory:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Stripe (REQUIRED for billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Service Role (REQUIRED for cron jobs)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-YOUR-GA-ID-HERE
```

**Where to find Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Project Settings → API
3. Copy `Project URL`, `anon/public` key, and `service_role` key

### 4. Set Up Database Schema
Run these SQL files in **Supabase Dashboard → SQL Editor** (in order):

1. `supabase/01-create-user-profiles-table.sql` - User subscription data
2. `supabase/02-create-trigger.sql` - Auto-create profiles on signup
3. `supabase/03-update-test-users.sql` - Set up test accounts
4. `supabase/13-fix-handle-new-user-security.sql` - Security fix

Then run the migrations in `supabase/migrations/` in date order.

**Test accounts will be created** (see `CLAUDE.md` for credentials):
- Free tier, Personal tier, Business tier test users

### 5. Configure Google OAuth (Optional)
1. Supabase Dashboard → Authentication → Providers → Enable Google
2. Follow Supabase's Google OAuth setup guide
3. Add redirect URL: `http://localhost:3000/auth/callback`

### 6. Start Development Server
```bash
npm run dev
```

**⚠️ CRITICAL**: Must run on **port 3000** for Google OAuth to work!

**If port 3000 is in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Then restart
npm run dev
```

### 7. Open in Browser
Navigate to **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Project Structure

```
fleetreq-platform/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── dashboard/page.tsx           # Main app dashboard (3500+ lines)
│   ├── pricing/page.tsx             # Pricing table & comparison
│   ├── checkout/
│   │   ├── success/page.tsx         # Post-payment confirmation
│   │   └── cancel/page.tsx          # Cancelled payment
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth redirect handler
│   │   └── popup-close/page.tsx    # OAuth popup close
│   ├── components/
│   │   ├── BackgroundAnimation.tsx  # Animated gradient background
│   │   └── UpgradePrompt.tsx        # Paywall overlays
│   ├── api/
│   │   ├── cars/                    # Vehicle CRUD + delete
│   │   ├── fill-ups/               # Fuel tracking + bulk import
│   │   ├── maintenance/            # Maintenance records (10 types)
│   │   ├── trips/                  # Business/personal trip logging
│   │   ├── stats/                  # Analytics & metrics
│   │   ├── checkout/session/       # Stripe checkout
│   │   ├── webhooks/stripe/        # Stripe webhook handler
│   │   ├── subscription/           # Cancel & downgrade flows
│   │   └── cron/                   # 4 automated jobs (see below)
│   ├── icon.svg                    # FleetReq favicon
│   └── globals.css                 # Design system & animations
├── components/
│   └── AuthComponent.tsx            # Authentication UI & session
├── lib/
│   ├── supabase.ts                  # Server-side Supabase clients
│   ├── supabase-client.ts           # Client-side helpers & feature gating
│   ├── stripe-helpers.ts            # Stripe proration & quantity updates
│   ├── rate-limit.ts                # API rate limiting (5 tiers)
│   └── validation.ts               # Input validation & sanitization
├── supabase/
│   ├── *.sql                        # Base schema setup scripts
│   └── migrations/                  # 9 database migrations
├── .github/workflows/               # Manual-trigger copies of cron jobs
├── __tests__/lib/                   # Automated tests (46 passing)
├── SCHEMA.md                        # Complete database schema reference
├── FUNCTIONS.md                     # Database triggers & functions
└── SECURITY.md                      # Security documentation
```

---

## ⚙️ Automated Cron Jobs (Vercel Cron)

Scheduled in `vercel.json`. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically. GitHub workflows remain for manual runs only (GitHub disables schedules after 60 days without commits).

| Workflow | Schedule | Endpoint | Purpose |
|----------|----------|----------|---------|
| **Cleanup Expired Accounts** | Daily 00:00 UTC | `/api/cron/cleanup-expired-accounts` | GDPR-compliant deletion of accounts past scheduled deletion date |
| **Execute Pending Downgrades** | Daily 00:00 UTC | `/api/cron/execute-pending-downgrades` | Processes subscription downgrades when effective date is reached |
| **Maintenance Notifications** | Daily 08:00 UTC | `/api/cron/maintenance-notifications` | Resend email digest for warning/overdue maintenance |
| **Supabase Keep-Alive** | Daily 12:00 UTC | `/api/cron/keep-alive` | Writes to `keep_alive` table so the Free Plan project isn't paused |

---

## 🔐 Security

### **Row Level Security (RLS)**
- All user tables enforce `auth.uid() = user_id` on every query
- Admin bypass is application-level only, not database-level

### **Authentication**
- Cookie-based sessions via `@supabase/ssr` (not localStorage)
- Google OAuth + Email/Password
- Optimistic auth state (no loading flash for logged-in users)

### **API Protection**
- **Rate Limiting** (`lib/rate-limit.ts`): AUTH (10/min), READ (100/min), WRITE (50/min), EXPENSIVE (10/min), ANONYMOUS (5/min)
- **Input Validation** (`lib/validation.ts`): Sanitization for strings, emails, UUIDs, dates, numbers, enums
- **Security Headers** (`vercel.json`): CSP, HSTS (2-year max-age), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

---

## 🧪 Testing

### **Automated Tests**
```bash
npm test
```
- 46 tests passing
- Subscription logic validation
- Vehicle limit enforcement

### **Manual Testing**
Use `TESTING_CHECKLIST.md` for comprehensive browser testing across all 3 tiers.

---

## 📅 Annual Maintenance

### **IRS Standard Mileage Rate Update (Late December)**
The IRS announces the new business mileage rate around **December 28-31** each year, effective January 1.

**When announced**, update the `IRS_MILEAGE_RATES` lookup in `app/dashboard/page.tsx`:
```ts
const IRS_MILEAGE_RATES: Record<number, number> = {
  2024: 0.67,
  2025: 0.70,
  2026: 0.725,
  // Add new year here when IRS announces it
}
```

**Source**: [IRS Standard Mileage Rates](https://www.irs.gov/tax-professionals/standard-mileage-rates)

> If the new rate isn't added in time, the app automatically falls back to the most recent known rate.

---

## 🚀 Deployment

### **Automatic Deployment (Vercel)**
1. Push to `main` branch
2. Vercel auto-builds and deploys
3. Live at [fleetreq.vercel.app](https://fleetreq.vercel.app) in 2-3 minutes

### **Environment Variables (Vercel)**
Add these in Vercel Dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GA_ID` (optional)

---

## 🔧 Troubleshooting

### **Port 3000 Required**
Google OAuth is configured for `http://localhost:3000/auth/callback`.
Running on 3001, 3002, etc. will break authentication.

### **"Your project's URL and Key are required"**
Missing `.env.local` file. Create one with the required Supabase variables.

### **Data Not Showing After Login**
Check RLS policies in Supabase Dashboard → Authentication → Policies.
All tables should have `auth.uid() = user_id` policies.

### **OAuth Redirect Issues**
Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://fleetreq.vercel.app`
- Redirect URLs: `https://fleetreq.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

---

## 🎯 Roadmap

### **Completed** ✅
- [x] Fuel tracking with MPG analytics and cost-per-mile
- [x] 10 maintenance types with interval-based alerts
- [x] Auto-create tire rotation on tire change
- [x] Stripe billing with subscription management
- [x] Subscription cancellation with 30-day grace period
- [x] Automatic plan downgrades
- [x] IRS business trip logging with dynamic yearly rates
- [x] GDPR-compliant account deletion
- [x] Security headers, rate limiting, input validation
- [x] FleetReq branding and favicon
- [x] Light/dark mode
- [x] Future-date input warnings

### **Next Up**
- [ ] PWA support (service worker, offline, installable)
- [ ] Professional reporting & CSV/PDF export (Business tier)
- [ ] Team invitation system (Business tier)
- [ ] Photo/receipt upload for maintenance records
- [ ] Custom maintenance intervals per vehicle (Business tier)

### **Future**
- [ ] Native mobile apps (iOS + Android)
- [ ] GPS mileage tracking
- [ ] OCR auto-extract from receipts
- [ ] QuickBooks integration

---

## 📞 Contact & Support

- **Live Site**: [fleetreq.vercel.app](https://fleetreq.vercel.app)
- **GitHub**: [github.com/FleetReq/platform](https://github.com/FleetReq/platform)
- **Issues**: [GitHub Issues](https://github.com/FleetReq/platform/issues)

---

**FleetReq Platform** • **Next.js 16** • **TypeScript** • **Supabase** • **Stripe**
*Professional vehicle management for families and small businesses*
