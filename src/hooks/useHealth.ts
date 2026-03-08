import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";

export interface HabitDay {
  date: string;
  habits: Record<string, boolean>;
  water: number;
  mood: string | null;
}

export const DEFAULT_HABITS = ["Read 10 pages", "Workout", "Meditate", "Healthy meal", "No screens before bed"];
export const MOODS = [
  { emoji: "😄", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Low" },
  { emoji: "😢", label: "Tough" },
];

const TODAY = () => new Date().toISOString().split("T")[0];
const emptyHabits = () => Object.fromEntries(DEFAULT_HABITS.map((h) => [h, false]));

export function useHealth() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  // Fetch last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().split("T")[0];

  const { data: days = [] } = useQuery({
    queryKey: ["health", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_days")
        .select("*")
        .gte("date", startDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return data.map((d) => ({
        date: d.date,
        habits: (d.habits as Record<string, boolean>) || emptyHabits(),
        water: d.water,
        mood: d.mood,
      })) as HabitDay[];
    },
  });

  const upsertDay = useMutation({
    mutationFn: async (day: HabitDay) => {
      const { error } = await supabase.from("health_days").upsert(
        { user_id: userId!, date: day.date, habits: day.habits as any, water: day.water, mood: day.mood },
        { onConflict: "user_id,date" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["health"] }),
  });

  const today: HabitDay = days.find((d) => d.date === TODAY()) || {
    date: TODAY(),
    habits: emptyHabits(),
    water: 0,
    mood: null,
  };

  const updateToday = useCallback((updater: (d: HabitDay) => HabitDay) => {
    const updated = updater(today);
    upsertDay.mutate(updated);
  }, [today, upsertDay]);

  const toggleHabit = (habit: string) => updateToday((d) => ({ ...d, habits: { ...d.habits, [habit]: !d.habits[habit] } }));
  const addWater = () => updateToday((d) => ({ ...d, water: d.water + 250 }));
  const removeWater = () => updateToday((d) => ({ ...d, water: Math.max(0, d.water - 250) }));
  const setMood = (mood: string) => updateToday((d) => ({ ...d, mood: d.mood === mood ? null : mood }));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    return days.find((dd) => dd.date === dateStr) || null;
  });

  return { today, weekDays, toggleHabit, addWater, removeWater, setMood };
}
