import { useState, useMemo } from "react";
import {
  Plus, TrendingUp, TrendingDown, DollarSign, Trash2,
  Wallet, Target, PiggyBank, ArrowDownLeft, ArrowUpRight, ArrowRightLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import DueCollection from "@/components/DueCollection";

const EXPENSE_CATEGORIES = ["Food", "Bills", "Transport", "Fun", "Shopping", "Health", "Education", "Other"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Gift", "Other"];

const CHART_COLORS = [
  "hsl(230, 72%, 56%)", "hsl(36, 86%, 52%)", "hsl(206, 84%, 52%)",
  "hsl(4, 76%, 56%)", "hsl(262, 52%, 56%)", "hsl(160, 64%, 40%)",
  "hsl(36, 86%, 52%)", "hsl(220, 14%, 50%)",
];

const BUDGETS: Record<string, number> = {
  Food: 500, Bills: 800, Transport: 200, Fun: 150,
  Shopping: 300, Health: 100, Education: 200, Other: 100,
};

export default function Finance() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { goals, addGoal, updateGoal, deleteGoal } = useSavingsGoals();
  const [open, setOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"income" | "expense">("expense");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  // Savings goal dialog
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");

  // Fund dialog for adding to a goal
  const [fundGoalId, setFundGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Net worth = all-time income - all-time expenses
  const netWorth = useMemo(() => {
    const allIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const allExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return allIncome - allExpense;
  }, [transactions]);

  // 6-month trend data
  const trendData = useMemo(() => {
    const months: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const monthTxs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      months.push({
        name: label,
        income: monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions, currentMonth, currentYear]);

  const categoryData = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    value: monthTransactions.filter((t) => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0),
  })).filter((d) => d.value > 0);

  const budgetData = EXPENSE_CATEGORIES.map((cat) => {
    const spent = monthTransactions.filter((t) => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0);
    const limit = BUDGETS[cat] || 100;
    return { category: cat, spent, limit, percent: Math.min((spent / limit) * 100, 100) };
  }).filter((b) => b.spent > 0 || BUDGETS[b.category]);

  const handleSubmit = () => {
    if (!amount || !category) return;
    addTransaction({
      type, amount: parseFloat(amount), category,
      description: description || undefined,
      date: new Date().toISOString().split("T")[0],
    });
    setAmount(""); setCategory(""); setDescription(""); setOpen(false);
  };

  const openWithType = (t: "income" | "expense") => {
    setType(t);
    setDefaultType(t);
    setCategory("");
    setOpen(true);
  };

  const handleAddGoal = () => {
    if (!goalName || !goalTarget) return;
    addGoal({
      name: goalName,
      target_amount: parseFloat(goalTarget),
      current_amount: parseFloat(goalCurrent) || 0,
    });
    setGoalName(""); setGoalTarget(""); setGoalCurrent(""); setGoalOpen(false);
  };

  const handleFundGoal = () => {
    if (!fundGoalId || !fundAmount) return;
    const goal = goals.find((g) => g.id === fundGoalId);
    if (!goal) return;
    updateGoal(fundGoalId, { current_amount: goal.current_amount + parseFloat(fundAmount) });
    setFundGoalId(null); setFundAmount("");
  };

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="page-container space-y-8">
      {/* Header with fast action buttons */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Finance</h1>
          <p className="page-subtitle">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-success/30 text-success hover:bg-success/10" onClick={() => openWithType("income")}>
            <ArrowDownLeft className="h-3.5 w-3.5" /> Income
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => openWithType("expense")}>
            <ArrowUpRight className="h-3.5 w-3.5" /> Expense
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-accent/30 text-accent hover:bg-accent/10" onClick={() => openWithType("expense")}>
            <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer
          </Button>
        </div>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">New Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Button variant={type === "expense" ? "default" : "outline"} className="flex-1 h-9" onClick={() => { setType("expense"); setCategory(""); }}>Expense</Button>
              <Button variant={type === "income" ? "default" : "outline"} className="flex-1 h-9" onClick={() => { setType("income"); setCategory(""); }}>Income</Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Amount</Label>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description (optional)</Label>
              <Input placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSubmit}>Add Transaction</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards: Net Worth + Income/Expense/Balance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elevated md:col-span-1">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Net Worth</p>
              <p className={`text-xl font-bold font-display ${netWorth >= 0 ? "text-success" : "text-destructive"}`}>
                ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        {[
          { icon: TrendingUp, label: "Income", value: totalIncome, gradient: "gradient-primary" },
          { icon: TrendingDown, label: "Expenses", value: totalExpense, gradient: "gradient-warm" },
          { icon: DollarSign, label: "Balance", value: balance, gradient: "gradient-cool", colored: true },
        ].map((item) => (
          <Card key={item.label} className="card-elevated">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${item.gradient} flex items-center justify-center shrink-0`}>
                <item.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                <p className={`text-xl font-bold font-display ${item.colored ? (item.value >= 0 ? "text-success" : "text-destructive") : "text-card-foreground"}`}>
                  ${item.value.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Savings Goals */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" /> Financial Goals
          </CardTitle>
          <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs"><Plus className="h-3.5 w-3.5" /> New Goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">New Savings Goal</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Goal Name</Label>
                  <Input placeholder="e.g. Emergency Fund" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Target Amount</Label>
                  <Input type="number" placeholder="10000" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Current Amount (optional)</Label>
                  <Input type="number" placeholder="0" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleAddGoal}>Create Goal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((g) => {
                const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0;
                return (
                  <div key={g.id} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3 group relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium text-card-foreground">{g.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteGoal(g.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">${g.current_amount.toLocaleString()} / ${g.target_amount.toLocaleString()}</span>
                        <span className={`font-semibold ${pct >= 100 ? "text-success" : "text-accent"}`}>{pct.toFixed(0)}%</span>
                      </div>
                      <Progress value={pct} className={`h-2 ${pct >= 100 ? "[&>div]:bg-success" : "[&>div]:bg-accent"}`} />
                    </div>
                    <Button size="sm" variant="outline" className="w-full h-7 text-[11px]" onClick={() => { setFundGoalId(g.id); setFundAmount(""); }}>
                      <Plus className="h-3 w-3 mr-1" /> Add Funds
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-6">
              Set savings goals to track your financial milestones
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fund goal dialog */}
      <Dialog open={!!fundGoalId} onOpenChange={(o) => { if (!o) setFundGoalId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Add Funds to Goal</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Adding to: <span className="text-card-foreground font-medium">{goals.find((g) => g.id === fundGoalId)?.name}</span>
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Amount</Label>
              <Input type="number" placeholder="0.00" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleFundGoal}>Add Funds</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader><CardTitle className="font-display text-sm">Spending by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No expenses this month yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle className="font-display text-sm">6-Month Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            {trendData.some((d) => d.income > 0 || d.expense > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 20%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(val: number, name: string) => [`$${val.toFixed(2)}`, name === "income" ? "Income" : "Expenses"]}
                    contentStyle={{ backgroundColor: "hsl(224, 32%, 12%)", border: "1px solid hsl(220, 14%, 20%)", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "hsl(220, 10%, 46%)" }}
                  />
                  <Bar dataKey="income" fill="hsl(160, 64%, 40%)" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="hsl(4, 76%, 56%)" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Add transactions to see trends</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budgets */}
      <Card className="card-elevated">
        <CardHeader><CardTitle className="font-display text-sm">Monthly Budgets</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {budgetData.slice(0, 6).map((b) => (
            <div key={b.category} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-card-foreground font-medium">{b.category}</span>
                <span className="text-muted-foreground">${b.spent.toFixed(0)} / ${b.limit.toFixed(0)}</span>
              </div>
              <Progress value={b.percent} className={`h-1.5 ${b.percent >= 90 ? "[&>div]:bg-destructive" : b.percent >= 70 ? "[&>div]:bg-warning" : "[&>div]:bg-primary"}`} />
            </div>
          ))}
          {budgetData.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Add expenses to see budget tracking</div>}
        </CardContent>
      </Card>

      {/* Due Collection */}
      <DueCollection />

      {/* Recent Transactions */}
      <Card className="card-elevated">
        <CardHeader><CardTitle className="font-display text-sm">Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-1">
              {transactions.slice(0, 20).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.type === "income" ? "bg-success" : "bg-destructive"}`} />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{t.description || t.category}</p>
                      <p className="text-[11px] text-muted-foreground">{t.category} · {t.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold tabular-nums ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteTransaction(t.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">No transactions yet. Add your first one!</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
