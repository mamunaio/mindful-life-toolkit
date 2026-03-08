import { useState } from "react";
import { Users, FolderKanban, CreditCard, ArrowDownToLine, Receipt, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
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

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  completed: "bg-primary/10 text-primary",
  paused: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
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

  // Stats
  const totalEarned = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalWithdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalEarned - totalExpenses;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Freelance</h1>
        <p className="text-muted-foreground mt-1">Manage your clients, projects, and finances</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={TrendingUp} label="Earned" value={`$${totalEarned.toFixed(0)}`} color="gradient-primary" />
        <StatCard icon={Clock} label="Pending" value={`$${totalPending.toFixed(0)}`} color="gradient-warm" />
        <StatCard icon={ArrowDownToLine} label="Withdrawn" value={`$${totalWithdrawn.toFixed(0)}`} color="gradient-cool" />
        <StatCard icon={Receipt} label="Expenses" value={`$${totalExpenses.toFixed(0)}`} color="bg-destructive/80" />
        <StatCard icon={DollarSign} label="Net Profit" value={`$${netProfit.toFixed(0)}`} color="bg-secondary" textColor={netProfit >= 0 ? "text-success" : "text-destructive"} />
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="clients" className="gap-1 text-xs sm:text-sm"><Users className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Clients</span></TabsTrigger>
          <TabsTrigger value="projects" className="gap-1 text-xs sm:text-sm"><FolderKanban className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Projects</span></TabsTrigger>
          <TabsTrigger value="payments" className="gap-1 text-xs sm:text-sm"><CreditCard className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Payments</span></TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1 text-xs sm:text-sm"><ArrowDownToLine className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Withdraw</span></TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1 text-xs sm:text-sm"><Receipt className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Expenses</span></TabsTrigger>
        </TabsList>

        {/* CLIENTS */}
        <TabsContent value="clients">
          <ClientsTab clients={clients} addClient={addClient} deleteClient={deleteClient} />
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects">
          <ProjectsTab projects={projects} clients={clients} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} />
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments">
          <PaymentsTab payments={payments} clients={clients} projects={projects} addPayment={addPayment} updatePayment={updatePayment} deletePayment={deletePayment} />
        </TabsContent>

        {/* WITHDRAWALS */}
        <TabsContent value="withdrawals">
          <WithdrawalsTab withdrawals={withdrawals} addWithdrawal={addWithdrawal} deleteWithdrawal={deleteWithdrawal} />
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses">
          <ExpensesTab expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, textColor }: { icon: any; label: string; value: string; color: string; textColor?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
        <p className={`text-lg font-bold font-display ${textColor || "text-card-foreground"}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
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
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Add Client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Client</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" /></div>
              <div className="space-y-1"><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" /></div>
              <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." /></div>
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
            <Card key={c.id} className="group">
              <CardContent className="p-4 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-card-foreground">{c.name}</p>
                  {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                  {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                  {c.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.notes}</p>}
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
    addProject({
      name: name.trim(), client_id: clientId || null, description: description || null,
      status: "active", budget: budget ? parseFloat(budget) : null, deadline: deadline || null,
    });
    setName(""); setClientId(""); setDescription(""); setBudget(""); setDeadline(""); setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Add Project</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Project</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" /></div>
              <div className="space-y-1">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client (optional)" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Budget</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1"><Label>Deadline</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project details..." /></div>
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
              <Card key={p.id} className="group">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-card-foreground">{p.name}</p>
                      <Badge className={`text-[10px] ${STATUS_STYLES[p.status] || ""}`}>{p.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
function PaymentsTab({ payments, clients, projects, addPayment, updatePayment, deletePayment }: any) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");

  const handleAdd = () => {
    if (!amount) return;
    addPayment({
      amount: parseFloat(amount), client_id: clientId || null, project_id: projectId || null,
      description: description || null, status, date: new Date().toISOString().split("T")[0],
    });
    setAmount(""); setClientId(""); setProjectId(""); setDescription(""); setStatus("pending"); setOpen(false);
  };

  const statusIcon = (s: string) => s === "paid" ? <CheckCircle className="h-3 w-3" /> : s === "overdue" ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Add Payment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Payment</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label>Amount *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Payment details" /></div>
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
              <Card key={p.id} className="group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={`gap-1 ${STATUS_STYLES[p.status]}`}>{statusIcon(p.status)} {p.status}</Badge>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">${Number(p.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {client?.name || ""}{project ? ` · ${project.name}` : ""}{p.description ? ` · ${p.description}` : ""} · {p.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select value={p.status} onValueChange={(s) => updatePayment(p.id, { status: s })}>
                      <SelectTrigger className="h-7 w-[90px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-destructive" onClick={() => deletePayment(p.id)}>
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
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Add Withdrawal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Withdrawal</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label>Amount *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1">
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WITHDRAWAL_METHODS.map((m) => <SelectItem key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details" /></div>
              <Button className="w-full" onClick={handleAdd} disabled={!amount}>Add Withdrawal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {withdrawals.length === 0 ? (
        <EmptyState icon={ArrowDownToLine} text="No withdrawals recorded yet." />
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w: any) => (
            <Card key={w.id} className="group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">${Number(w.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.method.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    {w.description ? ` · ${w.description}` : ""} · {w.date}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-destructive" onClick={() => deleteWithdrawal(w.id)}>
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
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Add Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Freelance Expense</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1"><Label>Amount *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was it for?" /></div>
              <Button className="w-full" onClick={handleAdd} disabled={!amount}>Add Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {expenses.length === 0 ? (
        <EmptyState icon={Receipt} text="No freelance expenses yet." />
      ) : (
        <div className="space-y-2">
          {expenses.map((e: any) => (
            <Card key={e.id} className="group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs capitalize">{e.category}</Badge>
                  <div>
                    <p className="text-sm font-semibold text-destructive">-${Number(e.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{e.description || e.category} · {e.date}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-destructive" onClick={() => deleteExpense(e.id)}>
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
    <div className="text-center py-16 text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
