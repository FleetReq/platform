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

- ✅ **Automated Maintenance Alerts** - Never miss an oil change or brake inspection
- ✅ **Fuel Efficiency Tracking** - MPG analytics with weekly/monthly/yearly trends
- ✅ **Color-Coded Status** - 🟢 Good / 🟡 Warning / 🔴 Overdue at a glance
- ✅ **Tax Mileage Logging** - IRS-compliant business deduction tracking (Business tier)
- ✅ **Multi-User Teams** - Invite drivers and mechanics (Business tier)
- ✅ **Professional Reports** - Export analytics for tax season (Business tier)

---

## 💰 Pricing Tiers

### **Free Tier** - Try Before You Buy
- 1 vehicle maximum
- Basic fuel tracking & MPG analysis
- **View-only** maintenance status
- 90-day data history

### **Personal Tier** - $4/month
- Up to 3 vehicles
- **Full maintenance tracking** (add/edit alerts)
- Unlimited data history
- Fuel efficiency analytics
- Export capabilities

### **Business Tier** - $12/vehicle/month
- Unlimited vehicles (4+ recommended)
- Up to 6 team members
- Tax mileage tracking (IRS-compliant)
- Professional reporting & analytics
- Priority support

**Why these prices?** Personal tier = "coffee money" impulse purchase. Business tier = 65% below market average ($35/vehicle/month typical).

---

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15** - App Router with Server Components
- **TypeScript** - Full type safety
- **Tailwind CSS** - Professional design system
- **Chart.js** - Interactive fuel efficiency graphs

### **Backend**
- **Supabase** - PostgreSQL database with Row Level Security (RLS)
- **Supabase Auth** - Email/Password + Google OAuth
- **RESTful APIs** - Clean API architecture with proper error handling
- **Edge Functions** - Globally distributed backend

### **Hosting & DevOps**
- **Vercel** - Auto-deployment from GitHub main branch
- **GitHub Actions** - Automated CI/CD pipeline
- **Environment Management** - Secure .env.local configuration

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

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-YOUR-GA-ID-HERE
```

**Where to find Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Project Settings → API
3. Copy `Project URL` and `anon/public` key

### 4. Set Up Database Schema
Run these SQL files in **Supabase Dashboard → SQL Editor** (in order):

1. `supabase/01-create-user-profiles-table.sql` - User subscription data
2. `supabase/02-create-trigger.sql` - Auto-create profiles on signup
3. `supabase/03-update-test-users.sql` - Set up test accounts
4. `supabase/13-fix-handle-new-user-security.sql` - Security fix

**Test accounts will be created:**
- `test-free@fleetreq.com` / `TestFree123!` (Free tier)
- `test-personal@fleetreq.com` / `TestPersonal123!` (Personal tier)
- `test-business@fleetreq.com` / `TestBusiness123!` (Business tier)

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
│   ├── page.tsx                    # Landing page with pricing
│   ├── mileage/page.tsx            # Main dashboard application (2500+ lines)
│   ├── pricing/page.tsx            # Detailed pricing table
│   ├── components/
│   │   ├── BackgroundAnimation.tsx # Animated gradient background
│   │   └── UpgradePrompt.tsx       # Paywall overlays
│   ├── api/
│   │   ├── cars/route.ts           # Vehicle CRUD
│   │   ├── fill-ups/route.ts       # Fuel tracking
│   │   ├── maintenance/route.ts    # Maintenance records
│   │   └── stats/route.ts          # Public aggregate stats
│   └── globals.css                 # Design system & animations
├── components/
│   └── AuthComponent.tsx           # Authentication UI
├── lib/
│   ├── supabase.ts                 # Server-side Supabase clients
│   └── supabase-client.ts          # Client-side + helper functions
├── supabase/
│   └── *.sql                       # Database migrations
└── __tests__/
    └── lib/                        # Automated tests (46 passing)
```

---

## 🔐 Security & Best Practices

### **Row Level Security (RLS)**
Every table uses Supabase RLS policies:
- Users can ONLY see their own data
- Pattern: `auth.uid() = user_id` on all queries
- Admin users bypass limits in application logic (NOT database)

### **Authentication**
- Cookie-based sessions (NOT localStorage) for SSR compatibility
- Uses `@supabase/ssr` package for Next.js 15
- Google OAuth + Email/Password supported

### **Security Fixes Applied**
- ✅ Fixed `handle_new_user` function with `SET search_path = public`
- ✅ Prevents schema injection attacks
- ✅ CAPTCHA protection ready (enable in Supabase Dashboard)

---

## 🧪 Testing

### **Automated Tests**
```bash
npm test
```
- 46 tests passing
- Subscription logic tests
- Vehicle limit enforcement tests
- Database schema validation

### **Manual Testing**
Use `TESTING_CHECKLIST.md` for comprehensive browser testing:
1. Free tier limits (1 vehicle, view-only maintenance)
2. Personal tier features (3 vehicles, full maintenance)
3. Business tier unlimited access
4. Data isolation between accounts

---

## 🚀 Deployment

### **Automatic Deployment (Vercel)**
1. Push to `main` branch
2. Vercel auto-builds and deploys
3. Live at [fleetreq.vercel.app](https://fleetreq.vercel.app) in 2-3 minutes

### **Manual Deployment**
```bash
npm run build    # Build for production
npm run start    # Test production build locally
```

### **Environment Variables (Vercel)**
Add these in Vercel Dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GA_ID` (optional)

---

## 🔧 Troubleshooting

### **Port 3000 Required**
Google OAuth is configured for `http://localhost:3000/auth/callback`.
Running on 3001, 3002, etc. will break authentication.

### **"Your project's URL and Key are required"**
Missing `.env.local` file. Copy from `/d/Documents/coding/my-resume-site/.env.local` or create new one.

### **Data Not Showing After Login**
Check RLS policies in Supabase Dashboard → Authentication → Policies.
All tables should have `auth.uid() = user_id` policies.

### **OAuth Redirect Issues**
Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://fleetreq.vercel.app`
- Redirect URLs: `https://fleetreq.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

---

## 📊 Business Strategy

### **Target Market - Dual Funnel**
1. **Families** (Volume) - 100M+ potential users, $4/month Personal tier
2. **Small Contractors** (Revenue) - 6M businesses, $12/vehicle/month Business tier

### **Freemium Conversion Strategy**
Free tier is **intentionally limited** to prevent account sharing:
- View-only maintenance (can't add alerts)
- 90-day history limit
- Essential features behind paywall drives upgrades

### **Mobile Strategy (Phase 2)**
Free mobile app for massive App Store downloads → brand awareness → contractor discovery.

---

## 🎯 Roadmap

### **Immediate (Next Week)**
- [ ] Update browser tab icon (favicon)
- [ ] First-time UX improvements
- [ ] Data retention enforcement (90-day limit)
- [ ] Enable CAPTCHA protection

### **Short-term (Next Month)**
- [ ] Stripe billing integration
- [ ] Professional reporting (Business tier)
- [ ] Team invitation system
- [ ] Excel import tools for contractors

### **Medium-term (3-6 Months)**
- [ ] PWA/Mobile app launch
- [ ] Advanced analytics dashboard
- [ ] Custom branding (Business tier)
- [ ] Domain purchase (fleetreq.com)

---

## 📞 Contact & Support

- **Live Site**: [fleetreq.vercel.app](https://fleetreq.vercel.app)
- **GitHub**: [github.com/FleetReq/platform](https://github.com/FleetReq/platform)
- **Issues**: [GitHub Issues](https://github.com/FleetReq/platform/issues)

---

**FleetReq Platform** • **Next.js 15** • **TypeScript** • **Supabase**
*Professional vehicle management for families and small businesses*
