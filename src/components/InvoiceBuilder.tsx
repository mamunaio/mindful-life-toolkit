import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, FileDown, Settings2 } from "lucide-react";
import { generateInvoicePDF, type LineItem, type InvoiceData } from "@/lib/generateInvoice";
import type { InvoiceSettings, InvoiceRecord } from "@/hooks/useInvoices";

interface InvoiceBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: InvoiceSettings;
  onSaveSettings: (s: InvoiceSettings) => void;
  onSaveInvoice: (inv: Omit<InvoiceRecord, "id" | "created_at">) => Promise<void>;
  clients: any[];
  projects: any[];
  // Pre-fill from payment
  prefill?: {
    paymentId?: string;
    clientId?: string;
    projectId?: string;
    amount?: number;
    description?: string;
    status?: string;
  };
}

const TEMPLATES = [
  { value: "modern", label: "Modern", desc: "Teal accent header" },
  { value: "classic", label: "Classic", desc: "Dark navy professional" },
  { value: "minimal", label: "Minimal", desc: "Clean black & white" },
];

export default function InvoiceBuilder({
  open, onOpenChange, settings, onSaveSettings, onSaveInvoice,
  clients, projects, prefill,
}: InvoiceBuilderProps) {
  const [tab, setTab] = useState<"invoice" | "settings">("invoice");

  // Settings state
  const [bizName, setBizName] = useState(settings.business_name || "Injaazh PLC");
  const [bizEmail, setBizEmail] = useState(settings.business_email || "");
  const [bizAddress, setBizAddress] = useState(settings.business_address || "");
  const [bizPhone, setBizPhone] = useState(settings.business_phone || "");
  const [payTerms, setPayTerms] = useState(settings.payment_terms || "Net 30");
  const [notesTemplate, setNotesTemplate] = useState(settings.notes_template || "Thank you for your business!");
  const [defaultTax, setDefaultTax] = useState(String(settings.default_tax_rate || 0));
  const [defaultCurrency, setDefaultCurrency] = useState(settings.default_currency || "USD");

  useEffect(() => {
    setBizName(settings.business_name || "Injaazh PLC");
    setBizEmail(settings.business_email || "");
    setBizAddress(settings.business_address || "");
    setBizPhone(settings.business_phone || "");
    setPayTerms(settings.payment_terms || "Net 30");
    setNotesTemplate(settings.notes_template || "Thank you for your business!");
    setDefaultTax(String(settings.default_tax_rate || 0));
    setDefaultCurrency(settings.default_currency || "USD");
  }, [settings]);

  // Invoice state
  const [clientId, setClientId] = useState(prefill?.clientId || "");
  const [projectId, setProjectId] = useState(prefill?.projectId || "");
  const [template, setTemplate] = useState<string>("modern");
  const [taxRate, setTaxRate] = useState(String(settings.default_tax_rate || 0));
  const [discountPercent, setDiscountPercent] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState(settings.notes_template || "Thank you for your business!");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: prefill?.description || "Professional services", quantity: 1, rate: prefill?.amount || 0, amount: prefill?.amount || 0 },
  ]);

  useEffect(() => {
    if (prefill) {
      setClientId(prefill.clientId || "");
      setProjectId(prefill.projectId || "");
      if (prefill.amount) {
        setLineItems([{
          description: prefill.description || "Professional services",
          quantity: 1,
          rate: prefill.amount,
          amount: prefill.amount,
        }]);
      }
    }
  }, [prefill]);

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);

  const updateItem = (i: number, field: keyof LineItem, value: string) => {
    setLineItems((prev) => {
      const items = [...prev];
      const item = { ...items[i] };
      if (field === "description") item.description = value;
      else {
        (item as any)[field] = parseFloat(value) || 0;
        item.amount = item.quantity * item.rate;
      }
      items[i] = item;
      return items;
    });
  };

  const addItem = () => setLineItems((p) => [...p, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  const removeItem = (i: number) => setLineItems((p) => p.filter((_, idx) => idx !== i));

  const subtotal = lineItems.reduce((s, item) => s + item.amount, 0);
  const disc = parseFloat(discountPercent) || 0;
  const discountAmount = subtotal * (disc / 100);
  const afterDiscount = subtotal - discountAmount;
  const tax = parseFloat(taxRate) || 0;
  const taxAmount = afterDiscount * (tax / 100);
  const total = afterDiscount + taxAmount;

  const invNumber = `INVNJ-${String(settings.next_invoice_number || 1).padStart(4, "0")}`;

  const buildInvoiceData = (): InvoiceData => ({
    invoiceNumber: invNumber,
    issuedDate: new Date().toISOString().split("T")[0],
    dueDate: dueDate || undefined,
    status: prefill?.status || "draft",
    clientName: client?.name || "Client",
    clientEmail: client?.email,
    clientCompany: client?.company,
    businessName: bizName || undefined,
    businessEmail: bizEmail || undefined,
    businessAddress: bizAddress || undefined,
    businessPhone: bizPhone || undefined,
    lineItems,
    subtotal,
    taxRate: tax,
    taxAmount,
    discountPercent: disc,
    discountAmount,
    total,
    notes: notes || undefined,
    paymentTerms: payTerms || undefined,
    projectName: project?.name,
    template: template as any,
    currency: defaultCurrency,
  });

  const handleDownload = () => {
    generateInvoicePDF(buildInvoiceData());
  };

  const handleSaveAndDownload = async () => {
    const invoiceData = buildInvoiceData();
    await onSaveInvoice({
      invoice_number: invNumber,
      client_id: clientId || null,
      project_id: projectId || null,
      payment_id: prefill?.paymentId || null,
      client_name: client?.name || "Client",
      client_email: client?.email || null,
      client_company: client?.company || null,
      line_items: lineItems,
      subtotal,
      tax_rate: tax,
      tax_amount: taxAmount,
      discount_percent: disc,
      discount_amount: discountAmount,
      total,
      status: prefill?.status || "draft",
      template,
      notes: notes || null,
      due_date: dueDate || null,
      issued_date: new Date().toISOString().split("T")[0],
    });
    generateInvoicePDF(invoiceData);
    onOpenChange(false);
  };

  const handleSaveSettings = () => {
    onSaveSettings({
      business_name: bizName || undefined,
      business_email: bizEmail || undefined,
      business_address: bizAddress || undefined,
      business_phone: bizPhone || undefined,
      payment_terms: payTerms || undefined,
      notes_template: notesTemplate || undefined,
      default_tax_rate: parseFloat(defaultTax) || 0,
      default_currency: defaultCurrency,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Invoice Builder
          </DialogTitle>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setTab("invoice")}
            className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${tab === "invoice" ? "bg-background shadow-sm font-medium text-foreground" : "text-muted-foreground"}`}
          >
            Create Invoice
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1 ${tab === "settings" ? "bg-background shadow-sm font-medium text-foreground" : "text-muted-foreground"}`}
          >
            <Settings2 className="h-3.5 w-3.5" /> Business Details
          </button>
        </div>

        {tab === "settings" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Business Name</Label><Input value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Your Business" /></div>
              <div className="space-y-1"><Label>Email</Label><Input value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} placeholder="billing@company.com" /></div>
              <div className="space-y-1 col-span-2"><Label>Address</Label><Textarea value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} placeholder="123 Main St, City, Country" rows={2} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} placeholder="+1 555 0123" /></div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Default Tax Rate (%)</Label><Input type="number" value={defaultTax} onChange={(e) => setDefaultTax(e.target.value)} placeholder="0" /></div>
              <div className="space-y-1"><Label>Payment Terms</Label><Input value={payTerms} onChange={(e) => setPayTerms(e.target.value)} placeholder="Net 30" /></div>
              <div className="space-y-1 col-span-2"><Label>Default Notes</Label><Textarea value={notesTemplate} onChange={(e) => setNotesTemplate(e.target.value)} rows={2} /></div>
            </div>
            <Button onClick={handleSaveSettings} className="w-full">Save Business Details</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top row: client, project, template */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Invoice number & due date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Invoice #</Label>
                <Input value={invNumber} disabled className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Line Items</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1 h-7 text-xs">
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_80px_80px_32px] gap-2 items-end">
                    <div>
                      {i === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                      <Input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Service" />
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                      <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} min="1" />
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs text-muted-foreground">Rate</Label>}
                      <Input type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} />
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs text-muted-foreground">Amount</Label>}
                      <Input value={item.amount.toFixed(2)} disabled className="bg-muted" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(i)} disabled={lineItems.length === 1}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tax, discount, totals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Tax Rate (%)</Label><Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
              <div className="space-y-1"><Label>Discount (%)</Label><Input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} /></div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">${subtotal.toFixed(2)}</span></div>
              {disc > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount ({disc}%)</span><span className="text-destructive">-${discountAmount.toFixed(2)}</span></div>}
              {tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({tax}%)</span><span className="text-foreground">${taxAmount.toFixed(2)}</span></div>}
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1" onClick={handleDownload}>
                <FileDown className="h-4 w-4" /> Preview PDF
              </Button>
              <Button className="flex-1 gap-1" onClick={handleSaveAndDownload}>
                <FileDown className="h-4 w-4" /> Save & Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
