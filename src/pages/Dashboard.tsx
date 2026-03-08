import { CheckSquare, Wallet, Heart, BookOpen, Sparkles, ArrowRight, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useHealth, DEFAULT_HABITS } from "@/hooks/useHealth";
import { useTransactions } from "@/hooks/useTransactions";
import { useNotes } from "@/hooks/useNotes";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem("lifehub-tasks") || "[]") as { id: string; title: string; column: string }[];
  } catch { return []; }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const tasks = loadTasks();
  const { transactions } = useTransactions();
  const { today } = useHealth();
  const { journal, checklists } = useNotes();

  // Tasks stats
  const todoCount = tasks.filter((t) => t.column === "todo").length;
  const inProgressCount = tasks.filter((t) => t.column === "inprogress").length;
  const doneToday = tasks.filter((t) => t.column === "done").length;
  const topTasks = tasks.filter((t) => t.column !== "done").slice(0, 3);

  // Finance stats (current month)
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthTx = transactions.filter((t) => { const d = new Date(t.date); return d.getMonth() === month && d.getFullYear() === year; });
  const monthIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const todayExpense = monthTx.filter((t) => t.type === "expense" && t.date === now.toISOString().split("T")[0]).reduce((s, t) => s + t.amount, 0);

  // Health stats
  const habitsCompleted = Object.values(today.habits).filter(Boolean).length;
  const habitsTotal = DEFAULT_HABITS.length;
  const habitPercent = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;

  // Notes stats
  const totalChecklistItems = checklists.reduce((s, c) => s + c.items.length, 0);
  const doneChecklistItems = checklists.reduce((s, c) => s + c.items.filter((i) => i.done).length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Hero Greeting */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
          {getGreeting()} <span className="text-primary">👋</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          {habitsCompleted === habitsTotal && habitsTotal > 0
            ? "All habits done today — amazing! 🎉"
            : topTasks.length > 0
              ? `You have ${todoCount + inProgressCount} tasks to work on today.`
              : "Your day is clear. Time to plan ahead!"}
        </p>
      </div>

      {/* Top Priorities */}
      {topTasks.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-card-foreground">Top Priorities</h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => navigate("/tasks")}>
                All tasks <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {topTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${task.column === "inprogress" ? "bg-warning" : "bg-info"}`} />
                  <span className="text-sm text-card-foreground">{task.title}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto capitalize">
                    {task.column === "inprogress" ? "In Progress" : "To Do"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tasks */}
        <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate("/tasks")}>
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mb-3">
              <CheckSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-2xl font-bold font-display text-card-foreground">{doneToday}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              completed · {todoCount + inProgressCount} remaining
            </p>
          </CardContent>
        </Card>

        {/* Finance */}
        <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate("/finance")}>
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center mb-3">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className={`text-2xl font-bold font-display ${(monthIncome - monthExpense) >= 0 ? "text-success" : "text-destructive"}`}>
              ${(monthIncome - monthExpense).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              balance · ${todayExpense.toFixed(0)} spent today
            </p>
          </CardContent>
        </Card>

        {/* Habits */}
        <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate("/health")}>
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg gradient-cool flex items-center justify-center mb-3">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-2xl font-bold font-display text-card-foreground">{habitsCompleted}/{habitsTotal}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              habits · {today.mood || "no mood yet"}
            </p>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate("/notes")}>
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mb-3">
              <BookOpen className="h-4 w-4 text-secondary-foreground" />
            </div>
            <p className="text-2xl font-bold font-display text-card-foreground">{journal.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              entries · {doneChecklistItems}/{totalChecklistItems} items done
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Habits Progress */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-card-foreground">Today's Habits</h2>
              <span className="text-xs text-muted-foreground">{Math.round(habitPercent)}%</span>
            </div>
            <Progress value={habitPercent} className="h-2 mb-3" />
            <div className="space-y-1.5">
              {DEFAULT_HABITS.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${today.habits[h] ? "bg-primary" : "bg-muted-foreground/20"}`} />
                  <span className={`text-xs ${today.habits[h] ? "text-primary line-through" : "text-muted-foreground"}`}>{h}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Water + Spending Snapshot */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-info" />
                <h2 className="font-display font-semibold text-sm text-card-foreground">Water Intake</h2>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={Math.min((today.water / 2000) * 100, 100)} className="h-2 flex-1 [&>div]:bg-info" />
                <span className="text-xs font-medium text-muted-foreground">{today.water}ml / 2L</span>
              </div>
            </div>
            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-accent" />
                <h2 className="font-display font-semibold text-sm text-card-foreground">Today's Spending</h2>
              </div>
              {todayExpense > 0 ? (
                <p className="text-xl font-bold font-display text-destructive">${todayExpense.toFixed(2)}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No expenses today ✨</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
