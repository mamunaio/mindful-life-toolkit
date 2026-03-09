import { useState } from "react";
import { Check, GlassWater, Minus, Plus, Droplets, Moon, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useHealth, DEFAULT_HABITS, MOODS, ENERGY_LEVELS, SLEEP_QUALITIES } from "@/hooks/useHealth";

const WATER_GOAL = 2000;

export default function Health() {
  const {
    today, weekDays, toggleHabit, addWater, removeWater, setMood,
    setSleepHours, setSleepQuality, setEnergy, setWorkoutNote, habitStreak,
  } = useHealth();
  const [showWorkoutInput, setShowWorkoutInput] = useState(false);

  const habitsCompleted = Object.values(today.habits).filter(Boolean).length;
  const habitsTotal = DEFAULT_HABITS.length;
  const waterPercent = Math.min((today.water / WATER_GOAL) * 100, 100);
  const glasses = Array.from({ length: 8 }, (_, i) => i < today.water / 250);

  const energyInfo = ENERGY_LEVELS.find((e) => e.value === today.energy);

  return (
    <div className="page-container space-y-8">
      <div className="page-header">
        <h1 className="page-title">Health</h1>
        <p className="page-subtitle">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { value: `${habitsCompleted}/${habitsTotal}`, label: "Habits", className: "text-primary" },
          { value: `${today.water}ml`, label: "Water", className: "text-info" },
          { value: today.mood || "—", label: "Mood", className: "" },
          { value: today.sleep_hours != null ? `${today.sleep_hours}h` : "—", label: "Sleep", className: "text-accent" },
          { value: energyInfo?.emoji || "—", label: "Energy", className: "" },
        ].map((item) => (
          <Card key={item.label} className="card-elevated">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold font-display ${item.className}`}>{item.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habits */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                Daily Habits
                {habitStreak > 0 && (
                  <span className="text-xs font-semibold bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">
                    🔥 {habitStreak} Day Streak
                  </span>
                )}
              </span>
              <span className="text-xs font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{habitsCompleted}/{habitsTotal} done</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {DEFAULT_HABITS.map((habit) => {
              const done = today.habits[habit];
              const isWorkout = habit === "Workout";
              return (
                <div key={habit}>
                  <button
                    onClick={() => toggleHabit(habit)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left
                      ${done ? "bg-primary/8 border border-primary/15" : "bg-muted/20 border border-transparent hover:bg-muted/40"}`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all
                      ${done ? "bg-primary" : "border-2 border-muted-foreground/25"}`}>
                      {done && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors flex-1 ${done ? "text-primary line-through" : "text-card-foreground"}`}>{habit}</span>
                    {isWorkout && done && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowWorkoutInput(!showWorkoutInput); }}
                        className="p-1 rounded hover:bg-muted/40 text-muted-foreground hover:text-card-foreground transition-colors"
                        title="Add workout note"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </button>
                  {isWorkout && (showWorkoutInput || today.workout_note) && (
                    <div className="ml-8 mt-1 mb-1">
                      <Input
                        placeholder="e.g. 45m Gym, 30m Walk..."
                        className="h-7 text-xs bg-muted/20 border-muted-foreground/10"
                        value={today.workout_note || ""}
                        onChange={(e) => setWorkoutNote(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Sleep Tracker */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Moon className="h-4 w-4 text-accent" /> Sleep Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-2 block">Hours Slept</label>
                <div className="flex items-center gap-2">
                  {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                    <button
                      key={h}
                      onClick={() => setSleepHours(h)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                        ${today.sleep_hours === h
                          ? "bg-accent/15 border-2 border-accent text-accent"
                          : "bg-muted/20 border-2 border-transparent text-muted-foreground hover:bg-muted/40"}`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-2 block">Sleep Quality</label>
                <div className="flex gap-2">
                  {SLEEP_QUALITIES.map((q) => {
                    const colors: Record<string, string> = {
                      Excellent: "bg-success/15 border-success text-success",
                      Good: "bg-primary/15 border-primary text-primary",
                      Fair: "bg-warning/15 border-warning text-warning",
                      Poor: "bg-destructive/15 border-destructive text-destructive",
                    };
                    return (
                      <button
                        key={q}
                        onClick={() => setSleepQuality(q)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border-2
                          ${today.sleep_quality === q ? colors[q] : "bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/40"}`}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Water */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4 text-info" /> Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-card-foreground">{today.water}ml / {WATER_GOAL}ml</span>
                </div>
                <Progress value={waterPercent} className="h-2 [&>div]:bg-info" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {glasses.map((filled, i) => (
                  <button
                    key={i}
                    onClick={filled ? removeWater : addWater}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200
                      ${filled ? "bg-info/10 border border-info/25" : "bg-muted/20 border border-transparent hover:bg-muted/40 opacity-40"}`}
                  >
                    <GlassWater className={`h-5 w-5 transition-colors ${filled ? "text-info" : "text-muted-foreground"}`} />
                    <span className="text-[10px] mt-1 text-muted-foreground">250ml</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={removeWater} disabled={today.water <= 0} className="h-8"><Minus className="h-4 w-4" /></Button>
                <Button size="sm" onClick={addWater} className="gap-1 h-8"><Plus className="h-4 w-4" /> Add Glass</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mood & Energy Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm">How are you feeling?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.emoji}
                  onClick={() => setMood(m.emoji)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200
                    ${today.mood === m.emoji
                      ? "bg-accent/10 border-2 border-accent scale-105 shadow-glow"
                      : "bg-muted/20 border-2 border-transparent hover:bg-muted/40"}`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm">Energy Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between gap-2">
              {ENERGY_LEVELS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEnergy(e.value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200
                    ${today.energy === e.value
                      ? "bg-accent/10 border-2 border-accent scale-105 shadow-glow"
                      : "bg-muted/20 border-2 border-transparent hover:bg-muted/40"}`}
                >
                  <span className="text-xl">{e.emoji}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{e.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Weekly Summary */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-sm">This Week</CardTitle>
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
              const energyEmoji = ENERGY_LEVELS.find((e) => e.value === day?.energy)?.emoji;
              return (
                <div key={i} className={`flex flex-col items-center p-2.5 rounded-lg transition-colors
                  ${isToday ? "bg-primary/8 border border-primary/15" : "bg-muted/15"}`}>
                  <span className={`text-[10px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{dayLabel}</span>
                  <span className="text-lg mt-1">{day?.mood || "·"}</span>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: total }, (_, j) => (
                      <div key={j} className={`w-1.5 h-1.5 rounded-full ${j < completed ? "bg-primary" : "bg-muted-foreground/15"}`} />
                    ))}
                  </div>
                  {day && <span className="text-[9px] text-info mt-1">{day.water > 0 ? `${(day.water / 1000).toFixed(1)}L` : ""}</span>}
                  {/* Sleep & Energy indicators */}
                  <div className="flex items-center gap-1 mt-1">
                    {day?.sleep_hours != null && (
                      <span className={`text-[9px] font-medium ${day.sleep_hours >= 7 ? "text-accent" : day.sleep_hours >= 5 ? "text-warning" : "text-destructive"}`}>
                        {day.sleep_hours}h
                      </span>
                    )}
                    {energyEmoji && <span className="text-[10px]">{energyEmoji}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
