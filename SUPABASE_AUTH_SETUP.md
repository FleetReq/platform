# Supabase Auth Configuration

## Required Steps to Complete Auth Migration

### 1. Enable Auth Providers in Supabase Dashboard

Go to your Supabase dashboard: https://supabase.com/dashboard/project/nzdbsumrqnwipamdzuei

Navigate to **Authentication > Providers**

#### Enable Email/Password Auth:
1. **Email** should already be enabled (default)
2. Ensure **"Enable email confirmations"** is checked
3. Set **"Confirm email template"** if desired

#### Enable Google OAuth:
1. Click on **Google** provider
2. Enable **"Google enabled"**
3. You'll need to create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://nzdbsumrqnwipamdzuei.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

#### Keep GitHub OAuth (Temporary):
1. Keep **GitHub** enabled for existing user migration
2. Will be removed after successful migration

### 2. Run Database Migration

Execute the migration script in Supabase SQL Editor:

```sql
-- Copy and paste contents of database/auth_migration_strategy.sql
```

**IMPORTANT**: Update the email in the script to your actual email address before running.

### 3. Test Authentication

1. Visit: http://localhost:3000/mileage
2. You should see the new auth component with:
   - Email/Password forms
   - Google sign-in button
   - GitHub sign-in button (legacy, temporary)

### 4. Admin User Migration Plan

Your current admin user ID: `b73a07b2-ed72-41b1-943f-e119afc9eddb`

**Option A: Email Link (Recommended)**
1. Sign up with your email using the new email/password flow
2. I'll help you migrate your admin status to the new user ID
3. All your existing data will be preserved

**Option B: GitHub Migration**
1. Continue using GitHub OAuth temporarily
2. Later link your GitHub account to an email account
3. Migrate admin status seamlessly

### 5. Production Deployment

Once testing is complete:
1. The changes will auto-deploy to Vercel
2. Your live site will use the new auth system
3. Users can choose between email/password or Google sign-in

## Security Notes

- Email confirmations are enabled for security
- Google OAuth uses secure redirect URIs
- GitHub OAuth remains as backup during migration
- All auth state is managed by Supabase (secure by default)

## Business Benefits

- **Professional UX**: Email/password + Google appeals to business users
- **Easier Onboarding**: No GitHub account required for contractors
- **Mobile Friendly**: Works perfectly on phones/tablets
- **Scalable**: Supports team invites and user management