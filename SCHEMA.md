# FleetReq Database Schema

> **CRITICAL**: Always verify column names against this schema before writing to the database.
> Last Updated: 2026-02-16

---

## Table of Contents
1. [auth.users](#authusers) (Supabase managed)
2. [user_profiles](#user_profiles)
3. [organizations](#organizations) (NEW)
4. [org_members](#org_members) (NEW)
5. [cars](#cars)
6. [fill_ups](#fill_ups)
7. [maintenance_records](#maintenance_records)
8. [heartbeat](#heartbeat) (system table)

---

## auth.users
**Managed by Supabase Auth** - Do not modify directly

- `id` - uuid (primary key)
- `email` - text
- `encrypted_password` - text
- `email_confirmed_at` - timestamp
- `created_at` - timestamp
- `updated_at` - timestamp
- User metadata stored in `raw_user_meta_data` and `raw_app_meta_data`

---

## user_profiles

**User metadata and preferences**

```sql
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NULL,
  full_name text NULL,
  avatar_url text NULL,
  github_id text NULL,
  is_admin boolean NULL DEFAULT false,
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  notification_frequency text NOT NULL DEFAULT 'weekly',
  notification_warning_enabled boolean NOT NULL DEFAULT true,
  last_notification_sent_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),

  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_github_id_key UNIQUE (github_id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id)
)
```

**RLS Policies:**
- `user_profiles_select_policy` - Users can only view their own profile
- `user_profiles_insert_policy` - Users can create their own profile
- `user_profiles_update_policy` - Users can only update their own profile

**Key Columns:**
- `id` - Links to auth.users.id (one-to-one)
- `is_admin` - Bypass all limits, show purple badge
- `email_notifications_enabled` - Whether user receives maintenance reminder emails (default true)
- `notification_frequency` - How often to re-send overdue alerts for paid users: 'daily' | 'weekly' | 'monthly' (default 'weekly'). Free = one-time only.
- `notification_warning_enabled` - Whether to send warning (approaching due) emails. Family/Business only (default true).
- `last_notification_sent_at` - Timestamp of last notification email sent

> **Note:** Subscription/billing fields have moved to the `organizations` table.

---

## organizations

**Multi-tenant organizations for team/fleet management**

```sql
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Organization',
  slug text NULL,
  subscription_plan text NOT NULL DEFAULT 'free',
  max_vehicles integer NOT NULL DEFAULT 1,
  max_members integer NOT NULL DEFAULT 1,
  stripe_customer_id text NULL,
  subscription_end_date timestamp with time zone NULL,
  cancellation_requested_at timestamp with time zone NULL,
  scheduled_deletion_date timestamp with time zone NULL,
  cancellation_reason text NULL,
  pending_downgrade_tier text NULL,
  downgrade_effective_date timestamp with time zone NULL,
  downgrade_requested_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),

  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_subscription_plan_check CHECK (
    subscription_plan = ANY (ARRAY['free'::text, 'personal'::text, 'business'::text])
  ),
  CONSTRAINT organizations_pending_downgrade_tier_check CHECK (
    pending_downgrade_tier IN ('free', 'personal')
  )
)
```

**Indexes:**
- `idx_organizations_stripe_customer_id` on `stripe_customer_id`

**RLS Policies:**
- `org_members_can_view_org` - Org members can SELECT their org
- `org_owners_can_update_org` - Only owners can UPDATE their org

**RLS Helper Functions:**
```sql
-- Returns org IDs where user is any member
CREATE FUNCTION user_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns org IDs where user is editor or owner
CREATE FUNCTION user_editor_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns org IDs where user is owner
CREATE FUNCTION user_owner_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role = 'owner'
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Key Columns:**
- `subscription_plan` - 'free' | 'personal' | 'business'
- `max_vehicles` - Enforced limit (1 for free, 3 for personal/family, 999 for business)
- `max_members` - Max members (1 for free, 3 for personal/family, 6 for business)
- `stripe_customer_id` - Stripe customer ID for billing
- `subscription_end_date` - Date when subscription ends/renews
- `pending_downgrade_tier` - The tier org is downgrading to ('free' | 'personal' | null)
- `downgrade_effective_date` - Date when downgrade takes effect

**Tier Limits:**

| | Free | Family (personal) | Business |
|---|---|---|---|
| Vehicles | 1 | 3 | Unlimited (999) |
| Members | 1 | 3 | 6 |
| DB plan value | 'free' | 'personal' | 'business' |

---

## org_members

**Organization membership and invitations**

```sql
CREATE TABLE public.org_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NULL,
  role text NOT NULL DEFAULT 'viewer',
  invited_email text NULL,
  invited_at timestamp with time zone NULL,
  accepted_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),

  CONSTRAINT org_members_pkey PRIMARY KEY (id),
  CONSTRAINT org_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT org_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT org_members_role_check CHECK (role IN ('owner', 'editor', 'viewer'))
)
```

**Indexes:**
- `idx_org_members_org_user` - UNIQUE on `(org_id, user_id)` WHERE `user_id IS NOT NULL`
- `idx_org_members_org_email` - UNIQUE on `(org_id, invited_email)` WHERE `invited_email IS NOT NULL`
- `idx_org_members_user_id` on `user_id`

**RLS Policies:**
- `org_members_can_view_members` - Members can view members of their own org
- `users_can_view_own_invites` - Users can see pending invites matching their email
- `org_owners_can_insert_members` - Owners can invite new members
- `org_owners_can_update_members` - Owners can update member roles
- `users_can_accept_own_invite` - Invited users can accept their own pending invite
- `org_owners_can_delete_members` - Owners can remove members

**Key Columns:**
- `org_id` - FK to organizations
- `user_id` - FK to auth.users (NULL for pending invites)
- `role` - 'owner' | 'editor' | 'viewer'
- `invited_email` - Email for pending invites (NULL for accepted members)

**Roles:**
- **Owner** - Full access: billing, manage members, CRUD all data, delete cars
- **Editor** - Can create/update vehicles, fill-ups, maintenance, trips
- **Viewer** - Read-only access to all org data

---

## cars

**Organization vehicles**

```sql
CREATE TABLE public.cars (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text NULL,
  license_plate text NULL,
  nickname text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  current_mileage integer NULL,

  CONSTRAINT cars_pkey PRIMARY KEY (id),
  CONSTRAINT cars_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT cars_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT cars_year_check CHECK ((year >= 1900) AND (year <= 2030))
)
```

**Indexes:**
- `idx_cars_user_id` on `user_id`
- `idx_cars_org_id` on `org_id`
- `idx_cars_current_mileage` on `current_mileage`

**Triggers:**
- `update_cars_updated_at` - Auto-updates `updated_at` timestamp

**RLS Policies (org-based):**
- `cars_select` - Org members can view cars in their org
- `cars_insert` - Editors/owners can create cars
- `cars_update` - Editors/owners can update cars
- `cars_delete` - Owners only can delete cars

**Key Columns:**
- `user_id` - User who created the vehicle (creator, not access control)
- `org_id` - Organization the vehicle belongs to (access control)
- `current_mileage` - Automatically updated from fill_ups/maintenance records

---

## fill_ups

**Fuel tracking records**

```sql
CREATE TABLE public.fill_ups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading integer NOT NULL,
  gallons numeric(6, 3) NOT NULL,
  price_per_gallon numeric(5, 3) NULL,
  total_cost numeric(8, 2) NULL,
  gas_station text NULL,
  location text NULL,
  notes text NULL,
  miles_driven integer NULL,
  mpg numeric(5, 2) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  fuel_type character varying(20) NULL DEFAULT NULL,
  created_by_user_id uuid NULL,
  receipt_urls text[] NOT NULL DEFAULT '{}',

  CONSTRAINT fill_ups_pkey PRIMARY KEY (id),
  CONSTRAINT fill_ups_car_id_fkey FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE,
  CONSTRAINT fk_fill_ups_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES auth.users (id),
  CONSTRAINT fill_ups_gallons_check CHECK (gallons > 0),
  CONSTRAINT fill_ups_odometer_reading_check CHECK (odometer_reading >= 0),
  CONSTRAINT fill_ups_price_per_gallon_check CHECK (price_per_gallon IS NULL OR price_per_gallon > 0),
  CONSTRAINT fill_ups_total_cost_check CHECK (total_cost IS NULL OR total_cost > 0),
  CONSTRAINT fill_ups_receipt_urls_max_5 CHECK (array_length(receipt_urls, 1) IS NULL OR array_length(receipt_urls, 1) <= 5)
)
```

**Indexes:**
- `idx_fill_ups_car_id` on `car_id`
- `idx_fill_ups_date` on `date`
- `idx_fill_ups_fuel_type` on `fuel_type`
- `idx_fill_ups_created_by_user_id` on `created_by_user_id`
- `idx_fill_ups_miles_driven` on `miles_driven`

**Triggers:**
- `update_fill_ups_updated_at` - Auto-updates `updated_at` timestamp
- `calculate_fill_up_mpg` - Auto-calculates `mpg` field on INSERT/UPDATE

**RLS Policies (org-based):**
- `fill_ups_select` - Org members can view fill-ups for cars in their org
- `fill_ups_insert` - Editors/owners can create fill-ups
- `fill_ups_update` - Editors/owners can update fill-ups
- `fill_ups_delete` - Owners only can delete fill-ups

**Key Columns:**
- `car_id` - Links to cars table
- `created_by_user_id` - User who created the record (audit trail)
- `miles_driven` - Miles driven since last fill-up (optional, used for MPG calculation)
- `mpg` - **AUTO-CALCULATED by trigger** from `miles_driven / gallons`
- `receipt_urls` - Array of Supabase Storage paths for receipt photos (max 5). Personal+ only.

---

## maintenance_records

**Vehicle maintenance tracking**

```sql
CREATE TABLE public.maintenance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL,
  description text NULL,
  cost numeric(8, 2) NULL,
  mileage integer NULL,
  service_provider text NULL,
  location text NULL,
  next_service_date date NULL,
  next_service_mileage integer NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  oil_type character varying(20) NULL DEFAULT NULL,
  created_by_user_id uuid NULL,
  receipt_urls text[] NOT NULL DEFAULT '{}',
  source_record_id uuid NULL,

  CONSTRAINT maintenance_records_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_records_car_id_fkey FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE,
  CONSTRAINT fk_maintenance_records_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES auth.users (id),
  CONSTRAINT maintenance_records_source_record_fkey FOREIGN KEY (source_record_id) REFERENCES maintenance_records (id) ON DELETE CASCADE,
  CONSTRAINT maintenance_records_receipt_urls_max_5 CHECK (array_length(receipt_urls, 1) IS NULL OR array_length(receipt_urls, 1) <= 5),
  CONSTRAINT maintenance_records_type_check CHECK (
    type = ANY (ARRAY[
      'oil_change'::text,
      'tire_rotation'::text,
      'tire_change'::text,
      'brake_pads'::text,
      'rotors'::text,
      'air_filter'::text,
      'transmission_service'::text,
      'coolant_flush'::text,
      'brake_fluid_flush'::text,
      'spark_plugs'::text,
      'battery'::text,
      'cabin_air_filter'::text,
      'serpentine_belt'::text,
      'differential_fluid'::text,
      'wipers'::text,
      'registration'::text
    ])
  ),
  CONSTRAINT maintenance_records_cost_check CHECK (cost >= 0),
  CONSTRAINT maintenance_records_check CHECK (next_service_mileage >= mileage),
  CONSTRAINT maintenance_records_mileage_check CHECK (mileage >= 0)
)
```

**Indexes:**
- `idx_maintenance_records_car_id` on `car_id`
- `idx_maintenance_records_date` on `date`
- `idx_maintenance_records_type` on `type`
- `idx_maintenance_records_oil_type` on `oil_type`
- `idx_maintenance_records_created_by_user_id` on `created_by_user_id`
- `idx_maintenance_records_source_record_id` on `source_record_id`

**Triggers:**
- `update_maintenance_records_updated_at` - Auto-updates `updated_at` timestamp
- `auto_tire_rotation_on_tire_change` - Auto-creates a `tire_rotation` record when a `tire_change` is inserted

**RLS Policies (org-based):**
- `maintenance_records_select` - Org members can view records for cars in their org
- `maintenance_records_insert` - Editors/owners can create records
- `maintenance_records_update` - Editors/owners can update records
- `maintenance_records_delete` - Owners only can delete records

**Key Columns:**
- `car_id` - Links to cars table
- `created_by_user_id` - User who created the record (audit trail)
- `type` - Must be one of 16 valid maintenance types (see CHECK constraint)
- `oil_type` - Only relevant for oil_change type
- `source_record_id` - Links auto-created records to their source
- `receipt_urls` - Array of Supabase Storage paths for receipt photos (max 5). Personal+ only.

---

## heartbeat

**System table for Supabase keep-alive**

```sql
CREATE TABLE public.heartbeat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pinged_at timestamptz NOT NULL DEFAULT NOW(),
  source text NOT NULL DEFAULT 'cron',
  metadata jsonb
)
```

**Purpose:** Prevents Supabase free-tier auto-pause by tracking database activity

**Managed By:**
- `.github/workflows/keep-alive.yml` - GitHub Actions cron (every 4 hours)
- `app/api/cron/keep-alive/route.ts` - API endpoint

---

## Storage: receipts bucket

**Private storage bucket for receipt photos**

```sql
-- Bucket config
id: 'receipts'
public: false
file_size_limit: 2097152 (2MB)
allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
```

**Path Convention:** `{org_id}/{record_type}/{record_uuid}/{filename}`

**RLS Policies (org-based):**
- Org members can view receipts for their org
- Editors/owners can upload receipts
- Owners can delete receipts

---

## Common Patterns

### Access Control
- **Organization-based** - All data access is through org membership
- **cars.org_id** - Determines which org a vehicle belongs to
- **org_members** - Determines user's role within an org
- **user_id fields** - Used for audit/creator tracking, NOT access control

### Roles
- **Owner** - billing, members, full CRUD, delete
- **Editor** - create/update vehicles and records
- **Viewer** - read-only

### Timestamps
All tables have:
- `created_at` - Auto-set on INSERT
- `updated_at` - Auto-updated via trigger on UPDATE

### Cascade Deletes
- Deleting an org → Deletes org_members
- Deleting a car → Deletes fill_ups and maintenance_records
- Deleting a user → Deletes their cars, profiles, org_members

### Auto-Calculated Fields
- `fill_ups.mpg` - Calculated by `calculate_mpg()` trigger
- DO NOT manually insert values for auto-calculated fields

---

## Important Notes

1. **Access control uses `org_id`** not `user_id` — all queries filter by org membership
2. **Cars table has both `user_id` (creator) and `org_id` (access control)**
3. **MPG is auto-calculated** - don't insert it manually
4. **Maintenance types are constrained** - 16 valid values allowed
5. **Foreign keys cascade delete** - deleting a car removes all associated records
6. **DB stores 'personal'** but UI displays as "Family"
