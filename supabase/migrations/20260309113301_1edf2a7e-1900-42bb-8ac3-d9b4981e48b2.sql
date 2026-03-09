
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS job_source_url text NULL,
  ADD COLUMN IF NOT EXISTS portfolio_links jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS is_billable boolean NOT NULL DEFAULT true;
