import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeBase() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: notes = [] } = useQuery({
    queryKey: ["kb-notes", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes" as any)
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((n) => ({
        ...n,
        tags: Array.isArray(n.tags) ? n.tags : [],
      })) as Note[];
    },
  });

  const addNote = useMutation({
    mutationFn: async (n: { title: string; content: string; tags?: string[] }) => {
      const { data, error } = await supabase
        .from("notes" as any)
        .insert({ ...n, tags: n.tags || [], user_id: uid! } as any)
        .select()
        .single();
      if (error) throw error;
      return data as any as Note;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb-notes"] }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const { error } = await supabase
        .from("notes" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb-notes"] }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notes" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb-notes"] }),
  });

  return {
    notes,
    addNote: (n: { title: string; content: string; tags?: string[] }) => addNote.mutateAsync(n),
    updateNote: (id: string, u: Partial<Note>) => updateNote.mutate({ id, ...u }),
    deleteNote: (id: string) => deleteNote.mutate(id),
  };
}
