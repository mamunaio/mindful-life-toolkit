import { CheckSquare, Wallet, ArrowRight, TrendingUp, TrendingDown, Calendar, Flame, Droplets, Target, Briefcase, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useHealth, DEFAULT_HABITS } from "@/hooks/useHealth";
import { useTransactions } from "@/hooks/useTransactions";
import { useTasks } from "@/hooks/useTasks";
import { useFreelance } from "@/hooks/useFreelance";
import ProductivityRing from "@/components/dashboard/ProductivityRing";
import CompactPomodoro from "@/components/dashboard/CompactPomodoro";
import QuickBrainDump from "@/components/dashboard/QuickBrainDump";
import TodaySchedule from "@/components/dashboard/TodaySchedule";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const { tasks } = useTasks();
  const { transactions } = useTransactions();
  const { today, toggleHabit } = useHealth();
  const { payments, withdrawals, expenses } = useFreelance();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const month = now.getMonth();
  const year = now.getFullYear();

  // Tasks
  const todoCount = tasks.filter((t) => t.column_id === "todo").length;
  const inProgressCount = tasks.filter((t) => t.column_id === "inprogress").length;
  const doneCount = tasks.filter((t) => t.column_id === "done").length;
  const overdueTasks = tasks.filter((t) => t.column_id !== "done" && t.due_date && t.due_date < todayStr);

  // Top priorities (high priority, non-done, max 5)
  const topPriorities = tasks
    .filter((t) => t.column_id !== "done" && t.priority === "high")
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"))
    .slice(0, 5);

  // Personal finance
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const personalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const personalExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const personalBalance = personalIncome - personalExpense;

  // Freelance finance
  const monthPayments = payments.filter((p) => {
    const d = new Date(p.date);
    return d.getMonth() === month && d.getFullYear() === year && p.status === "paid";
  });
  const freelanceIncome = monthPayments.reduce((s, p) => s + p.amount, 0);
  const monthExpenses = expenses.filter((e) => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; });
  const freelanceExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const freelanceNet = freelanceIncome - freelanceExpenses;

  // Health
  const habitsCompleted = Object.values(today.habits).filter(Boolean).length;
  const habitsTotal = DEFAULT_HABITS.length;
  const waterPercent = Math.min((today.water / 2000) * 100, 100);

  // Productivity score
  const totalTasks = todoCount + inProgressCount + doneCount;
  const taskScore = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;
  const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;
  const productivityScore = Math.round((taskScore + habitScore) / 2);

  const greeting = displayName ? `${getGreeting()}, ${displayName.split(" ")[0]}` : getGreeting();

  return (
    <div className="page-container space-y-5">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-foreground">
            {greeting}
          </h1>
        </div>
        {/* Productivity + Task Stats grouped */}
        <div className="hidden md:flex items-center gap-5">
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-bold font-display text-foreground">{todoCount + inProgressCount}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-lg font-bold font-display text-success">{doneCount}</p>
              <p className="text-[10px] text-muted-foreground">Done</p>
            </div>
            <div>
              <p className={`text-lg font-bold font-display ${overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>{overdueTasks.length}</p>
              <p className="text-[10px] text-muted-foreground">Overdue</p>
            </div>
          </div>
          <div className="w-px h-10 bg-border/50" />
          <ProductivityRing percent={productivityScore} label="Today" />
        </div>
      </div>

      {/* Mobile: Productivity + Stats */}
      <div className="md:hidden">
        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <ProductivityRing percent={productivityScore} size={72} strokeWidth={6} label="Today" />
            <div className="flex gap-5 flex-1">
              <div className="text-center">
                <p className="text-lg font-bold font-display text-foreground">{todoCount + inProgressCount}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-display text-success">{doneCount}</p>
                <p className="text-[10px] text-muted-foreground">Done</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold font-display ${overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>{overdueTasks.length}</p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 1: Priorities + Pomodoro ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Priorities */}
        <Card className="card-elevated lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-semibold font-display text-foreground">Top Priorities</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-6 gap-1" onClick={() => navigate("/tasks")}>
                All tasks <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {overdueTasks.length > 0 && (
              <div className="mb-2 px-2.5 py-1.5 rounded-md bg-destructive/8 border border-destructive/15">
                <p className="text-[11px] font-medium text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}
                </p>
              </div>
            )}

            {topPriorities.length > 0 ? (
              <div className="space-y-1">
                {topPriorities.map((task) => (
                  <div key={task.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted/40 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                    <span className={`text-[10px] font-medium ${
                      !task.due_date ? "text-muted-foreground" :
                      task.due_date < todayStr ? "text-destructive" :
                      task.due_date === todayStr ? "text-warning" : "text-muted-foreground"
                    }`}>
                      {!task.due_date ? "" :
                       task.due_date === todayStr ? "Today" :
                       task.due_date < todayStr ? "Overdue" :
                       new Date(task.due_date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      task.column_id === "inprogress" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                    }`}>
                      {task.column_id === "inprogress" ? "Active" : "To Do"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No high-priority tasks — nice! 🎉</p>
            )}
          </CardContent>
        </Card>

        {/* Compact Pomodoro */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" /> Deep Work
            </h2>
            <CompactPomodoro />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Schedule + Finance + Brain Dump ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Schedule */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <TodaySchedule />
          </CardContent>
        </Card>

        {/* Personal Finance */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4 text-success" /> Personal
              </h2>
              <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-6 gap-1" onClick={() => navigate("/finance")}>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Income</span>
                <span className="font-semibold text-success">${personalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Expenses</span>
                <span className="font-semibold text-destructive">${personalExpense.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="pt-1.5 border-t border-border/40 flex justify-between text-xs">
                <span className="font-medium text-foreground">Balance</span>
                <span className={`font-bold ${personalBalance >= 0 ? "text-success" : "text-destructive"}`}>
                  {personalBalance >= 0 ? "+" : "-"}${Math.abs(personalBalance).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Freelance Finance — FIXED negative display */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Freelance
              </h2>
              <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-6 gap-1" onClick={() => navigate("/freelance")}>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Earned</span>
                <span className="font-semibold text-success">${freelanceIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Expenses</span>
                <span className="font-semibold text-destructive">${freelanceExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="pt-1.5 border-t border-border/40 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">{freelanceNet >= 0 ? "Net Profit" : "Deficit"}</span>
                  {freelanceNet < 0 && <AlertTriangle className="h-3 w-3 text-destructive" />}
                </div>
                <span className={`font-bold ${freelanceNet >= 0 ? "text-success" : "text-destructive"}`}>
                  {freelanceNet >= 0 ? "+" : "-"}${Math.abs(freelanceNet).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Brain Dump */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold font-display text-foreground mb-2">💡 Quick Capture</h2>
            <QuickBrainDump />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Habits + Water ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Habits */}
        <Card className="card-elevated lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold font-display text-foreground">Today's Habits</h2>
              <span className="text-xs font-bold text-primary">{habitsCompleted}/{habitsTotal}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {DEFAULT_HABITS.map((h) => (
                <button
                  key={h}
                  onClick={() => toggleHabit(h)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                    today.habits[h]
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-sm shrink-0 flex items-center justify-center text-[8px] ${
                    today.habits[h] ? "bg-primary text-primary-foreground" : "border border-border"
                  }`}>
                    {today.habits[h] && "✓"}
                  </div>
                  <span className="truncate">{h}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Water */}
        <Card className="card-elevated lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
                <Droplets className="h-4 w-4 text-info" /> Water
              </h2>
              <span className="text-xs font-medium text-muted-foreground">{today.water}ml / 2000ml</span>
            </div>
            <Progress value={waterPercent} className="h-2 [&>div]:bg-info" />
            <div className="flex gap-1 mt-2.5">
              {Array.from({ length: 8 }).map((_, i) => {
                const filled = today.water >= (i + 1) * 250;
                return (
                  <div
                    key={i}
                    className={`flex-1 h-5 rounded-sm transition-colors ${filled ? "bg-info/30" : "bg-muted/40"}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
