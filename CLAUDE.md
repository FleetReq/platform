# FleetReq Platform - Development Context

> **IMPORTANT**: This is the FleetReq business application repository.
> For cross-repository context, see `/d/Documents/coding/CLAUDE.md`

## 🎯 Repository Information

**Repository**: `/d/Documents/coding/fleetreq-platform`
- **GitHub**: `git@github.com:FleetReq/platform.git`
- **Live Site**: https://fleetreq.vercel.app
- **Deployment**: Vercel (auto-deploys from main branch)
- **Status**: ✅ Active Development

## 🚀 FleetReq Platform Overview

### **Product Vision**
Professional Vehicle Fleet Management & Maintenance Platform targeting "Excel Refugees" - small contractors and service businesses (5-15 vehicles).

### **💰 Pricing Tiers**

**Free Tier (Lead Generation)**:
- 1 vehicle maximum
- 1 user
- Basic fuel tracking & MPG analysis
- **View-only** maintenance status
- 90-day data history
- Web access only

**Personal Tier ($4/month)**:
- Up to 3 vehicles
- 1 user
- Everything in Free
- **Full maintenance tracking & alerts** (add/edit)
- Unlimited data history
- Mobile app access (future)
- Fuel efficiency analytics
- Export capabilities

**Business Tier ($12/vehicle/month)**:
- Unlimited vehicles
- Up to 6 team members
- Everything in Personal
- Team collaboration
- Tax mileage tracking
- Professional reporting
- Advanced mobile features
- Priority support

### **🎨 Premium Features Roadmap (Business Plan)**
- Custom Branding: Company logo, custom colors, branded reports
- Custom Dashboard Layouts: Personalized configurations
- Advanced Reporting: Tax reports, fleet analytics
- White-Label (Future Enterprise): Full rebranding for resellers

## 📊 Technical Architecture

### **Tech Stack**
- **Framework**: Next.js 15 with App Router, TypeScript
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Hosting**: Vercel
- **Analytics**: Google Analytics 4

### **Database Structure**
- `user_profiles`: User subscription plans and limits
- `cars`: Vehicle information (owner_id references auth.users)
- `fill_ups`: Fuel tracking records
- `maintenance_records`: Maintenance tracking
- `public_stats`: Aggregate statistics for marketing

### **Key Files**
- `app/mileage/page.tsx`: Main dashboard application
- `components/AuthComponent.tsx`: Authentication UI
- `lib/supabase-client.ts`: Database client & helper functions
- `app/api/*`: Backend API routes
- `supabase/*.sql`: Database migration scripts

## 🔐 Admin System

**Admin Users** (hardcoded in `lib/supabase-client.ts`):
- `deeahtee@live.com` (User ID: `b73a07b2-ed72-41b1-943f-e119afc9eddb`)

**Admin Privileges**:
- Bypass all subscription checks
- Access to all features regardless of database subscription
- Purple "ADMIN" badge in UI
- Full data access for testing

## 🧪 Test Accounts

**Test Users for Development**:
1. **Free**: `test-free@fleetreq.com` (Password: `TestFree123!`)
   - User ID: `644bd072-4d14-4a91-91eb-675d1406c537`
   - Subscription: `free`

2. **Personal**: `test-personal@fleetreq.com` (Password: `TestPersonal123!`)
   - User ID: `36df4089-6b72-4efc-9328-0e346a96c9c2`
   - Subscription: `personal`

3. **Business**: `test-business@fleetreq.com` (Password: `TestBusiness123!`)
   - User ID: `3317f330-c980-4f02-8587-4194f20906a5`
   - Subscription: `business`

## 🚨 Critical Issues to Fix (Identified 2025-10-01)

### **1. Data Isolation**
**Problem**: Test users can see admin's vehicles (2006 Camry)
**Impact**: Privacy breach, users see data that doesn't belong to them
**Fix Required**: Implement proper Row Level Security (RLS) or filter by owner_id
**Priority**: 🔴 CRITICAL

### **2. Free Tier Permissions**
**Problem**: Free users can't access Add Car, Add Fill-up, Records tabs
**Expected**: Free users SHOULD be able to add 1 vehicle and track fuel
**Current**: Tabs are disabled for free users
**Fix Required**: Update tab permission logic to allow free users access
**Priority**: 🔴 CRITICAL

### **3. Vehicle Limit Enforcement**
**Problem**: No enforcement of 1 vehicle limit for free tier
**Expected**: After adding 1 vehicle, show "1/1 limit reached - Upgrade to add more"
**Fix Required**:
- Check vehicle count before allowing Add Car
- Gray out tab with upgrade prompt when limit reached
- Show current count (e.g., "Add Car (1/1)")
**Priority**: 🟡 HIGH

### **4. Maintenance Tracking Permissions**
**Problem**: Free tier should have VIEW-ONLY maintenance, not full access
**Expected**:
- Free: Can VIEW maintenance status only
- Personal+: Can ADD/EDIT maintenance records
**Fix Required**: Split "Add Maintenance" tab into view/edit permissions
**Priority**: 🟡 HIGH

### **5. Maintenance Status Paywall Overlay**
**Problem**: Overlay is slightly off-center (below the content)
**Fix Required**: Adjust CSS positioning to perfectly center overlay
**Priority**: 🟢 MEDIUM

### **6. First-Time User Experience**
**Problem**: New users land on empty Dashboard/Graph tab
**Expected**: If user has 0 vehicles, redirect to "Add Car" tab automatically
**Fix Required**: Add useEffect to check vehicle count and redirect
**Priority**: 🟢 MEDIUM

### **7. Delete Car Feature**
**Problem**: Users have no way to delete vehicles
**Expected**: Settings tab should have "Delete Car" section with:
- List of user's vehicles
- Delete button for each
- Confirmation dialog: "This will delete all fuel and maintenance data"
**Fix Required**: Add delete functionality to Settings tab
**Priority**: 🟢 MEDIUM

## 📝 Recent Changes (2025-10-01)

### **✅ Completed**
1. Added admin role system with `isAdmin()` function
2. Created user_profiles table with subscription_plan column
3. Set up test users (free, personal, business)
4. Added "Welcome, [username]" message with ADMIN badge
5. Removed large "Vehicle Analytics" header to save space
6. Optimized font loading (removed unused Geist_Mono)
7. Fixed pricing display for Business plan annual pricing

### **🔧 Configuration Files**
- `supabase/00-fix-user-profiles.sql`: Adds subscription columns
- `supabase/02-create-trigger.sql`: Auto-creates profiles for new users
- `supabase/03-update-test-users.sql`: Sets subscription tiers

## 🔄 Development Workflow

### **Working on FleetReq**
```bash
cd /d/Documents/coding/fleetreq-platform
npm run dev  # Runs on localhost:3000 (required for OAuth)
```

### **Database Changes**
1. Make changes in Supabase Dashboard
2. Test with test accounts
3. Document in SQL files under `supabase/`
4. Update CLAUDE.md with any schema changes

### **Deployment**
- Push to `main` branch → auto-deploys to fleetreq.vercel.app
- Vercel handles builds automatically
- Check deployment logs if issues occur

## 🎯 Next Priorities

**Immediate (Current Session)**:
1. 🔴 Fix data isolation (users should only see their own data)
2. 🔴 Fix free tier permissions (allow Add Car, Fill-up, Records)
3. 🟡 Implement vehicle limit enforcement
4. 🟡 Split maintenance into view/edit permissions
5. 🟢 Add delete car functionality
6. 🟢 Improve first-time UX (redirect to Add Car)
7. 🟢 Center maintenance paywall overlay

**Short-term (Next Week)**:
- Data retention enforcement (90 days for free)
- Professional reporting features (Business plan)
- Team invitation system (Business plan)
- Excel import for contractor migration

**Medium-term (Next Month)**:
- Stripe billing integration
- Custom branding features (Business plan)
- Mobile PWA development
- Advanced analytics dashboard

---

*Last Updated: 2025-10-01*
*Current Session: Feature gating and permissions fixes*
*Status: Active bug fixing and feature implementation*
