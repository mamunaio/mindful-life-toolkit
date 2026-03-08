
-- Proposals & Contracts table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'proposal', -- proposal | contract
  status TEXT NOT NULL DEFAULT 'draft', -- draft | sent | accepted | rejected | expired
  template TEXT NOT NULL DEFAULT 'standard', -- standard | detailed | minimal
  scope TEXT,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  timeline TEXT,
  payment_terms TEXT,
  total_amount NUMERIC,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own proposals" ON public.proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proposals" ON public.proposals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own proposals" ON public.proposals FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
