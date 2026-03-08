import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, FileDown, TrendingUp, TrendingDown, DollarSign, Clock, CalendarDays } from "lucide-react";
import type { Payment, FreelanceExpense, Client, Project, Withdrawal } from "@/hooks/useFreelance";
import type { TimeEntry } from "@/hooks/useTimeTracking";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 50%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(350, 60%, 50%)",
  "hsl(50, 70%, 50%)",
];

interface Props {
  payments: Payment[];
  expenses: FreelanceExpense[];
  clients: Client[];
  projects: Project[];
  withdrawals: Withdrawal[];
  timeEntries: TimeEntry[];
}

type ViewMode = "monthly" | "yearly";

export default function ReportsTab({ payments, expenses, clients, projects, withdrawals, timeEntries }: Props) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));

  const years = useMemo(() => {
    const all = [
      ...payments.map((p) => new Date(p.date).getFullYear()),
      ...expenses.map((e) => new Date(e.date).getFullYear()),
    ];
    const unique = [...new Set(all)].sort((a, b) => b - a);
    if (!unique.includes(now.getFullYear())) unique.unshift(now.getFullYear());
    return unique;
  }, [payments, expenses]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: new Date(2000, i).toLocaleString("default", { month: "long" }),
  }));

  // Filter data by period
  const periodFilter = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    return {
      matchDate: (dateStr: string) => {
        const d = new Date(dateStr);
        if (viewMode === "yearly") return d.getFullYear() === year;
        return d.getFullYear() === year && d.getMonth() === month;
      },
      label: viewMode === "monthly"
        ? `${months[parseInt(selectedMonth)].label} ${selectedYear}`
        : selectedYear,
    };
  }, [viewMode, selectedYear, selectedMonth]);

  const filteredPayments = payments.filter((p) => periodFilter.matchDate(p.date));
  const filteredExpenses = expenses.filter((e) => periodFilter.matchDate(e.date));
  const filteredWithdrawals = withdrawals.filter((w) => periodFilter.matchDate(w.date));
  const filteredTimeEntries = timeEntries.filter((t) => !t.is_running && periodFilter.matchDate(t.start_time));

  const totalEarned = filteredPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = filteredPayments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalWithdrawn = filteredWithdrawals.reduce((s, w) => s + w.amount, 0);
  const netProfit = totalEarned - totalExpenses;
  const totalHours = filteredTimeEntries.reduce((s, t) => s + (t.duration_minutes || 0), 0) / 60;

  // Revenue by client
  const clientRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPayments.filter((p) => p.status === "paid").forEach((p) => {
      const client = clients.find((c) => c.id === p.client_id);
      const name = client?.name || "Unassigned";
      map[name] = (map[name] || 0) + p.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredPayments, clients]);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Monthly breakdown for yearly view
  const monthlyBreakdown = useMemo(() => {
    if (viewMode !== "yearly") return [];
    const year = parseInt(selectedYear);
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      const earned = payments.filter((p) => p.status === "paid" && p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
      const exp = expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      return { label: new Date(year, i).toLocaleString("default", { month: "short" }), earned, expenses: exp, profit: earned - exp };
    });
  }, [viewMode, selectedYear, payments, expenses]);

  // Project summary
  const projectSummary = useMemo(() => {
    return projects.map((p) => {
      const pPayments = filteredPayments.filter((pay) => pay.project_id === p.id && pay.status === "paid");
      const pTime = filteredTimeEntries.filter((t) => t.project_id === p.id);
      const earned = pPayments.reduce((s, pay) => s + pay.amount, 0);
      const hours = pTime.reduce((s, t) => s + (t.duration_minutes || 0), 0) / 60;
      if (earned === 0 && hours === 0) return null;
      const client = clients.find((c) => c.id === p.client_id);
      return { name: p.name, client: client?.name || "—", earned, hours, rate: hours > 0 ? earned / hours : 0 };
    }).filter(Boolean) as { name: string; client: string; earned: number; hours: number; rate: number }[];
  }, [projects, filteredPayments, filteredTimeEntries, clients]);

  // CSV Export
  const exportCSV = (type: "summary" | "payments" | "expenses" | "time") => {
    let csv = "";
    let filename = "";

    if (type === "summary") {
      csv = "Metric,Value\n";
      csv += `Period,${periodFilter.label}\n`;
      csv += `Total Earned,$${totalEarned.toFixed(2)}\n`;
      csv += `Total Pending,$${totalPending.toFixed(2)}\n`;
      csv += `Total Expenses,$${totalExpenses.toFixed(2)}\n`;
      csv += `Net Profit,$${netProfit.toFixed(2)}\n`;
      csv += `Total Withdrawn,$${totalWithdrawn.toFixed(2)}\n`;
      csv += `Total Hours,${totalHours.toFixed(1)}\n`;
      if (projectSummary.length) {
        csv += "\nProject,Client,Earned,Hours,Hourly Rate\n";
        projectSummary.forEach((p) => {
          csv += `"${p.name}","${p.client}",$${p.earned.toFixed(2)},${p.hours.toFixed(1)},$${p.rate.toFixed(2)}\n`;
        });
      }
      filename = `report-summary-${periodFilter.label.replace(/\s/g, "-")}.csv`;
    } else if (type === "payments") {
      csv = "Date,Amount,Status,Client,Project,Description\n";
      filteredPayments.forEach((p) => {
        const client = clients.find((c) => c.id === p.client_id)?.name || "";
        const project = projects.find((pr) => pr.id === p.project_id)?.name || "";
        csv += `${p.date},$${p.amount.toFixed(2)},${p.status},"${client}","${project}","${p.description || ""}"\n`;
      });
      filename = `payments-${periodFilter.label.replace(/\s/g, "-")}.csv`;
    } else if (type === "expenses") {
      csv = "Date,Amount,Category,Description\n";
      filteredExpenses.forEach((e) => {
        csv += `${e.date},$${e.amount.toFixed(2)},${e.category},"${e.description || ""}"\n`;
      });
      filename = `expenses-${periodFilter.label.replace(/\s/g, "-")}.csv`;
    } else if (type === "time") {
      csv = "Date,Duration (min),Project,Client,Description\n";
      filteredTimeEntries.forEach((t) => {
        const project = projects.find((p) => p.id === t.project_id)?.name || "";
        const client = clients.find((c) => c.id === t.client_id)?.name || "";
        csv += `${t.start_time.slice(0, 10)},${t.duration_minutes || 0},"${project}","${client}","${t.description || ""}"\n`;
      });
      filename = `time-entries-${periodFilter.label.replace(/\s/g, "-")}.csv`;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        {viewMode === "monthly" && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => exportCSV("summary")}>
            <Download className="h-3 w-3" /> Summary
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => exportCSV("payments")}>
            <FileDown className="h-3 w-3" /> Payments
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => exportCSV("expenses")}>
            <FileDown className="h-3 w-3" /> Expenses
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => exportCSV("time")}>
            <FileDown className="h-3 w-3" /> Time
          </Button>
        </div>
      </div>

      {/* Period Label */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold font-display text-card-foreground">{periodFilter.label} Report</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <MiniStat icon={TrendingUp} label="Earned" value={`$${totalEarned.toFixed(0)}`} />
        <MiniStat icon={Clock} label="Pending" value={`$${totalPending.toFixed(0)}`} />
        <MiniStat icon={TrendingDown} label="Expenses" value={`$${totalExpenses.toFixed(0)}`} />
        <MiniStat icon={DollarSign} label="Net Profit" value={`$${netProfit.toFixed(0)}`} positive={netProfit >= 0} />
        <MiniStat icon={Download} label="Withdrawn" value={`$${totalWithdrawn.toFixed(0)}`} />
        <MiniStat icon={Clock} label="Hours" value={totalHours.toFixed(1)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {viewMode === "yearly" && monthlyBreakdown.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBreakdown} barGap={4}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`$${value.toFixed(0)}`, undefined]}
                  />
                  <Bar dataKey="earned" name="Earned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {clientRevenue.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue by Client</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={clientRevenue} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                    {clientRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`$${value.toFixed(0)}`, undefined]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {expenseByCategory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                    {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`$${value.toFixed(0)}`, undefined]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Project Summary Table */}
      {projectSummary.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Project Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">$/hr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectSummary.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.client}</TableCell>
                    <TableCell className="text-right">${p.earned.toFixed(0)}</TableCell>
                    <TableCell className="text-right">{p.hours.toFixed(1)}</TableCell>
                    <TableCell className="text-right">${p.rate.toFixed(0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalEarned === 0 && totalExpenses === 0 && totalHours === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No data for {periodFilter.label}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, positive }: { icon: any; label: string; value: string; positive?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-lg font-bold font-display ${positive === false ? "text-destructive" : positive === true ? "text-success" : "text-card-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
