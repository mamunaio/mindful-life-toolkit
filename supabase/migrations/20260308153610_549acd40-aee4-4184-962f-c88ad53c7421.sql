
-- Add new columns to tasks table
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_pattern text;

-- Create subtasks table
CREATE TABLE public.subtasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subtasks" ON public.subtasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subtasks" ON public.subtasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subtasks" ON public.subtasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subtasks" ON public.subtasks FOR DELETE USING (auth.uid() = user_id);
