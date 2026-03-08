import { useState, useEffect } from "react";

export interface HabitDay {
  date: string;
  habits: Record<string, boolean>;
  water: number;
  mood: string | null;
}

const TODAY = () => new Date().toISOString().split("T")[0];

function load(): HabitDay[] {
  try {
    return JSON.parse(localStorage.getItem("lifehub-health") || "[]");
  } catch {
    return [];
  }
}

function save(data: HabitDay[]) {
  localStorage.setItem("lifehub-health", JSON.stringify(data));
}

export const DEFAULT_HABITS = ["Read 10 pages", "Workout", "Meditate", "Healthy meal", "No screens before bed"];
export const MOODS = [
  { emoji: "😄", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Low" },
  { emoji: "😢", label: "Tough" },
];

export function useHealth() {
  const [days, setDays] = useState<HabitDay[]>(load);

  useEffect(() => { save(days); }, [days]);

  const getToday = (): HabitDay => {
    const today = TODAY();
    return days.find((d) => d.date === today) || {
      date: today,
      habits: Object.fromEntries(DEFAULT_HABITS.map((h) => [h, false])),
      water: 0,
      mood: null,
    };
  };

  const updateToday = (updater: (day: HabitDay) => HabitDay) => {
    const today = TODAY();
    setDays((prev) => {
      const exists = prev.find((d) => d.date === today);
      if (exists) {
        return prev.map((d) => (d.date === today ? updater(d) : d));
      }
      const newDay: HabitDay = {
        date: today,
        habits: Object.fromEntries(DEFAULT_HABITS.map((h) => [h, false])),
        water: 0,
        mood: null,
      };
      return [...prev, updater(newDay)];
    });
  };

  const toggleHabit = (habit: string) => {
    updateToday((d) => ({
      ...d,
      habits: { ...d.habits, [habit]: !d.habits[habit] },
    }));
  };

  const addWater = () => {
    updateToday((d) => ({ ...d, water: d.water + 250 }));
  };

  const removeWater = () => {
    updateToday((d) => ({ ...d, water: Math.max(0, d.water - 250) }));
  };

  const setMood = (mood: string) => {
    updateToday((d) => ({ ...d, mood: d.mood === mood ? null : mood }));
  };

  const today = getToday();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    return days.find((dd) => dd.date === dateStr) || null;
  });

  return { today, weekDays, toggleHabit, addWater, removeWater, setMood };
}
