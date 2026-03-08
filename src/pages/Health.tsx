import { Check, GlassWater, Minus, Plus, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHealth, DEFAULT_HABITS, MOODS } from "@/hooks/useHealth";

const WATER_GOAL = 2000;

export default function Health() {
  const { today, weekDays, toggleHabit, addWater, removeWater, setMood } = useHealth();

  const habitsCompleted = Object.values(today.habits).filter(Boolean).length;
  const habitsTotal = DEFAULT_HABITS.length;
  const waterPercent = Math.min((today.water / WATER_GOAL) * 100, 100);
  const glasses = Array.from({ length: 8 }, (_, i) => i < today.water / 250);

  return (
    <div className="page-container space-y-8 animate-in fade-in duration-500">
      <div className="page-header">
        <h1 className="page-title">Health</h1>
        <p className="page-subtitle">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: `${habitsCompleted}/${habitsTotal}`, label: "Habits", className: "text-primary" },
          { value: `${today.water}ml`, label: "Water", className: "text-info" },
          { value: today.mood || "—", label: "Mood", className: "" },
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
              Daily Habits
              <span className="text-xs font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{habitsCompleted}/{habitsTotal} done</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {DEFAULT_HABITS.map((habit) => {
              const done = today.habits[habit];
              return (
                <button
                  key={habit}
                  onClick={() => toggleHabit(habit)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left
                    ${done ? "bg-primary/8 border border-primary/15" : "bg-muted/20 border border-transparent hover:bg-muted/40"}`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all
                    ${done ? "bg-primary" : "border-2 border-muted-foreground/25"}`}>
                    {done && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${done ? "text-primary line-through" : "text-card-foreground"}`}>{habit}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
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

          {/* Mood */}
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
        </div>
      </div>

      {/* Weekly */}
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
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
