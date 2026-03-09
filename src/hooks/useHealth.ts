import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useMemo } from "react";

export interface HabitDay {
  date: string;
  habits: Record<string, boolean>;
  water: number;
  mood: string | null;
  sleep_hours: number | null;
  sleep_quality: string | null;
  energy: string | null;
  workout_note: string | null;
}

export const DEFAULT_HABITS = ["Read 10 pages", "Workout", "Meditate", "Healthy meal", "No screens before bed"];
export const MOODS = [
  { emoji: "😄", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Low" },
  { emoji: "😢", label: "Tough" },
];

export const ENERGY_LEVELS = [
  { value: "high", emoji: "⚡", label: "High Energy" },
  { value: "focused", emoji: "🎯", label: "Focused" },
  { value: "average", emoji: "😌", label: "Average" },
  { value: "low", emoji: "🔋", label: "Low Battery" },
];

export const SLEEP_QUALITIES = ["Excellent", "Good", "Fair", "Poor"];

const TODAY = () => new Date().toISOString().split("T")[0];
const emptyHabits = () => Object.fromEntries(DEFAULT_HABITS.map((h) => [h, false]));

export function useHealth() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

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
      return data.map((d: any) => ({
        date: d.date,
        habits: (d.habits as Record<string, boolean>) || emptyHabits(),
        water: d.water,
        mood: d.mood,
        sleep_hours: d.sleep_hours ?? null,
        sleep_quality: d.sleep_quality ?? null,
        energy: d.energy ?? null,
        workout_note: d.workout_note ?? null,
      })) as HabitDay[];
    },
  });

  const upsertDay = useMutation({
    mutationFn: async (day: HabitDay) => {
      const { error } = await supabase.from("health_days").upsert(
        {
          user_id: userId!,
          date: day.date,
          habits: day.habits as any,
          water: day.water,
          mood: day.mood,
          sleep_hours: day.sleep_hours,
          sleep_quality: day.sleep_quality,
          energy: day.energy,
          workout_note: day.workout_note,
        } as any,
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
    sleep_hours: null,
    sleep_quality: null,
    energy: null,
    workout_note: null,
  };

  const updateToday = useCallback((updater: (d: HabitDay) => HabitDay) => {
    const updated = updater(today);
    upsertDay.mutate(updated);
  }, [today, upsertDay]);

  const toggleHabit = (habit: string) => updateToday((d) => ({ ...d, habits: { ...d.habits, [habit]: !d.habits[habit] } }));
  const addWater = () => updateToday((d) => ({ ...d, water: d.water + 250 }));
  const removeWater = () => updateToday((d) => ({ ...d, water: Math.max(0, d.water - 250) }));
  const setMood = (mood: string) => updateToday((d) => ({ ...d, mood: d.mood === mood ? null : mood }));
  const setSleepHours = (hours: number) => updateToday((d) => ({ ...d, sleep_hours: hours }));
  const setSleepQuality = (q: string) => updateToday((d) => ({ ...d, sleep_quality: d.sleep_quality === q ? null : q }));
  const setEnergy = (e: string) => updateToday((d) => ({ ...d, energy: d.energy === e ? null : e }));
  const setWorkoutNote = (note: string) => updateToday((d) => ({ ...d, workout_note: note || null }));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    return days.find((dd) => dd.date === dateStr) || null;
  });

  // Calculate habit streak: consecutive days (ending today or yesterday) where all habits were completed
  const habitStreak = useMemo(() => {
    let streak = 0;
    const todayStr = TODAY();
    // Check from today backwards
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const day = days.find((dd) => dd.date === dateStr);
      if (!day) {
        // If today and no entry yet, skip to check yesterday
        if (i === 0) continue;
        break;
      }
      const allDone = DEFAULT_HABITS.every((h) => day.habits[h]);
      if (allDone) {
        streak++;
      } else {
        if (i === 0) continue; // today incomplete is ok
        break;
      }
    }
    return streak;
  }, [days]);

  return {
    today, weekDays, toggleHabit, addWater, removeWater, setMood,
    setSleepHours, setSleepQuality, setEnergy, setWorkoutNote, habitStreak,
  };
}
