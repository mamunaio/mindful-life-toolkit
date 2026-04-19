import { CheckSquare, Wallet, ArrowRight, Calendar, Flame, Droplets, Target, Briefcase, AlertTriangle, TrendingUp, TrendingDown, Sparkles, Clock } from "lucide-react";
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
  if (h < 6) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const { tasks } = useTasks();
  const { transactions } = useTransactions();
  const { today, toggleHabit } = useHealth();
  const { payments, expenses, projects, clients } = useFreelance();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const month = now.getMonth();
  const year = now.getFullYear();

  // Tasks
  const todoCount = tasks.filter((t) => t.column_id === "todo").length;
  const inProgressCount = tasks.filter((t) => t.column_id === "inprogress").length;
  const doneCount = tasks.filter((t) => t.column_id === "done").length;
  const overdueTasks = tasks.filter((t) => t.column_id !== "done" && t.due_date && t.due_date < todayStr);
  const dueTodayTasks = tasks.filter((t) => t.column_id !== "done" && t.due_date === todayStr);

  const topPriorities = tasks
    .filter((t) => t.column_id !== "done")
    .sort((a, b) => {
      // overdue first, then due today, then high priority, then due-date asc
      const aOver = a.due_date && a.due_date < todayStr ? 0 : 1;
      const bOver = b.due_date && b.due_date < todayStr ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      const aHigh = a.priority === "high" ? 0 : 1;
      const bHigh = b.priority === "high" ? 0 : 1;
      if (aHigh !== bHigh) return aHigh - bHigh;
      return (a.due_date || "9999").localeCompare(b.due_date || "9999");
    })
    .slice(0, 6);

  // Personal finance — month
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const personalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const personalExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const personalBalance = personalIncome - personalExpense;

  // Freelance finance — month
  const monthPayments = payments.filter((p) => {
    const d = new Date(p.date);
    return d.getMonth() === month && d.getFullYear() === year && p.status === "paid";
  });
  const freelanceIncome = monthPayments.reduce((s, p) => s + p.amount, 0);
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const freelanceExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const freelanceNet = freelanceIncome - freelanceExpenses;

  // Outstanding A/R = unpaid payments
  const outstandingAR = payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const activeProjects = projects.filter((p: any) => p.status === "active" || p.status === "in_progress").length;
  const activeClients = clients.length;

  // Health
  const habitsCompleted = Object.values(today.habits).filter(Boolean).length;
  const habitsTotal = DEFAULT_HABITS.length;
  const waterPercent = Math.min((today.water / 2000) * 100, 100);

  // Productivity score
  const totalTasks = todoCount + inProgressCount + doneCount;
  const taskScore = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;
  const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;
  const productivityScore = Math.round((taskScore + habitScore) / 2);

  const firstName = displayName ? displayName.split(" ")[0] : "";
  const greeting = firstName ? `${getGreeting()}, ${firstName}` : getGreeting();

  return (
    <div className="page-container space-y-6">
      {/* ─── HERO HEADER ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 md:p-8">
        <div className="absolute inset-0 -z-10 opacity-60 mesh-bg" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="tabular-nums">
                {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span className="kbd ml-1">⌘K to search</span>
            </div>
            <h1 className="text-[28px] md:text-[34px] font-bold font-display tracking-tight text-foreground leading-tight">
              {greeting}
              <span className="text-gradient-primary"> ✦</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              {dueTodayTasks.length > 0
                ? `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? "s" : ""} due today and ${overdueTasks.length} overdue. Let's get to it.`
                : overdueTasks.length > 0
                ? `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s need" : " needs"} your attention. Stay on top of it.`
                : "Your queue is clear. A great day to ship something meaningful."}
            </p>
          </div>

          {/* KPI rail */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex gap-3 md:gap-5">
              <KpiPill label="Active" value={todoCount + inProgressCount} tone="default" />
              <KpiPill label="Done" value={doneCount} tone="success" />
              <KpiPill label="Overdue" value={overdueTasks.length} tone={overdueTasks.length > 0 ? "destructive" : "muted"} />
            </div>
            <div className="hidden sm:block w-px h-12 bg-border/60" />
            <ProductivityRing percent={productivityScore} label="Today" />
          </div>
        </div>
      </div>

      {/* ─── ROW 1: Today's Focus + Schedule ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Focus */}
        <Card className="lg:col-span-2 hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold font-display text-foreground leading-none">Today's Focus</h2>
                  <p className="text-[10.5px] text-muted-foreground mt-1">Smart-prioritized — overdue, due today, then high priority</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-7 gap-1" onClick={() => navigate("/tasks")}>
                View board <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {overdueTasks.length > 0 && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
                <p className="text-[12px] font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}
                </p>
                <Button size="sm" variant="ghost" className="h-6 text-[11px] text-destructive hover:bg-destructive/15" onClick={() => navigate("/tasks")}>
                  Review <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}

            {topPriorities.length > 0 ? (
              <div className="space-y-1">
                {topPriorities.map((task) => {
                  const isOverdue = task.due_date && task.due_date < todayStr;
                  const isToday = task.due_date === todayStr;
                  return (
                    <button
                      key={task.id}
                      onClick={() => navigate("/tasks")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isOverdue ? "bg-destructive" :
                        task.priority === "high" ? "bg-warning" :
                        "bg-muted-foreground/40"
                      }`} />
                      <span className="text-[13px] text-foreground flex-1 truncate group-hover:text-foreground">{task.title}</span>
                      {task.due_date && (
                        <span className={`text-[10.5px] font-medium tabular-nums ${
                          isOverdue ? "text-destructive" :
                          isToday ? "text-warning" :
                          "text-muted-foreground"
                        }`}>
                          {isOverdue ? "Overdue" : isToday ? "Today" : new Date(task.due_date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                        task.column_id === "inprogress" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                      }`}>
                        {task.column_id === "inprogress" ? "In Progress" : "To Do"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex w-12 h-12 rounded-xl bg-success/10 items-center justify-center mb-3">
                  <CheckSquare className="h-5 w-5 text-success" />
                </div>
                <p className="text-sm text-foreground font-medium">All clear.</p>
                <p className="text-[12px] text-muted-foreground mt-1">No urgent tasks — perfect time for deep work.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="hover-lift">
          <CardContent className="p-5">
            <TodaySchedule />
          </CardContent>
        </Card>
      </div>

      {/* ─── ROW 2: Money in Motion ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Freelance Snapshot — wider */}
        <Card className="lg:col-span-2 relative overflow-hidden hover-lift">
          <div className="absolute inset-0 -z-10 opacity-50 [background:radial-gradient(at_100%_0%,hsl(var(--primary)/0.08)_0%,transparent_60%)]" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
                  <Briefcase className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold font-display text-foreground leading-none">Freelance · {now.toLocaleDateString("en-US", { month: "long" })}</h2>
                  <p className="text-[10.5px] text-muted-foreground mt-1">{activeProjects} active project{activeProjects !== 1 ? "s" : ""} · {activeClients} client{activeClients !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-7 gap-1" onClick={() => navigate("/freelance")}>
                Open <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MoneyTile
                label="Earned"
                amount={freelanceIncome}
                tone="success"
                icon={<TrendingUp className="h-3.5 w-3.5" />}
              />
              <MoneyTile
                label="Expenses"
                amount={freelanceExpenses}
                tone="destructive"
                icon={<TrendingDown className="h-3.5 w-3.5" />}
              />
              <MoneyTile
                label={freelanceNet >= 0 ? "Net Profit" : "Deficit"}
                amount={Math.abs(freelanceNet)}
                tone={freelanceNet >= 0 ? "primary" : "destructive"}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                prefix={freelanceNet >= 0 ? "+" : "-"}
              />
            </div>

            {outstandingAR > 0 && (
              <div className="mt-4 px-3 py-2.5 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  <span className="text-[12px] text-foreground">
                    <span className="font-semibold tabular-nums">${fmt(outstandingAR)}</span> in outstanding receivables
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-[11px] text-warning hover:bg-warning/15" onClick={() => navigate("/freelance")}>
                  Chase <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Finance */}
        <Card className="hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                  <Wallet className="h-3.5 w-3.5 text-success" />
                </div>
                <h2 className="text-[14px] font-semibold font-display text-foreground leading-none">Personal</h2>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate("/finance")}>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
            <div className="space-y-2.5">
              <Row label="Income"   value={`$${fmt(personalIncome)}`}  tone="success" />
              <Row label="Expenses" value={`$${fmt(personalExpense)}`} tone="destructive" />
              <div className="pt-2.5 mt-1 border-t border-border/50 flex items-center justify-between">
                <span className="text-[12px] font-medium text-foreground">Balance</span>
                <span className={`text-[18px] font-bold font-display tabular-nums ${personalBalance >= 0 ? "text-success" : "text-destructive"}`}>
                  {personalBalance >= 0 ? "+" : "-"}${fmt(Math.abs(personalBalance))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── ROW 3: Deep Work + Capture ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
                <Flame className="h-3.5 w-3.5 text-warning" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold font-display text-foreground leading-none">Deep Work</h2>
                <p className="text-[10.5px] text-muted-foreground mt-1">Focused pomodoro sessions</p>
              </div>
            </div>
            <CompactPomodoro />
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold font-display text-foreground leading-none">Quick Capture</h2>
                <p className="text-[10.5px] text-muted-foreground mt-1">Brain dump · ⌘+Enter to save</p>
              </div>
            </div>
            <QuickBrainDump />
          </CardContent>
        </Card>
      </div>

      {/* ─── ROW 4: Wellness Strip ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3 hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckSquare className="h-3.5 w-3.5 text-success" />
                </div>
                <h2 className="text-[14px] font-semibold font-display text-foreground leading-none">Today's Habits</h2>
              </div>
              <span className="text-[12px] font-bold tabular-nums text-foreground">
                <span className="text-primary">{habitsCompleted}</span>
                <span className="text-muted-foreground/60">/{habitsTotal}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEFAULT_HABITS.map((h) => {
                const checked = today.habits[h];
                return (
                  <button
                    key={h}
                    onClick={() => toggleHabit(h)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all ${
                      checked
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                        : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-md shrink-0 flex items-center justify-center text-[9px] transition-all ${
                      checked ? "bg-primary text-primary-foreground" : "border border-border"
                    }`}>
                      {checked && "✓"}
                    </div>
                    <span className="truncate">{h}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-info/10 flex items-center justify-center">
                  <Droplets className="h-3.5 w-3.5 text-info" />
                </div>
                <h2 className="text-[14px] font-semibold font-display text-foreground leading-none">Hydration</h2>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {today.water}ml / 2000ml
              </span>
            </div>
            <Progress value={waterPercent} className="h-2 [&>div]:bg-info" />
            <div className="flex gap-1 mt-3">
              {Array.from({ length: 8 }).map((_, i) => {
                const filled = today.water >= (i + 1) * 250;
                return (
                  <div
                    key={i}
                    className={`flex-1 h-6 rounded-md transition-colors ${filled ? "bg-info/40" : "bg-muted/40"}`}
                  />
                );
              })}
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-2.5">{Math.round(waterPercent)}% of daily goal</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Local subcomponents ── */

function KpiPill({ label, value, tone }: { label: string; value: number; tone: "default" | "success" | "destructive" | "muted" }) {
  const toneCls =
    tone === "success" ? "text-success" :
    tone === "destructive" ? "text-destructive" :
    tone === "muted" ? "text-muted-foreground" :
    "text-foreground";
  return (
    <div className="text-center min-w-[44px]">
      <p className={`text-[20px] font-bold font-display leading-none tabular-nums ${toneCls}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function MoneyTile({
  label,
  amount,
  tone,
  icon,
  prefix = "",
}: {
  label: string;
  amount: number;
  tone: "success" | "destructive" | "primary";
  icon: React.ReactNode;
  prefix?: string;
}) {
  const toneCls =
    tone === "success" ? "text-success bg-success/8 border-success/20" :
    tone === "destructive" ? "text-destructive bg-destructive/8 border-destructive/20" :
    "text-primary bg-primary/8 border-primary/20";
  return (
    <div className={`rounded-xl border p-3 ${toneCls}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold opacity-80">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-[20px] font-bold font-display tabular-nums mt-2 leading-none">
        {prefix}${fmt(amount)}
      </p>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "success" | "destructive" }) {
  return (
    <div className="flex justify-between items-center text-[12.5px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${tone === "success" ? "text-success" : "text-destructive"}`}>{value}</span>
    </div>
  );
}
