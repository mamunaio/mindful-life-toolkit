import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ScheduleEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  event_date: string;
  color: string;
  created_at: string;
}

export function useSchedule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: events = [] } = useQuery({
    queryKey: ["schedule_events", uid],
    enabled: !!uid,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("schedule_events" as any)
        .select("*")
        .eq("event_date", today)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data as unknown as ScheduleEvent[]) ?? [];
    },
  });

  const addEvent = useMutation({
    mutationFn: async (e: { title: string; start_time: string; end_time?: string | null; event_date?: string; color?: string }) => {
      const { error } = await supabase
        .from("schedule_events" as any)
        .insert({ ...e, user_id: uid! } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule_events"] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("schedule_events" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule_events"] }),
  });

  return {
    events,
    addEvent: (e: { title: string; start_time: string; end_time?: string | null; event_date?: string; color?: string }) => addEvent.mutate(e),
    deleteEvent: (id: string) => deleteEvent.mutate(id),
  };
}
