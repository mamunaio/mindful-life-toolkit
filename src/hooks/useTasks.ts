import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Task {
  id: string;
  title: string;
  column_id: string;
  priority: string;
  due_date: string | null;
  category: string;
  description: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  created_at: string;
}

export function useTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });

  const { data: subtasks = [] } = useQuery({
    queryKey: ["subtasks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subtasks")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Subtask[];
    },
  });

  const addTask = useMutation({
    mutationFn: async (task: {
      title: string;
      column_id: string;
      priority?: string;
      due_date?: string | null;
      category?: string;
      description?: string | null;
      is_recurring?: boolean;
      recurrence_pattern?: string | null;
    }) => {
      const { error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      column_id?: string;
      priority?: string;
      due_date?: string | null;
      category?: string;
      description?: string | null;
      is_recurring?: boolean;
      recurrence_pattern?: string | null;
    }) => {
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

  const addSubtask = useMutation({
    mutationFn: async ({ task_id, title }: { task_id: string; title: string }) => {
      const { error } = await supabase
        .from("subtasks")
        .insert({ task_id, title, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks"] }),
  });

  const toggleSubtask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("subtasks").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks"] }),
  });

  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subtasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks"] }),
  });

  return {
    tasks,
    subtasks,
    addTask: (task: Parameters<typeof addTask.mutate>[0]) => addTask.mutate(task),
    updateTask: (id: string, updates: Omit<Parameters<typeof updateTask.mutate>[0], "id">) =>
      updateTask.mutate({ id, ...updates }),
    deleteTask: (id: string) => deleteTask.mutate(id),
    addSubtask: (task_id: string, title: string) => addSubtask.mutate({ task_id, title }),
    toggleSubtask: (id: string, done: boolean) => toggleSubtask.mutate({ id, done }),
    deleteSubtask: (id: string) => deleteSubtask.mutate(id),
  };
}
