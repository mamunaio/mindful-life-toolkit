
CREATE TABLE public.personal_dues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'owed_to_me',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_dues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dues" ON public.personal_dues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dues" ON public.personal_dues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dues" ON public.personal_dues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dues" ON public.personal_dues FOR DELETE USING (auth.uid() = user_id);
