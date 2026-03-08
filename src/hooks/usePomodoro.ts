import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PomodoroSession {
  id: string;
  task_id: string | null;
  duration: number;
  type: string;
  completed_at: string;
  created_at: string;
}

export function usePomodoro() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: sessions = [] } = useQuery({
    queryKey: ["pomodoro_sessions", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pomodoro_sessions" as any)
        .select("*")
        .eq("user_id", uid!)
        .order("completed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as unknown as PomodoroSession[]) ?? [];
    },
  });

  const addSession = useMutation({
    mutationFn: async (s: { task_id?: string | null; duration: number; type: string }) => {
      const { error } = await supabase
        .from("pomodoro_sessions" as any)
        .insert({ ...s, user_id: uid! } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pomodoro_sessions"] }),
  });

  const todaySessions = sessions.filter((s) => {
    const today = new Date().toISOString().slice(0, 10);
    return s.completed_at.slice(0, 10) === today && s.type === "work";
  });

  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  return {
    sessions,
    todaySessions,
    todayMinutes,
    addSession: (s: { task_id?: string | null; duration: number; type: string }) =>
      addSession.mutate(s),
  };
}
