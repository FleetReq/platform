-- Create heartbeat table for keep-alive activity tracking
-- This ensures Supabase recognizes write activity to prevent auto-pause

CREATE TABLE IF NOT EXISTS public.heartbeat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pinged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'cron',
  metadata JSONB
);

-- Add index for efficient cleanup of old records
CREATE INDEX IF NOT EXISTS idx_heartbeat_pinged_at ON public.heartbeat(pinged_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.heartbeat ENABLE ROW LEVEL Security;

-- Allow service role to manage heartbeat records
-- Note: This table is system-managed, not user-accessible
CREATE POLICY "Service role can manage heartbeat"
  ON public.heartbeat
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.heartbeat IS 'System table for tracking database activity to prevent auto-pause on free tier. Managed by cron jobs.';
COMMENT ON COLUMN public.heartbeat.pinged_at IS 'Timestamp when the keep-alive ping occurred';
COMMENT ON COLUMN public.heartbeat.source IS 'Source of the ping (e.g., cron, manual, vercel)';
COMMENT ON COLUMN public.heartbeat.metadata IS 'Additional metadata about the ping (operations performed, etc.)';
