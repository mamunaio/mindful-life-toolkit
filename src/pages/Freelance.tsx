import { useState, useMemo } from "react";
import { Users, FolderKanban, CreditCard, ArrowDownToLine, Receipt, Plus, Trash2, TrendingUp, DollarSign, CheckCircle, Clock, AlertCircle, FileDown, FileText, Timer, FileCheck, BarChart3, Pencil, MessageSquare, X, StickyNote, Target, AlertTriangle, Zap, PieChart, ExternalLink, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useFreelance } from "@/hooks/useFreelance";
import { useInvoices } from "@/hooks/useInvoices";
import { useProposals } from "@/hooks/useProposals";
import { useTransactions } from "@/hooks/useTransactions";
import { generateInvoicePDF } from "@/lib/generateInvoice";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import FreelanceCharts from "@/components/FreelanceCharts";
import TimeTrackingTab from "@/components/TimeTrackingTab";
import ProposalsTab from "@/components/ProposalsTab";
import ReportsTab from "@/components/ReportsTab";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  paused: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const EXPENSE_CATEGORIES = ["software", "hardware", "hosting", "marketing", "education", "travel", "office", "other"];
const WITHDRAWAL_METHODS = ["bank_transfer", "paypal", "wise", "crypto", "cash", "other"];

const MONTHLY_TARGET = 3000; // Default monthly revenue target

export default function Freelance() {
  const {
    clients, addClient, deleteClient,
    projects, addProject, updateProject, deleteProject,
    projectNotes, addProjectNote, deleteProjectNote,
    payments, addPayment, updatePayment, deletePayment,
    withdrawals, addWithdrawal, deleteWithdrawal,
    expenses, addExpense, deleteExpense,
  } = useFreelance();

  const { settings, saveSettings, invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { proposals } = useProposals();
  const { entries: timeEntries } = useTimeTracking();
  const { addTransaction } = useTransactions();

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePrefill, setInvoicePrefill] = useState<any>(null);

  const totalEarned = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalWithdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalEarned - totalExpenses;

  // Monthly revenue (current month paid payments)
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return payments
      .filter((p) => {
        if (p.status !== "paid") return false;
        const d = new Date(p.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((s, p) => s + p.amount, 0);
  }, [payments]);

  // Action items / alerts
  const actionItems = useMemo(() => {
    const items: { label: string; count: number; color: string; icon: any }[] = [];

    const overdueInvoices = invoices.filter((i: any) => i.status !== "paid" && i.due_date && new Date(i.due_date) < new Date()).length;
    if (overdueInvoices > 0) items.push({ label: "Overdue Invoices", count: overdueInvoices, color: "text-destructive", icon: AlertTriangle });

    const unbilledEntries = timeEntries.filter((e: any) => !e.is_running && e.duration_minutes && e.duration_minutes > 0).length;
    const billedHours = Math.round(timeEntries.filter((e: any) => e.duration_minutes).reduce((s: number, e: any) => s + (e.duration_minutes || 0), 0) / 60);
    if (billedHours > 0) items.push({ label: "Unbilled Hours", count: billedHours, color: "text-warning", icon: Clock });

    const pendingProposals = proposals.filter((p) => p.status === "sent" || p.status === "draft").length;
    if (pendingProposals > 0) items.push({ label: "Proposals Pending", count: pendingProposals, color: "text-info", icon: FileCheck });

    const pendingPaymentCount = payments.filter((p) => p.status === "pending").length;
    if (pendingPaymentCount > 0) items.push({ label: "Pending Payments", count: pendingPaymentCount, color: "text-warning", icon: CreditCard });

    return items;
  }, [invoices, timeEntries, proposals, payments]);

  // Proposal pipeline stats
  const pipelineStats = useMemo(() => {
    const sent = proposals.filter((p) => p.status === "sent").length;
    const draft = proposals.filter((p) => p.status === "draft").length;
    const accepted = proposals.filter((p) => p.status === "accepted").length;
    const rejected = proposals.filter((p) => p.status === "rejected").length;
    const total = accepted + rejected;
    const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { activeBids: sent + draft, accepted, rejected, winRate, total: proposals.length };
  }, [proposals]);

  const handlePaymentStatusChange = (paymentId: string, newStatus: string, payment: any) => {
    const oldStatus = payment.status;
    updatePayment(paymentId, { status: newStatus });
    if (newStatus === "paid" && oldStatus !== "paid") {
      const client = clients.find((c: any) => c.id === payment.client_id);
      const project = projects.find((p: any) => p.id === payment.project_id);
      const desc = [client?.name, project?.name, payment.description].filter(Boolean).join(" · ");
      addTransaction({
        type: "income",
        amount: payment.amount,
        category: "Freelance",
        description: `Freelance: ${desc || "Payment received"}`,
        date: new Date().toISOString().split("T")[0],
      });
      toast.success("Payment marked as paid & synced to Finance!");
    }
  };

  const handleProjectStatusChange = (projectId: string, newStatus: string) => {
    updateProject(projectId, { status: newStatus, ...(newStatus === "completed" ? { completion_percent: 100 } : {}) });
    if (newStatus === "completed") {
      const pendingPayments = payments.filter((p) => p.project_id === projectId && p.status === "pending");
      if (pendingPayments.length > 0) {
        const totalPending = pendingPayments.reduce((s, p) => s + p.amount, 0);
        toast(`Project completed! ${pendingPayments.length} pending payment(s) worth $${totalPending.toFixed(0)}`, {
          action: {
            label: "Mark All Paid",
            onClick: () => {
              pendingPayments.forEach((p) => {
                handlePaymentStatusChange(p.id, "paid", p);
              });
            },
          },
          duration: 8000,
        });
      }
    }
  };

  const revenuePercent = Math.min((monthlyRevenue / MONTHLY_TARGET) * 100, 100);

  return (
    <div className="page-container space-y-6">
      <div className="page-header">
        <h1 className="page-title">Freelance CRM</h1>
        <p className="page-subtitle">Manage clients, projects, pipeline & finances like a pro</p>
      </div>

      {/* Monthly Revenue Target */}
      <Card className="card-elevated border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Monthly Revenue Target</p>
                <p className="text-lg font-bold font-display text-foreground">
                  ${monthlyRevenue.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">/ ${MONTHLY_TARGET.toLocaleString()}</span>
                </p>
              </div>
            </div>
            <span className={`text-sm font-bold ${revenuePercent >= 100 ? "text-success" : revenuePercent >= 50 ? "text-warning" : "text-muted-foreground"}`}>
              {revenuePercent.toFixed(0)}%
            </span>
          </div>
          <Progress value={revenuePercent} className="h-2.5" />
          {revenuePercent >= 100 && (
            <p className="text-[10px] text-success font-medium mt-1.5">🎉 Monthly target achieved!</p>
          )}
        </CardContent>
      </Card>

      {/* Action Items & Pipeline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Action Items */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold font-display">Action Items</h3>
            </div>
            {actionItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">✓ All clear — no pending actions!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actionItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
                      <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                      <span className={`text-xs font-bold ${item.color}`}>{item.count}</span>
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proposal Pipeline & Win Rate */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold font-display">Proposal Pipeline</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">{pipelineStats.activeBids}</p>
                  <p className="text-[10px] text-muted-foreground">Active Bids</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-success">{pipelineStats.accepted}</p>
                  <p className="text-[10px] text-muted-foreground">Won</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-destructive">{pipelineStats.rejected}</p>
                  <p className="text-[10px] text-muted-foreground">Lost</p>
                </div>
              </div>
              <div className="w-px h-12 bg-border/50" />
              <div className="text-center px-3">
                <p className={`text-2xl font-bold font-display ${pipelineStats.winRate >= 50 ? "text-success" : pipelineStats.winRate > 0 ? "text-warning" : "text-muted-foreground"}`}>
                  {pipelineStats.winRate}%
                </p>
                <p className="text-[10px] text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={TrendingUp} label="Earned" value={`$${totalEarned.toFixed(0)}`} gradient="gradient-primary" />
        <StatCard icon={Clock} label="Pending" value={`$${totalPending.toFixed(0)}`} gradient="gradient-warm" />
        <StatCard icon={ArrowDownToLine} label="Withdrawn" value={`$${totalWithdrawn.toFixed(0)}`} gradient="gradient-cool" />
        <StatCard icon={Receipt} label="Expenses" value={`$${totalExpenses.toFixed(0)}`} gradient="bg-destructive/80" />
        <StatCard icon={DollarSign} label="Net Profit" value={`$${netProfit.toFixed(0)}`} gradient="bg-secondary" textColor={netProfit >= 0 ? "text-success" : "text-destructive"} />
      </div>

      <FreelanceCharts payments={payments} expenses={expenses} clients={clients} />

      <Tabs defaultValue="clients" className="space-y-5">
        <TabsList className="grid w-full grid-cols-5 sm:grid-cols-9 h-10">
          <TabsTrigger value="clients" className="gap-1 text-xs sm:text-sm"><Users className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Clients</span></TabsTrigger>
          <TabsTrigger value="proposals" className="gap-1 text-xs sm:text-sm"><FileCheck className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Proposals</span></TabsTrigger>
          <TabsTrigger value="projects" className="gap-1 text-xs sm:text-sm"><FolderKanban className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Projects</span></TabsTrigger>
          <TabsTrigger value="time" className="gap-1 text-xs sm:text-sm"><Timer className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Time</span></TabsTrigger>
          <TabsTrigger value="payments" className="gap-1 text-xs sm:text-sm"><CreditCard className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Payments</span></TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1 text-xs sm:text-sm"><FileText className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Invoices</span></TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1 text-xs sm:text-sm"><ArrowDownToLine className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Withdraw</span></TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1 text-xs sm:text-sm"><Receipt className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Expenses</span></TabsTrigger>
          <TabsTrigger value="reports" className="gap-1 text-xs sm:text-sm"><BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Reports</span></TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ClientsTab
            clients={clients} addClient={addClient} deleteClient={deleteClient}
            payments={payments} projects={projects}
            onCreateInvoice={(prefill: any) => { setInvoicePrefill(prefill); setInvoiceOpen(true); }}
          />
        </TabsContent>
        <TabsContent value="proposals"><ProposalsTab clients={clients} projects={projects} addProject={(p: any) => addProject(p)} /></TabsContent>
        <TabsContent value="projects">
          <ProjectsTab
            projects={projects} clients={clients}
            projectNotes={projectNotes}
            payments={payments} invoices={invoices}
            addProject={addProject} updateProject={updateProject}
            deleteProject={deleteProject}
            onStatusChange={handleProjectStatusChange}
            addProjectNote={addProjectNote} deleteProjectNote={deleteProjectNote}
          />
        </TabsContent>
        <TabsContent value="time"><TimeTrackingTab clients={clients} projects={projects} /></TabsContent>
        <TabsContent value="payments">
          <PaymentsTab payments={payments} clients={clients} projects={projects} addPayment={addPayment} updatePayment={handlePaymentStatusChange} deletePayment={deletePayment}
            onCreateInvoice={(prefill: any) => { setInvoicePrefill(prefill); setInvoiceOpen(true); }} />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab invoices={invoices} clients={clients} settings={settings} deleteInvoice={deleteInvoice} onNewInvoice={() => { setInvoicePrefill(null); setInvoiceOpen(true); }} />
        </TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsTab withdrawals={withdrawals} addWithdrawal={addWithdrawal} deleteWithdrawal={deleteWithdrawal} /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} /></TabsContent>
        <TabsContent value="reports"><ReportsTab payments={payments} expenses={expenses} clients={clients} projects={projects} withdrawals={withdrawals} timeEntries={timeEntries} /></TabsContent>
      </Tabs>

      <InvoiceBuilder open={invoiceOpen} onOpenChange={setInvoiceOpen} settings={settings} onSaveSettings={saveSettings} onSaveInvoice={addInvoice} clients={clients} projects={projects} prefill={invoicePrefill} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient, textColor }: { icon: any; label: string; value: string; gradient: string; textColor?: string }) {
  return (
    <Card className="card-elevated">
      <CardContent className="p-4">
        <div className={`w-8 h-8 rounded-lg ${gradient} flex items-center justify-center mb-2`}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
        <p className={`text-lg font-bold font-display ${textColor || "text-card-foreground"}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}

/* ==================== SUPERCHARGED CLIENTS TAB ==================== */
function ClientsTab({ clients, addClient, deleteClient, payments, projects, onCreateInvoice }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    addClient({ name: name.trim(), email: email || null, company: company || null, notes: notes || null });
    setName(""); setEmail(""); setCompany(""); setNotes(""); setOpen(false);
  };

  const getClientStatus = (clientId: string) => {
    const clientProjects = projects.filter((p: any) => p.client_id === clientId);
    if (clientProjects.length === 0) return "new";
    const hasActive = clientProjects.some((p: any) => p.status === "active");
    if (hasActive) return "active";
    const hasPaused = clientProjects.some((p: any) => p.status === "paused");
    if (hasPaused) return "paused";
    return "completed";
  };

  const CLIENT_STATUS_STYLES: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    completed: "bg-primary/10 text-primary border-primary/20",
    paused: "bg-warning/10 text-warning border-warning/20",
    new: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1 h-9"><Plus className="h-4 w-4" /> Add Client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Client</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label className="text-xs font-medium">Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" /></div>
              <div className="space-y-1"><Label className="text-xs font-medium">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" /></div>
              <div className="space-y-1"><Label className="text-xs font-medium">Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" /></div>
              <div className="space-y-1"><Label className="text-xs font-medium">Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." /></div>
              <Button className="w-full" onClick={handleAdd} disabled={!name.trim()}>Add Client</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {clients.length === 0 ? (
        <EmptyState icon={Users} text="No clients yet. Add your first client!" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clients.map((c: any) => {
            const status = getClientStatus(c.id);
            const clientPayments = payments.filter((p: any) => p.client_id === c.id);
            const totalBilled = clientPayments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0);
            const pendingDues = clientPayments.filter((p: any) => p.status === "pending" || p.status === "overdue").reduce((s: number, p: any) => s + p.amount, 0);
            const activeProjects = projects.filter((p: any) => p.client_id === c.id && p.status === "active").length;

            return (
              <Card key={c.id} className="group card-elevated hover:shadow-md transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-card-foreground text-sm">{c.name}</p>
                        <Badge className={`text-[9px] border capitalize ${CLIENT_STATUS_STYLES[status]}`}>{status}</Badge>
                      </div>
                      {c.company && <p className="text-[11px] text-muted-foreground">{c.company}</p>}
                      {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteClient(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Financial Stats */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex-1 p-2 rounded-md bg-success/5 border border-success/10">
                      <p className="text-[10px] text-muted-foreground">Total Billed</p>
                      <p className="font-bold text-success">${totalBilled.toFixed(0)}</p>
                    </div>
                    <div className="flex-1 p-2 rounded-md bg-warning/5 border border-warning/10">
                      <p className="text-[10px] text-muted-foreground">Pending</p>
                      <p className={`font-bold ${pendingDues > 0 ? "text-warning" : "text-muted-foreground"}`}>${pendingDues.toFixed(0)}</p>
                    </div>
                    <div className="flex-1 p-2 rounded-md bg-primary/5 border border-primary/10">
                      <p className="text-[10px] text-muted-foreground">Projects</p>
                      <p className="font-bold text-primary">{activeProjects}</p>
                    </div>
                  </div>

                  {c.notes && <p className="text-[11px] text-muted-foreground line-clamp-1">{c.notes}</p>}

                  {/* Quick Actions */}
                  <div className="flex gap-1.5 pt-1 border-t border-border/30">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1 flex-1"
                      onClick={() => onCreateInvoice({ clientId: c.id })}
                    >
                      <FileText className="h-3 w-3" /> Create Invoice
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1 flex-1"
                      onClick={() => {
                        // Navigate to time tab - use a toast hint
                        toast.info("Switch to the Time tab to log hours for this client");
                      }}
                    >
                      <Timer className="h-3 w-3" /> Log Time
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ==================== PROJECTS TAB (fully editable) ==================== */
function ProjectsTab({ projects, clients, projectNotes, addProject, updateProject, deleteProject, onStatusChange, addProjectNote, deleteProjectNote }: any) {
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [detailProject, setDetailProject] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [editName, setEditName] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPercent, setEditPercent] = useState(0);
  const [editCompletionNotes, setEditCompletionNotes] = useState("");
  const [noteText, setNoteText] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    addProject({ name: name.trim(), client_id: clientId || null, description: description || null, status: "active", budget: budget ? parseFloat(budget) : null, deadline: deadline || null, completion_percent: 0, completion_notes: null });
    setName(""); setClientId(""); setDescription(""); setBudget(""); setDeadline(""); setAddOpen(false);
  };

  const openEdit = (p: any) => {
    setEditProject(p);
    setEditName(p.name);
    setEditClientId(p.client_id || "");
    setEditDescription(p.description || "");
    setEditBudget(p.budget ? String(p.budget) : "");
    setEditDeadline(p.deadline || "");
    setEditPercent(p.completion_percent || 0);
    setEditCompletionNotes(p.completion_notes || "");
  };

  const handleSaveEdit = () => {
    if (!editProject || !editName.trim()) return;
    const newStatus = editPercent === 100 ? "completed" : editProject.status === "completed" && editPercent < 100 ? "active" : editProject.status;
    const wasCompleted = editProject.status !== "completed" && newStatus === "completed";
    updateProject(editProject.id, {
      name: editName.trim(), client_id: editClientId || null, description: editDescription || null,
      budget: editBudget ? parseFloat(editBudget) : null, deadline: editDeadline || null,
      completion_percent: editPercent, completion_notes: editCompletionNotes || null, status: newStatus,
    });
    if (wasCompleted) onStatusChange(editProject.id, "completed");
    toast.success("Project updated!");
    setEditProject(null);
  };

  const handleAddNote = (projectId: string) => {
    if (!noteText.trim()) return;
    addProjectNote({ project_id: projectId, content: noteText.trim() });
    setNoteText("");
    toast.success("Note added!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects..." className="h-8 w-48 text-xs" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Client" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterStatus !== "all" || filterClient !== "all" || searchQuery) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => { setFilterStatus("all"); setFilterClient("all"); setSearchQuery(""); }}>
            Clear filters
          </Button>
        )}
        <div className="flex-1" />
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button className="gap-1 h-8 text-xs"><Plus className="h-3.5 w-3.5" /> Add Project</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Project</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label className="text-xs font-medium">Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" /></div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client (optional)" /></SelectTrigger>
                  <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs font-medium">Budget</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1"><Label className="text-xs font-medium">Deadline</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs font-medium">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project details..." /></div>
              <Button className="w-full" onClick={handleAdd} disabled={!name.trim()}>Add Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onOpenChange={(o) => !o && setEditProject(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Edit Project</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1"><Label className="text-xs font-medium">Name *</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Client</Label>
              <Select value={editClientId} onValueChange={setEditClientId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs font-medium">Budget</Label><Input type="number" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1"><Label className="text-xs font-medium">Deadline</Label><Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs font-medium">Description</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Project details..." rows={2} /></div>
            <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Completion Progress</Label>
                <span className={`text-xs font-bold ${editPercent === 100 ? "text-success" : "text-primary"}`}>{editPercent}%</span>
              </div>
              <Slider value={[editPercent]} onValueChange={(v) => setEditPercent(v[0])} max={100} step={5} className="w-full" />
              <Progress value={editPercent} className="h-2" />
              {editPercent === 100 && <p className="text-[10px] text-success font-medium">✓ Status will be set to "Completed" on save</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Completion / Summary Notes</Label>
              <Textarea value={editCompletionNotes} onChange={(e) => setEditCompletionNotes(e.target.value)} placeholder="Final notes, deliverables, client feedback..." rows={3} />
            </div>
            <Button className="w-full" onClick={handleSaveEdit} disabled={!editName.trim()}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail / Notes Dialog */}
      <Dialog open={!!detailProject} onOpenChange={(o) => { if (!o) { setDetailProject(null); setNoteText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <StickyNote className="h-4 w-4" /> {detailProject?.name} — Updates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
              <Progress value={detailProject?.completion_percent || 0} className="h-2 flex-1" />
              <span className="text-xs font-bold text-primary">{detailProject?.completion_percent || 0}%</span>
              <Badge className={`text-[10px] border ${STATUS_STYLES[detailProject?.status] || ""}`}>{detailProject?.status}</Badge>
            </div>
            {detailProject?.completion_notes && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Summary</p>
                <p className="text-sm text-card-foreground">{detailProject.completion_notes}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a progress update..." className="flex-1"
                onKeyDown={(e) => { if (e.key === "Enter" && detailProject) handleAddNote(detailProject.id); }}
              />
              <Button size="sm" onClick={() => detailProject && handleAddNote(detailProject.id)} disabled={!noteText.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(() => {
              const notes = projectNotes.filter((n: any) => n.project_id === detailProject?.id);
              return notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No updates yet. Add your first progress note!</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((n: any) => (
                    <div key={n.id} className="group/note flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-card-foreground">{n.content}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/note:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteProjectNote(n.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {(() => {
        const filtered = projects.filter((p: any) => {
          if (filterStatus !== "all" && p.status !== filterStatus) return false;
          if (filterClient !== "all" && p.client_id !== filterClient) return false;
          if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        });
        if (projects.length === 0) return <EmptyState icon={FolderKanban} text="No projects yet. Start by adding one!" />;
        if (filtered.length === 0) return (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderKanban className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No projects match your filters</p>
          </div>
        );
        return (
        <div className="space-y-2">
          {filtered.map((p: any) => {
            const client = clients.find((c: any) => c.id === p.client_id);
            const noteCount = projectNotes.filter((n: any) => n.project_id === p.id).length;
            return (
              <Card key={p.id} className="group card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-card-foreground text-sm">{p.name}</p>
                        <Badge className={`text-[10px] border ${STATUS_STYLES[p.status] || ""}`}>{p.status}</Badge>
                        {p.completion_percent > 0 && p.completion_percent < 100 && (
                          <span className="text-[10px] font-medium text-primary">{p.completion_percent}%</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        {client && <span>{client.name}</span>}
                        {p.budget && <span>${Number(p.budget).toFixed(0)}</span>}
                        {p.deadline && <span>Due {p.deadline}</span>}
                      </div>
                      {(p.completion_percent > 0) && (
                        <Progress value={p.completion_percent} className="h-1.5 mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setDetailProject(p)} title="Updates & Notes">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {noteCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-bold">{noteCount}</span>}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(p)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Select value={p.status} onValueChange={(s) => onStatusChange(p.id, s)}>
                        <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteProject(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
}

/* ==================== PAYMENTS TAB ==================== */
function PaymentsTab({ payments, clients, projects, addPayment, updatePayment, deletePayment, onCreateInvoice }: any) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");

  const handleAdd = () => {
    if (!amount) return;
    addPayment({ amount: parseFloat(amount), client_id: clientId || null, project_id: projectId || null, description: description || null, status, date: new Date().toISOString().split("T")[0] });
    setAmount(""); setClientId(""); setProjectId(""); setDescription(""); setStatus("pending"); setOpen(false);
  };

  const statusIcon = (s: string) => s === "paid" ? <CheckCircle className="h-3 w-3" /> : s === "overdue" ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1 h-9"><Plus className="h-4 w-4" /> Add Payment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Payment</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label className="text-xs font-medium">Amount *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs font-medium">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Payment for..." /></div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={!amount}>Add Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} text="No payments recorded yet." />
      ) : (
        <div className="space-y-2">
          {payments.map((p: any) => {
            const client = clients.find((c: any) => c.id === p.client_id);
            const project = projects.find((pr: any) => pr.id === p.project_id);
            return (
              <Card key={p.id} className="group card-elevated">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold font-display text-card-foreground">${p.amount.toFixed(2)}</p>
                      <Badge className={`text-[10px] gap-1 border ${STATUS_STYLES[p.status] || ""}`}>{statusIcon(p.status)} {p.status}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {client?.name}{project ? ` · ${project.name}` : ""}{p.description ? ` — ${p.description}` : ""} · {p.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Select value={p.status} onValueChange={(s) => updatePayment(p.id, s, p)}>
                      <SelectTrigger className="h-7 w-[90px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onCreateInvoice({ paymentId: p.id, clientId: p.client_id, projectId: p.project_id, amount: p.amount, description: p.description, status: p.status })}>
                      <FileText className="h-3 w-3" /> Invoice
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deletePayment(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ==================== INVOICES TAB ==================== */
function InvoicesTab({ invoices, clients, settings, deleteInvoice, onNewInvoice }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1 h-9" onClick={onNewInvoice}><Plus className="h-4 w-4" /> New Invoice</Button>
      </div>
      {invoices.length === 0 ? (
        <EmptyState icon={FileText} text="No invoices yet. Create one from a payment or start fresh!" />
      ) : (
        <div className="space-y-2">
          {invoices.map((inv: any) => (
            <Card key={inv.id} className="group card-elevated">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-card-foreground text-sm">{inv.invoice_number}</p>
                    <Badge className={`text-[10px] border ${STATUS_STYLES[inv.status] || ""}`}>{inv.status}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {inv.client_name} · ${inv.total.toFixed(2)} · {inv.issued_date}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                    const invoiceData = { invoiceNumber: inv.invoice_number, issuedDate: inv.issued_date, dueDate: inv.due_date, clientName: inv.client_name, clientEmail: inv.client_email, clientCompany: inv.client_company, lineItems: inv.line_items, subtotal: inv.subtotal, taxRate: inv.tax_rate, taxAmount: inv.tax_amount, discountPercent: inv.discount_percent, discountAmount: inv.discount_amount, total: inv.total, notes: inv.notes, template: inv.template, status: inv.status };
                    generateInvoicePDF(invoiceData);
                  }}>
                    <FileDown className="h-3 w-3" /> PDF
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteInvoice(inv.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== WITHDRAWALS TAB ==================== */
function WithdrawalsTab({ withdrawals, addWithdrawal, deleteWithdrawal }: any) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!amount) return;
    addWithdrawal({ amount: parseFloat(amount), method, description: description || null, date: new Date().toISOString().split("T")[0] });
    setAmount(""); setMethod("bank_transfer"); setDescription(""); setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1 h-9"><Plus className="h-4 w-4" /> Add Withdrawal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Withdrawal</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label className="text-xs font-medium">Amount *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WITHDRAWAL_METHODS.map((m) => <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs font-medium">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes..." /></div>
              <Button className="w-full" onClick={handleAdd} disabled={!amount}>Add Withdrawal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {withdrawals.length === 0 ? (
        <EmptyState icon={ArrowDownToLine} text="No withdrawals yet." />
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w: any) => (
            <Card key={w.id} className="group card-elevated">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold font-display text-card-foreground">${w.amount.toFixed(2)}</p>
                  <p className="text-[11px] text-muted-foreground">{w.method.replace("_", " ")} · {w.date}{w.description ? ` — ${w.description}` : ""}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteWithdrawal(w.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== EXPENSES TAB ==================== */
function ExpensesTab({ expenses, addExpense, deleteExpense }: any) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("software");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!amount) return;
    addExpense({ amount: parseFloat(amount), category, description: description || null, date: new Date().toISOString().split("T")[0] });
    setAmount(""); setCategory("software"); setDescription(""); setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1 h-9"><Plus className="h-4 w-4" /> Add Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Business Expense</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label className="text-xs font-medium">Amount *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs font-medium">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" /></div>
              <Button className="w-full" onClick={handleAdd} disabled={!amount}>Add Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {expenses.length === 0 ? (
        <EmptyState icon={Receipt} text="No business expenses recorded yet." />
      ) : (
        <div className="space-y-2">
          {expenses.map((e: any) => (
            <Card key={e.id} className="group card-elevated">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold font-display text-destructive">${e.amount.toFixed(2)}</p>
                    <Badge variant="secondary" className="text-[10px]">{e.category}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{e.date}{e.description ? ` — ${e.description}` : ""}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteExpense(e.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-10 w-10 mb-3 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
