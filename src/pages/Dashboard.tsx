import { CheckSquare, Wallet, Heart, ArrowRight, TrendingUp, TrendingDown, Calendar, Clock, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useHealth, DEFAULT_HABITS } from "@/hooks/useHealth";
import { useTransactions } from "@/hooks/useTransactions";
import { useTasks } from "@/hooks/useTasks";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const { tasks } = useTasks();
  const { transactions } = useTransactions();
  const { today } = useHealth();

  const now = new Date();
  const todoCount = tasks.filter((t) => t.column_id === "todo").length;
  const inProgressCount = tasks.filter((t) => t.column_id === "inprogress").length;
  const doneCount = tasks.filter((t) => t.column_id === "done").length;
  const totalActive = todoCount + inProgressCount;

  // Overdue tasks
  const todayStr = now.toISOString().split("T")[0];
  const overdueTasks = tasks.filter(
    (t) => t.column_id !== "done" && t.due_date && t.due_date < todayStr
  );

  // Top 3 priority tasks (non-done, sorted by priority then date)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const topTasks = tasks
    .filter((t) => t.column_id !== "done")
    .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))
    .slice(0, 3);

  // Finance
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const monthIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = monthIncome - monthExpense;

  // Health
  const habitsCompleted = Object.values(today.habits).filter(Boolean).length;
  const habitsTotal = DEFAULT_HABITS.length;
  const habitPercent = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;
  const waterPercent = Math.min((today.water / 2000) * 100, 100);

  const greeting = displayName ? `${getGreeting()}, ${displayName.split(" ")[0]}` : getGreeting();

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-foreground">
          {greeting}
        </h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Active Tasks"
          value={totalActive}
          sub={`${doneCount} completed`}
          icon={<CheckSquare className="h-4 w-4" />}
          gradient="gradient-primary"
          onClick={() => navigate("/tasks")}
        />
        <MetricCard
          label="Balance"
          value={`$${Math.abs(balance).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          sub={balance >= 0 ? "surplus" : "deficit"}
          icon={balance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          gradient="gradient-warm"
          valueClass={balance >= 0 ? "text-success" : "text-destructive"}
          onClick={() => navigate("/finance")}
        />
        <MetricCard
          label="Habits"
          value={`${habitsCompleted}/${habitsTotal}`}
          sub={`${Math.round(habitPercent)}% done`}
          icon={<Flame className="h-4 w-4" />}
          gradient="gradient-cool"
          onClick={() => navigate("/health")}
        />
        <MetricCard
          label="Water"
          value={`${(today.water / 1000).toFixed(1)}L`}
          sub="of 2L goal"
          icon={<Heart className="h-4 w-4" />}
          gradient="gradient-primary"
          onClick={() => navigate("/health")}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Focus Tasks - Left */}
        <Card className="card-elevated lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold font-display text-foreground">Focus</h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 gap-1" onClick={() => navigate("/tasks")}>
                All tasks <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {overdueTasks.length > 0 && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/8 border border-destructive/15">
                <p className="text-xs font-medium text-destructive">
                  {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}
                </p>
              </div>
            )}

            {topTasks.length > 0 ? (
              <div className="space-y-1.5">
                {topTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      task.priority === "high" ? "bg-destructive" :
                      task.priority === "medium" ? "bg-warning" : "bg-muted-foreground/30"
                    }`} />
                    <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                    <div className="flex items-center gap-2">
                      {task.due_date && (
                        <span className={`text-[10px] font-medium ${
                          task.due_date < todayStr ? "text-destructive" :
                          task.due_date === todayStr ? "text-warning" : "text-muted-foreground"
                        }`}>
                          {task.due_date === todayStr ? "Today" :
                           task.due_date < todayStr ? "Overdue" :
                           new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        task.column_id === "inprogress"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {task.column_id === "inprogress" ? "Active" : "To Do"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No pending tasks</p>
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => navigate("/tasks")}>
                  Create one <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Finance Snapshot */}
          <Card className="card-elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold font-display text-foreground">This Month</h2>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 gap-1" onClick={() => navigate("/finance")}>
                  Details <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Income</p>
                  <p className="text-lg font-bold font-display text-success">${monthIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Expenses</p>
                  <p className="text-lg font-bold font-display text-destructive">${monthExpense.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Habits Progress */}
          <Card className="card-elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold font-display text-foreground">Today's Habits</h2>
                <span className="text-xs font-bold text-primary">{Math.round(habitPercent)}%</span>
              </div>
              <Progress value={habitPercent} className="h-1.5 mb-3" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {DEFAULT_HABITS.map((h) => (
                  <div key={h} className="flex items-center gap-2 py-1">
                    <div className={`w-2.5 h-2.5 rounded-sm ${today.habits[h] ? "bg-primary" : "border border-border"}`} />
                    <span className={`text-xs truncate ${today.habits[h] ? "text-foreground" : "text-muted-foreground"}`}>{h}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Water: {today.water}ml / 2000ml</p>
                  <Progress value={waterPercent} className="h-1 w-20 [&>div]:bg-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, sub, icon, gradient, valueClass, onClick,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
  valueClass?: string;
  onClick: () => void;
}) {
  return (
    <Card className="card-elevated group cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${gradient} flex items-center justify-center shrink-0 text-primary-foreground group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-xl font-bold font-display leading-none ${valueClass || "text-card-foreground"}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
