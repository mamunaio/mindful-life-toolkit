import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Task {
  id: string;
  title: string;
  column_id: string;
}

export function useTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });

  const addTask = useMutation({
    mutationFn: async ({ title, column_id }: { title: string; column_id: string }) => {
      const { error } = await supabase.from("tasks").insert({ title, column_id, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; column_id?: string }) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return {
    tasks,
    addTask: (title: string, column_id: string) => addTask.mutate({ title, column_id }),
    updateTask: (id: string, updates: { title?: string; column_id?: string }) => updateTask.mutate({ id, ...updates }),
    deleteTask: (id: string) => deleteTask.mutate(id),
  };
}
