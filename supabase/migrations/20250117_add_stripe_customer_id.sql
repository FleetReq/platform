-- Add Stripe customer ID to user_profiles table
-- This allows us to link Supabase users to their Stripe customer records

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Add index for faster lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id
ON public.user_profiles(stripe_customer_id);

-- Add comment
COMMENT ON COLUMN public.user_profiles.stripe_customer_id IS 'Stripe customer ID for billing (cus_...)';
