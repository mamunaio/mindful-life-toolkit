import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export function useNotes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  // Journal
  const { data: journal = [] } = useQuery({
    queryKey: ["journal", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_entries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as JournalEntry[];
    },
  });

  const addJournalEntry = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("journal_entries").insert({ content, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });

  const deleteJournalEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });

  // Brain dump
  const { data: brainDumpData } = useQuery({
    queryKey: ["braindump", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("brain_dumps").select("*").maybeSingle();
      return data;
    },
  });

  const brainDump = brainDumpData?.content || "";

  const setBrainDump = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("brain_dumps").upsert(
        { user_id: userId!, content },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["braindump"] }),
  });

  // Checklists
  const { data: checklists = [] } = useQuery({
    queryKey: ["checklists", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: lists, error } = await supabase.from("checklists").select("*").order("created_at");
      if (error) throw error;
      const { data: items, error: err2 } = await supabase.from("checklist_items").select("*").order("created_at");
      if (err2) throw err2;
      return (lists || []).map((l) => ({
        id: l.id,
        name: l.name,
        items: (items || []).filter((i) => i.checklist_id === l.id).map((i) => ({ id: i.id, text: i.text, done: i.done })),
      })) as Checklist[];
    },
  });

  const addChecklist = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("checklists").insert({ name, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  const deleteChecklist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  const addChecklistItem = useMutation({
    mutationFn: async ({ checklistId, text }: { checklistId: string; text: string }) => {
      const { error } = await supabase.from("checklist_items").insert({ checklist_id: checklistId, text, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ itemId, done }: { itemId: string; done: boolean }) => {
      const { error } = await supabase.from("checklist_items").update({ done: !done }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  const deleteChecklistItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("checklist_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  return {
    journal,
    brainDump,
    checklists,
    addJournalEntry: (c: string) => addJournalEntry.mutate(c),
    deleteJournalEntry: (id: string) => deleteJournalEntry.mutate(id),
    setBrainDump: (c: string) => setBrainDump.mutate(c),
    addChecklist: (name: string) => addChecklist.mutate(name),
    deleteChecklist: (id: string) => deleteChecklist.mutate(id),
    addChecklistItem: (checklistId: string, text: string) => addChecklistItem.mutate({ checklistId, text }),
    toggleChecklistItem: (checklistId: string, itemId: string) => {
      const item = checklists.find((c) => c.id === checklistId)?.items.find((i) => i.id === itemId);
      if (item) toggleChecklistItem.mutate({ itemId, done: item.done });
    },
    deleteChecklistItem: (_checklistId: string, itemId: string) => deleteChecklistItem.mutate(itemId),
  };
}
