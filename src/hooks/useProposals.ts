import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Proposal {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  title: string;
  type: "proposal" | "contract";
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  template: string;
  scope: string | null;
  deliverables: { item: string; done?: boolean }[];
  timeline: string | null;
  payment_terms: string | null;
  total_amount: number | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProposals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Proposal[];
    },
  });

  const addProposal = useMutation({
    mutationFn: async (p: Omit<Proposal, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("proposals")
        .insert({ ...p, user_id: uid!, deliverables: JSON.stringify(p.deliverables) } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<Proposal, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const payload: any = { ...updates };
      if (updates.deliverables) payload.deliverables = JSON.stringify(updates.deliverables);
      const { error } = await supabase.from("proposals").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const convertToProject = async (proposal: Proposal, addProject: (p: any) => void) => {
    addProject({
      name: proposal.title,
      client_id: proposal.client_id,
      description: proposal.scope || null,
      status: "active",
      budget: proposal.total_amount,
      deadline: proposal.valid_until,
    });
    await updateProposal.mutateAsync({ id: proposal.id, status: "accepted" });
  };

  return {
    proposals,
    addProposal: (p: Omit<Proposal, "id" | "user_id" | "created_at" | "updated_at">) => addProposal.mutateAsync(p),
    updateProposal: (id: string, u: Partial<Omit<Proposal, "id" | "user_id" | "created_at" | "updated_at">>) => updateProposal.mutate({ id, ...u }),
    deleteProposal: (id: string) => deleteProposal.mutate(id),
    convertToProject,
  };
}
