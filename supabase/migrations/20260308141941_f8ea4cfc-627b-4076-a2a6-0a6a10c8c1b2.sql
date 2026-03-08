
-- Add completion tracking to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS completion_percent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Create project notes/updates log
CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project notes" ON public.project_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project notes" ON public.project_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own project notes" ON public.project_notes FOR DELETE USING (auth.uid() = user_id);

-- Drop reviews table
DROP TABLE IF EXISTS public.client_reviews;
