import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTransactions, Transaction } from "@/hooks/useTransactions";

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
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

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

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="page-container space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Finance</h1>
          <p className="page-subtitle">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-9"><Plus className="h-4 w-4" /> Add Transaction</Button>
          </DialogTrigger>
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
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

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
