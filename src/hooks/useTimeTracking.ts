import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface TimeEntry {
  id: string;
  project_id: string | null;
  client_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_running: boolean;
  created_at: string;
}

export function useTimeTracking() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: entries = [] } = useQuery({
    queryKey: ["time_entries", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries" as any)
        .select("*")
        .eq("user_id", uid!)
        .order("start_time", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as unknown as TimeEntry[]) ?? [];
    },
  });

  const runningEntry = entries.find((e) => e.is_running);

  const startTimer = useMutation({
    mutationFn: async (params: { project_id?: string | null; client_id?: string | null; description?: string }) => {
      // Stop any running timer first
      if (runningEntry) {
        const now = new Date();
        const start = new Date(runningEntry.start_time);
        const mins = Math.round((now.getTime() - start.getTime()) / 60000);
        await supabase
          .from("time_entries" as any)
          .update({ is_running: false, end_time: now.toISOString(), duration_minutes: mins } as any)
          .eq("id", runningEntry.id);
      }

      const { error } = await supabase
        .from("time_entries" as any)
        .insert({
          user_id: uid!,
          project_id: params.project_id || null,
          client_id: params.client_id || null,
          description: params.description || null,
          is_running: true,
          start_time: new Date().toISOString(),
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Timer started!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stopTimer = useMutation({
    mutationFn: async () => {
      if (!runningEntry) return;
      const now = new Date();
      const start = new Date(runningEntry.start_time);
      const mins = Math.round((now.getTime() - start.getTime()) / 60000);
      const { error } = await supabase
        .from("time_entries" as any)
        .update({ is_running: false, end_time: now.toISOString(), duration_minutes: mins } as any)
        .eq("id", runningEntry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Timer stopped!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("time_entries" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Entry deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalTrackedToday = entries
    .filter((e) => {
      const today = new Date().toISOString().slice(0, 10);
      return e.start_time.slice(0, 10) === today && !e.is_running;
    })
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  return {
    entries,
    runningEntry,
    totalTrackedToday,
    startTimer: (p: { project_id?: string | null; client_id?: string | null; description?: string }) =>
      startTimer.mutate(p),
    stopTimer: () => stopTimer.mutate(),
    deleteEntry: (id: string) => deleteEntry.mutate(id),
  };
}
