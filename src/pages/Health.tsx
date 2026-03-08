import { Check, GlassWater, Minus, Plus, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHealth, DEFAULT_HABITS, MOODS } from "@/hooks/useHealth";

const WATER_GOAL = 2000; // ml

export default function Health() {
  const { today, weekDays, toggleHabit, addWater, removeWater, setMood } = useHealth();

  const habitsCompleted = Object.values(today.habits).filter(Boolean).length;
  const habitsTotal = DEFAULT_HABITS.length;
  const waterPercent = Math.min((today.water / WATER_GOAL) * 100, 100);

  // Generate 8 glass slots (250ml each = 2000ml)
  const glasses = Array.from({ length: 8 }, (_, i) => i < today.water / 250);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Health</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Overview strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-primary">{habitsCompleted}/{habitsTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">Habits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-info">{today.water}ml</p>
            <p className="text-xs text-muted-foreground mt-1">Water</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{today.mood || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Mood</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center justify-between">
              Daily Habits
              <span className="text-xs font-normal text-muted-foreground">
                {habitsCompleted}/{habitsTotal} done
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEFAULT_HABITS.map((habit) => {
              const done = today.habits[habit];
              return (
                <button
                  key={habit}
                  onClick={() => toggleHabit(habit)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left
                    ${done
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/30 border border-transparent hover:bg-muted/50"
                    }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all
                      ${done ? "bg-primary" : "border-2 border-muted-foreground/30"}`}
                  >
                    {done && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      done ? "text-primary line-through" : "text-card-foreground"
                    }`}
                  >
                    {habit}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Water Intake */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-info" />
                Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-card-foreground">{today.water}ml / {WATER_GOAL}ml</span>
                </div>
                <Progress value={waterPercent} className="h-3 [&>div]:bg-info" />
              </div>

              {/* Glass grid */}
              <div className="grid grid-cols-4 gap-2">
                {glasses.map((filled, i) => (
                  <button
                    key={i}
                    onClick={filled ? removeWater : addWater}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200
                      ${filled
                        ? "bg-info/15 border border-info/30 scale-100"
                        : "bg-muted/30 border border-transparent hover:bg-muted/50 opacity-40"
                      }`}
                  >
                    <GlassWater
                      className={`h-6 w-6 transition-colors ${filled ? "text-info" : "text-muted-foreground"}`}
                    />
                    <span className="text-[10px] mt-1 text-muted-foreground">250ml</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={removeWater} disabled={today.water <= 0}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={addWater} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Glass
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mood Logger */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">How are you feeling?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.emoji}
                    onClick={() => setMood(m.emoji)}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200
                      ${today.mood === m.emoji
                        ? "bg-accent/15 border-2 border-accent scale-105 shadow-glow"
                        : "bg-muted/30 border-2 border-transparent hover:bg-muted/50"
                      }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const isToday = i === 6;
              const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
              const completed = day ? Object.values(day.habits).filter(Boolean).length : 0;
              const total = DEFAULT_HABITS.length;

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors
                    ${isToday ? "bg-primary/10 border border-primary/20" : "bg-muted/20"}`}
                >
                  <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {dayLabel}
                  </span>
                  <span className="text-lg mt-1">{day?.mood || "·"}</span>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: total }, (_, j) => (
                      <div
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full ${
                          j < completed ? "bg-primary" : "bg-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                  {day && (
                    <span className="text-[9px] text-info mt-1">
                      {day.water > 0 ? `${(day.water / 1000).toFixed(1)}L` : ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
