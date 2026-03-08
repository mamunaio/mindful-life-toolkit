import { useState } from "react";
import { CheckSquare, Wallet, Heart, Sparkles, ArrowRight, Droplets, Settings2, RotateCcw, TrendingUp, Calendar, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useHealth, DEFAULT_HABITS } from "@/hooks/useHealth";
import { useTransactions } from "@/hooks/useTransactions";

import { useTasks } from "@/hooks/useTasks";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const WIDGET_META: Record<string, { label: string; icon: React.ReactNode }> = {
  priorities: { label: "Top Priorities", icon: <Target className="h-3.5 w-3.5" /> },
  stats: { label: "Quick Stats", icon: <Zap className="h-3.5 w-3.5" /> },
  habits: { label: "Today's Habits", icon: <Heart className="h-3.5 w-3.5" /> },
  water: { label: "Water & Spending", icon: <Droplets className="h-3.5 w-3.5" /> },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const { tasks } = useTasks();
  const { transactions } = useTransactions();
  const { today } = useHealth();
  
  const { visibility, toggleWidget, resetLayout } = useDashboardLayout();
  const [isEditing, setIsEditing] = useState(false);

  const todoCount = tasks.filter((t) => t.column_id === "todo").length;
  const inProgressCount = tasks.filter((t) => t.column_id === "inprogress").length;
  const doneCount = tasks.filter((t) => t.column_id === "done").length;
  const topTasks = tasks.filter((t) => t.column_id !== "done").slice(0, 4);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthTx = transactions.filter((t) => { const d = new Date(t.date); return d.getMonth() === month && d.getFullYear() === year; });
  const monthIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const todayExpense = monthTx.filter((t) => t.type === "expense" && t.date === now.toISOString().split("T")[0]).reduce((s, t) => s + t.amount, 0);

  const habitsCompleted = Object.values(today.habits).filter(Boolean).length;
  const habitsTotal = DEFAULT_HABITS.length;
  const habitPercent = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;


  const greeting = displayName ? `${getGreeting()}, ${displayName.split(" ")[0]}` : getGreeting();
  const balance = monthIncome - monthExpense;

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Calendar className="h-3.5 w-3.5" />
            <span>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground leading-tight">
            {greeting}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md">
            {habitsCompleted === habitsTotal && habitsTotal > 0
              ? "All habits done today — amazing! 🎉"
              : topTasks.length > 0
                ? `You have ${todoCount + inProgressCount} tasks to work on today.`
                : "Your day is clear. Time to plan ahead!"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Settings2 className="h-3.5 w-3.5" />
                Customize
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Show / Hide Widgets</p>
                {Object.entries(WIDGET_META).map(([id, meta]) => (
                  <div key={id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {meta.icon}
                      <span>{meta.label}</span>
                    </div>
                    <Switch checked={visibility[id] !== false} onCheckedChange={() => toggleWidget(id)} />
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs mt-2" onClick={resetLayout}>
                  <RotateCcw className="h-3 w-3" /> Reset
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Quick Stats Row */}
      {visibility.stats !== false && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="card-elevated group cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate("/tasks")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CheckSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold font-display text-card-foreground leading-none">{doneCount}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{todoCount + inProgressCount} remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated group cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate("/finance")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold font-display leading-none ${balance >= 0 ? "text-success" : "text-destructive"}`}>
                  ${Math.abs(balance).toFixed(0)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{balance >= 0 ? "balance" : "deficit"} this month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated group cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate("/health")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl gradient-cool flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold font-display text-card-foreground leading-none">{habitsCompleted}/{habitsTotal}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">habits · {today.mood || "no mood"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priorities */}
          {visibility.priorities !== false && (
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                      <Target className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-sm font-display">Top Priorities</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7" onClick={() => navigate("/tasks")}>
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {topTasks.length > 0 ? (
                  <div className="space-y-2">
                    {topTasks.map((task, i) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors">
                        <span className="text-xs font-bold text-muted-foreground/50 w-5 text-center">{i + 1}</span>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${task.column_id === "inprogress" ? "bg-warning" : "bg-info"}`} />
                        <span className="text-sm text-card-foreground flex-1">{task.title}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          task.column_id === "inprogress" 
                            ? "bg-warning/10 text-warning" 
                            : "bg-info/10 text-info"
                        }`}>
                          {task.column_id === "inprogress" ? "In Progress" : "To Do"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CheckSquare className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No pending tasks</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => navigate("/tasks")}>
                      Create a task <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Finance Summary */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg gradient-warm flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-sm font-display">Monthly Overview</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7" onClick={() => navigate("/finance")}>
                  Details <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-success/5 border border-success/10">
                  <p className="text-xs text-muted-foreground mb-1">Income</p>
                  <p className="text-lg font-bold font-display text-success">${monthIncome.toFixed(0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <p className="text-xs text-muted-foreground mb-1">Expenses</p>
                  <p className="text-lg font-bold font-display text-destructive">${monthExpense.toFixed(0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Today</p>
                  <p className="text-lg font-bold font-display text-card-foreground">${todayExpense.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Habits */}
          {visibility.habits !== false && (
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg gradient-cool flex items-center justify-center">
                      <Heart className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-sm font-display">Today's Habits</CardTitle>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full">{Math.round(habitPercent)}%</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <Progress value={habitPercent} className="h-1.5" />
                <div className="space-y-1">
                  {DEFAULT_HABITS.map((h) => (
                    <div key={h} className={`flex items-center gap-2.5 py-1.5 px-2 rounded-md transition-colors ${today.habits[h] ? "bg-primary/5" : ""}`}>
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${today.habits[h] ? "bg-primary" : "border-2 border-muted-foreground/20"}`}>
                        {today.habits[h] && <Sparkles className="h-2 w-2 text-primary-foreground" />}
                      </div>
                      <span className={`text-xs font-medium ${today.habits[h] ? "text-primary" : "text-muted-foreground"}`}>{h}</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-8" onClick={() => navigate("/health")}>
                  Go to Health <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Water & Spending */}
          {visibility.water !== false && (
            <Card className="card-elevated">
              <CardContent className="p-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="h-4 w-4 text-info" />
                    <h3 className="font-display font-semibold text-sm text-card-foreground">Water Intake</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Progress value={Math.min((today.water / 2000) * 100, 100)} className="h-2 flex-1 [&>div]:bg-info" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{today.water}ml</span>
                    <span>2,000ml goal</span>
                  </div>
                </div>
                <div className="border-t border-border/40 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="h-4 w-4 text-accent" />
                    <h3 className="font-display font-semibold text-sm text-card-foreground">Today's Spending</h3>
                  </div>
                  {todayExpense > 0 ? (
                    <p className="text-2xl font-bold font-display text-destructive">${todayExpense.toFixed(2)}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No expenses today ✨</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
