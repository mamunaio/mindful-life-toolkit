
ALTER TABLE public.health_days
  ADD COLUMN IF NOT EXISTS sleep_hours numeric NULL,
  ADD COLUMN IF NOT EXISTS sleep_quality text NULL,
  ADD COLUMN IF NOT EXISTS energy text NULL,
  ADD COLUMN IF NOT EXISTS workout_note text NULL;
