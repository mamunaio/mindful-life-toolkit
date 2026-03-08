import { useState, useMemo } from "react";
import { Users, FolderKanban, CreditCard, ArrowDownToLine, Receipt, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, CheckCircle, Clock, AlertCircle, FileDown, FileText, Timer, FileCheck, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFreelance } from "@/hooks/useFreelance";
import { useInvoices } from "@/hooks/useInvoices";
import { generateInvoicePDF } from "@/lib/generateInvoice";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import FreelanceCharts from "@/components/FreelanceCharts";
import TimeTrackingTab from "@/components/TimeTrackingTab";
import ProposalsTab from "@/components/ProposalsTab";
import ReportsTab from "@/components/ReportsTab";
import { useTimeTracking } from "@/hooks/useTimeTracking";

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

export default function Freelance() {
  const {
    clients, addClient, deleteClient,
    projects, addProject, updateProject, deleteProject,
    payments, addPayment, updatePayment, deletePayment,
    withdrawals, addWithdrawal, deleteWithdrawal,
    expenses, addExpense, deleteExpense,
  } = useFreelance();

  const { settings, saveSettings, invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { entries: timeEntries } = useTimeTracking();

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePrefill, setInvoicePrefill] = useState<any>(null);

  const totalEarned = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalWithdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalEarned - totalExpenses;

  return (
    <div className="page-container space-y-8 animate-in fade-in duration-500">
      <div className="page-header">
        <h1 className="page-title">Freelance</h1>
        <p className="page-subtitle">Manage your clients, projects, and finances</p>
      </div>

      {/* Overview */}
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

        <TabsContent value="clients"><ClientsTab clients={clients} addClient={addClient} deleteClient={deleteClient} /></TabsContent>
        <TabsContent value="proposals"><ProposalsTab clients={clients} projects={projects} addProject={addProject} /></TabsContent>
        <TabsContent value="projects"><ProjectsTab projects={projects} clients={clients} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} /></TabsContent>
        <TabsContent value="time"><TimeTrackingTab clients={clients} projects={projects} /></TabsContent>
        <TabsContent value="payments">
          <PaymentsTab payments={payments} clients={clients} projects={projects} addPayment={addPayment} updatePayment={updatePayment} deletePayment={deletePayment}
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

/* ==================== CLIENTS TAB ==================== */
function ClientsTab({ clients, addClient, deleteClient }: any) {
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
          {clients.map((c: any) => (
            <Card key={c.id} className="group card-elevated">
              <CardContent className="p-4 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-card-foreground text-sm">{c.name}</p>
                  {c.company && <p className="text-[11px] text-muted-foreground">{c.company}</p>}
                  {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                  {c.notes && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{c.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteClient(c.id)}>
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

/* ==================== PROJECTS TAB ==================== */
function ProjectsTab({ projects, clients, addProject, updateProject, deleteProject }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    addProject({ name: name.trim(), client_id: clientId || null, description: description || null, status: "active", budget: budget ? parseFloat(budget) : null, deadline: deadline || null });
    setName(""); setClientId(""); setDescription(""); setBudget(""); setDeadline(""); setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1 h-9"><Plus className="h-4 w-4" /> Add Project</Button></DialogTrigger>
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
      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} text="No projects yet. Start by adding one!" />
      ) : (
        <div className="space-y-2">
          {projects.map((p: any) => {
            const client = clients.find((c: any) => c.id === p.client_id);
            return (
              <Card key={p.id} className="group card-elevated">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-card-foreground text-sm">{p.name}</p>
                      <Badge className={`text-[10px] border ${STATUS_STYLES[p.status] || ""}`}>{p.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      {client && <span>{client.name}</span>}
                      {p.budget && <span>${Number(p.budget).toFixed(0)}</span>}
                      {p.deadline && <span>Due {p.deadline}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Select value={p.status} onValueChange={(s) => updateProject(p.id, { status: s })}>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
                    <Select value={p.status} onValueChange={(s) => updatePayment(p.id, { status: s })}>
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
