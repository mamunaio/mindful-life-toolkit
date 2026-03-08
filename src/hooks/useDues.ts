import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PersonalDue {
  id: string;
  name: string;
  amount: number;
  type: "owed_to_me" | "i_owe";
  description: string | null;
  status: string;
  date: string;
  created_at: string;
}

export function useDues() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: dues = [] } = useQuery({
    queryKey: ["personal-dues", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_dues" as any)
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as any[]) as PersonalDue[];
    },
  });

  const addDue = useMutation({
    mutationFn: async (d: Omit<PersonalDue, "id" | "created_at">) => {
      const { error } = await supabase
        .from("personal_dues" as any)
        .insert({ ...d, user_id: uid! } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personal-dues"] }),
  });

  const updateDue = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string }) => {
      const { error } = await supabase
        .from("personal_dues" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personal-dues"] }),
  });

  const deleteDue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("personal_dues" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personal-dues"] }),
  });

  return {
    dues,
    addDue: (d: Omit<PersonalDue, "id" | "created_at">) => addDue.mutate(d),
    updateDue: (id: string, u: { status?: string }) => updateDue.mutate({ id, ...u }),
    deleteDue: (id: string) => deleteDue.mutate(id),
  };
}
