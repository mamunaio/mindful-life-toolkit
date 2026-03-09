
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS project_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS estimated_hours numeric NULL,
  ADD COLUMN IF NOT EXISTS time_spent numeric NOT NULL DEFAULT 0;
