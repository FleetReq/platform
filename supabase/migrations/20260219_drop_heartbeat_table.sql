-- Drop the heartbeat table — no longer needed after removing the keep-alive cron job
DROP TABLE IF EXISTS public.heartbeat;
