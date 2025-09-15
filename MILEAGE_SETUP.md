# Gas Mileage & Maintenance Tracker - Setup Guide

This guide will help you set up the full-stack mileage tracking application on your own deployment.

## Overview

The mileage tracker is a comprehensive full-stack application demonstrating SRE principles:
- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: GitHub OAuth via Supabase
- **Deployment**: Vercel (web) + Future Android app

## Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Supabase Account** - [Sign up here](https://supabase.com)
3. **GitHub Account** - For OAuth authentication
4. **Vercel Account** - For deployment (optional)

## Step 1: Supabase Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a database password and region
3. Wait for the project to be provisioned (2-3 minutes)

### Configure Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the contents of `database/schema.sql` from this project
3. Paste and execute the SQL to create all tables, policies, and functions
4. Verify the tables were created in the **Table Editor**

### Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **GitHub** provider
3. Add your GitHub OAuth app credentials:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Create a new OAuth app with callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### Get API Keys

1. Go to **Settings** → **API**
2. Copy your project URL and anon key
3. Save these for the next step

## Step 2: Local Development Setup

### Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 3: Test the Application

1. Navigate to `/mileage` on your local server
2. Click "Sign In with GitHub" to test authentication
3. Add a test car and fill-up record
4. Verify data appears in your Supabase dashboard

## Step 4: Deploy to Production

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy and test the production site

### Update OAuth Callback

1. In GitHub OAuth app settings, add your production URL:
   - `https://your-project.supabase.co/auth/v1/callback`
2. In Supabase Auth settings, add your production domain to allowed origins

## Step 5: Android App Development (Future)

The API is designed to support mobile app integration:

### API Endpoints Available

- `GET /api/cars` - List user's cars
- `POST /api/cars` - Add new car
- `GET /api/fill-ups?car_id=X` - Get fill-ups for a car
- `POST /api/fill-ups` - Add new fill-up
- `GET /api/maintenance?car_id=X` - Get maintenance records
- `POST /api/maintenance` - Add maintenance record
- `GET /api/stats` - Get user statistics
- `GET /api/stats?public=true` - Get public statistics

### Android Development Notes

1. Use Supabase Android SDK for authentication
2. Make HTTP requests to your deployed API endpoints
3. Implement offline capability with local SQLite cache
4. Sync data when network is available

## Features Implemented

### Core Features
- ✅ Vehicle management (add, edit, delete)
- ✅ Fuel tracking with automatic MPG calculation
- ✅ Maintenance record keeping
- ✅ User authentication (GitHub OAuth)
- ✅ Public statistics dashboard
- ✅ Real-time data updates

### SRE Features
- ✅ Row Level Security (RLS) for data isolation
- ✅ Automated database triggers for calculations
- ✅ API error handling and validation
- ✅ Performance optimized queries with indexes
- ✅ Comprehensive logging
- ✅ Multi-tenant architecture

### Analytics & Monitoring
- ✅ Public stats widget for portfolio showcase
- ✅ User-specific analytics dashboard
- ✅ MPG trends and insights
- ✅ Maintenance scheduling reminders

## Database Schema

### Tables Created

1. **profiles** - User profile data (extends Supabase auth.users)
2. **cars** - Vehicle information
3. **fill_ups** - Gas fill-up records with MPG calculations
4. **maintenance_records** - Maintenance and repair records

### Key Features

- **Automatic MPG Calculation**: SQL trigger calculates MPG based on odometer readings
- **Row Level Security**: Users can only access their own data
- **Public Statistics**: Anonymized aggregate data for portfolio display
- **Referential Integrity**: Proper foreign key relationships with cascade deletes

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify GitHub OAuth app configuration
   - Check Supabase allowed origins
   - Ensure callback URLs match exactly

2. **Database Errors**
   - Verify schema was applied correctly
   - Check RLS policies are enabled
   - Ensure user has proper permissions

3. **API Errors**
   - Check environment variables are set
   - Verify Supabase connection
   - Review browser network tab for error details

### Getting Help

1. Check Supabase logs in dashboard
2. Review browser console for client-side errors
3. Test API endpoints directly in browser or Postman
4. Verify database data in Supabase Table Editor

## Security Considerations

- All API routes require authentication
- Row Level Security prevents data leakage
- Environment variables protect sensitive keys
- OAuth provides secure authentication flow
- No sensitive data in client-side code

## Future Enhancements

- 📱 Android mobile application
- 📊 Advanced analytics and charts
- 🔔 Maintenance reminder notifications
- 📸 Photo uploads for maintenance records
- 🌍 Multi-language support
- 📤 Data export functionality
- 🔄 Data import from other apps

This project demonstrates full-stack SRE capabilities including database design, API development, authentication, security, and scalable architecture suitable for both web and mobile platforms.