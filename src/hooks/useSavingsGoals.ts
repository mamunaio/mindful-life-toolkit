import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string | null;
  created_at: string;
}

export function useSavingsGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: goals = [] } = useQuery({
    queryKey: ["savings-goals", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals" as any)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any[]) as SavingsGoal[];
    },
  });

  const addGoal = useMutation({
    mutationFn: async (g: { name: string; target_amount: number; current_amount?: number; icon?: string }) => {
      const { error } = await supabase
        .from("savings_goals" as any)
        .insert({ ...g, user_id: uid! } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; current_amount?: number; name?: string; target_amount?: number }) => {
      const { error } = await supabase
        .from("savings_goals" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("savings_goals" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-goals"] }),
  });

  return {
    goals,
    addGoal: (g: { name: string; target_amount: number; current_amount?: number; icon?: string }) => addGoal.mutate(g),
    updateGoal: (id: string, u: Partial<SavingsGoal>) => updateGoal.mutate({ id, ...u }),
    deleteGoal: (id: string) => deleteGoal.mutate(id),
  };
}
