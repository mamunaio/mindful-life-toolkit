import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ClientReview {
  id: string;
  client_id: string | null;
  project_id: string | null;
  rating: number;
  comment: string | null;
  client_name: string;
  project_name: string | null;
  created_at: string;
}

export function useReviews() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: reviews = [] } = useQuery({
    queryKey: ["client-reviews", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClientReview[];
    },
  });

  const addReview = useMutation({
    mutationFn: async (r: Omit<ClientReview, "id" | "created_at">) => {
      const { error } = await supabase
        .from("client_reviews")
        .insert({ ...r, user_id: uid! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-reviews"] }),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_reviews")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-reviews"] }),
  });

  return {
    reviews,
    addReview: (r: Omit<ClientReview, "id" | "created_at">) => addReview.mutate(r),
    deleteReview: (id: string) => deleteReview.mutate(id),
  };
}
