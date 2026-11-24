-- Single-row table written to daily by the Vercel cron at /api/cron/keep-alive/
-- so the Supabase Free Plan sees real database activity and does not auto-pause.
-- Only the service role (which bypasses RLS) touches it; RLS with no policies
-- blocks anon and authenticated access entirely.

CREATE TABLE IF NOT EXISTS public.keep_alive (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_ping_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'vercel-cron'
);

ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY;

INSERT INTO public.keep_alive (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.keep_alive IS 'System table: daily keep-alive write from Vercel cron to prevent Supabase Free Plan pausing. Service role only.';
