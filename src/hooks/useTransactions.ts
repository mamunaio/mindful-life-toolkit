import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string | null;
  date: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (t: Omit<Transaction, "id">) => {
      const { error } = await supabase.from("transactions").insert({ ...t, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  return {
    transactions,
    addTransaction: (t: Omit<Transaction, "id">) => addMutation.mutate(t),
    deleteTransaction: (id: string) => deleteMutation.mutate(id),
  };
}
