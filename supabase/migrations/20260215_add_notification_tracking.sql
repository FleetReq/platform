-- Track which maintenance status transitions have been notified per user/car/type.
-- Prevents re-sending the same alert. Only new transitions trigger emails.

CREATE TABLE public.maintenance_notifications_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  status_notified text NOT NULL, -- 'warning' or 'overdue'
  notified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, car_id, maintenance_type, status_notified)
);

-- Index for fast lookup during cron job
CREATE INDEX idx_notifications_sent_user_id ON public.maintenance_notifications_sent(user_id);

-- RLS: service_role only (system table, like heartbeat)
ALTER TABLE public.maintenance_notifications_sent ENABLE ROW LEVEL SECURITY;
