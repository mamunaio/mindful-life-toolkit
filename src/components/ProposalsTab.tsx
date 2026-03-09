import { useState } from "react";
import { FileCheck, Plus, Trash2, ArrowRightCircle, Send, Eye, Link2, Bold, Italic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProposals, type Proposal } from "@/hooks/useProposals";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-warning/10 text-warning",
};

const TEMPLATES = [
  { value: "standard", label: "Standard", desc: "General-purpose proposal with scope & deliverables" },
  { value: "detailed", label: "Detailed", desc: "Comprehensive with timeline, terms & milestones" },
  { value: "minimal", label: "Minimal", desc: "Simple one-page summary" },
];

interface Props {
  clients: any[];
  projects: any[];
  addProject: (p: any) => void;
}

/* Simple rich text toolbar helper */
function RichTextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const wrapSelection = (tag: string) => {
    const el = document.activeElement as HTMLTextAreaElement;
    if (!el || el.tagName !== "TEXTAREA") return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);
    if (tag === "bold") {
      onChange(`${before}**${selected}**${after}`);
    } else if (tag === "italic") {
      onChange(`${before}_${selected}_${after}`);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-1">
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => wrapSelection("bold")} title="Bold (**text**)">
          <Bold className="h-3 w-3" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => wrapSelection("italic")} title="Italic (_text_)">
          <Italic className="h-3 w-3" />
        </Button>
        <span className="text-[9px] text-muted-foreground ml-1">Use **bold** and _italic_ markdown</span>
      </div>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
    </div>
  );
}

/* Render markdown-style text */
function RichText({ text }: { text: string }) {
  // Simple bold/italic rendering
  const parts = text.split(/(\*\*.*?\*\*|_.*?_)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export default function ProposalsTab({ clients, projects, addProject }: Props) {
  const { proposals, addProposal, updateProposal, deleteProposal, convertToProject } = useProposals();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"proposal" | "contract">("proposal");
  const [clientId, setClientId] = useState("");
  const [template, setTemplate] = useState("standard");
  const [scope, setScope] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([""]);
  const [timeline, setTimeline] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [jobSourceUrl, setJobSourceUrl] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);

  const resetForm = () => {
    setTitle(""); setType("proposal"); setClientId(""); setTemplate("standard");
    setScope(""); setDeliverables([""]); setTimeline(""); setPaymentTerms("");
    setTotalAmount(""); setValidUntil(""); setNotes(""); setJobSourceUrl("");
    setPortfolioLinks([""]);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await addProposal({
        title: title.trim(),
        type,
        client_id: clientId || null,
        project_id: null,
        status: "draft",
        template,
        scope: scope || null,
        deliverables: deliverables.filter(d => d.trim()).map(d => ({ item: d.trim() })),
        timeline: timeline || null,
        payment_terms: paymentTerms || null,
        total_amount: totalAmount ? parseFloat(totalAmount) : null,
        valid_until: validUntil || null,
        notes: notes || null,
        job_source_url: jobSourceUrl || null,
        portfolio_links: portfolioLinks.filter(l => l.trim()).map(l => l.trim()),
      } as any);
      toast({ title: `${type === "contract" ? "Contract" : "Proposal"} created` });
      resetForm();
      setCreateOpen(false);
    } catch {
      toast({ title: "Error creating proposal", variant: "destructive" });
    }
  };

  const handleConvert = async (p: Proposal) => {
    await convertToProject(p, addProject);
    toast({ title: "Proposal accepted & project created!" });
  };

  const handleSend = (p: Proposal) => {
    updateProposal(p.id, { status: "sent" });
    toast({ title: "Status updated to Sent" });
  };

  const addDeliverable = () => setDeliverables([...deliverables, ""]);
  const updateDeliverable = (i: number, v: string) => {
    const d = [...deliverables]; d[i] = v; setDeliverables(d);
  };
  const removeDeliverable = (i: number) => setDeliverables(deliverables.filter((_, idx) => idx !== i));

  const addPortfolioLink = () => setPortfolioLinks([...portfolioLinks, ""]);
  const updatePortfolioLink = (i: number, v: string) => {
    const l = [...portfolioLinks]; l[i] = v; setPortfolioLinks(l);
  };
  const removePortfolioLink = (i: number) => setPortfolioLinks(portfolioLinks.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="h-4 w-4" /> New Proposal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">Create Proposal / Contract</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Title *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Website Redesign Proposal" />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Template</Label>
                  <Select value={template} onValueChange={setTemplate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Job Source URL */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5"><Link2 className="h-3 w-3" /> Job Source / URL</Label>
                <Input value={jobSourceUrl} onChange={e => setJobSourceUrl(e.target.value)} placeholder="https://upwork.com/job/... or 'Referral from John'" />
              </div>

              {/* Scope with Rich Text */}
              <div className="space-y-1">
                <Label>Scope of Work</Label>
                <RichTextArea value={scope} onChange={setScope} placeholder="Describe the work to be performed..." rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Deliverables</Label>
                {deliverables.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={d} onChange={e => updateDeliverable(i, e.target.value)} placeholder={`Deliverable ${i + 1}`} />
                    {deliverables.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeDeliverable(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addDeliverable} className="text-xs">+ Add Deliverable</Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Timeline</Label>
                  <Input value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="e.g. 4 weeks" />
                </div>
                <div className="space-y-1">
                  <Label>Total Amount</Label>
                  <Input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Payment Terms</Label>
                  <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. 50% upfront, 50% on completion" />
                </div>
                <div className="space-y-1">
                  <Label>Valid Until</Label>
                  <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                </div>
              </div>

              {/* Portfolio / Attachment Links */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Link2 className="h-3 w-3" /> Portfolio / Attachment Links</Label>
                {portfolioLinks.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={l} onChange={e => updatePortfolioLink(i, e.target.value)} placeholder="https://dribbble.com/shot/..." />
                    {portfolioLinks.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removePortfolioLink(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPortfolioLink} className="text-xs">+ Add Link</Button>
              </div>

              {/* Notes with Rich Text */}
              <div className="space-y-1">
                <Label>Notes</Label>
                <RichTextArea value={notes} onChange={setNotes} placeholder="Additional notes or terms..." rows={2} />
              </div>

              <Button className="w-full" onClick={handleCreate} disabled={!title.trim()}>
                Create {type === "contract" ? "Contract" : "Proposal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No proposals or contracts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {proposals.map((p) => {
            const client = clients.find((c: any) => c.id === p.client_id);
            const dels = Array.isArray(p.deliverables) ? p.deliverables : [];
            const pLinks = (p as any).portfolio_links;
            const linkCount = Array.isArray(pLinks) ? pLinks.length : 0;
            return (
              <Card key={p.id} className="group">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge className={`gap-1 shrink-0 ${STATUS_STYLES[p.status] || ""}`}>{p.status}</Badge>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-card-foreground truncate">{p.title}</p>
                        <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {client?.name || "No client"}
                        {p.total_amount ? ` · $${Number(p.total_amount).toFixed(0)}` : ""}
                        {p.timeline ? ` · ${p.timeline}` : ""}
                        {dels.length > 0 ? ` · ${dels.length} deliverable${dels.length > 1 ? "s" : ""}` : ""}
                        {(p as any).job_source_url ? ` · Source: ${(p as any).job_source_url.substring(0, 30)}...` : ""}
                        {linkCount > 0 ? ` · ${linkCount} link${linkCount > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="View" onClick={() => setViewProposal(p)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    {p.status === "draft" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Mark as Sent" onClick={() => handleSend(p)}>
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                    {(p.status === "sent" || p.status === "draft") && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-success" title="Accept & Create Project" onClick={() => handleConvert(p)}>
                        <ArrowRightCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Select value={p.status} onValueChange={(s: any) => updateProposal(p.id, { status: s })}>
                      <SelectTrigger className="h-7 w-[90px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-destructive" onClick={() => deleteProposal(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Proposal Detail Dialog */}
      <Dialog open={!!viewProposal} onOpenChange={() => setViewProposal(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewProposal && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  {viewProposal.title}
                  <Badge variant="outline" className="text-xs">{viewProposal.type}</Badge>
                  <Badge className={`text-xs ${STATUS_STYLES[viewProposal.status]}`}>{viewProposal.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Client</p>
                    <p className="text-card-foreground">{clients.find((c: any) => c.id === viewProposal.client_id)?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Amount</p>
                    <p className="text-card-foreground font-semibold">{viewProposal.total_amount ? `$${Number(viewProposal.total_amount).toFixed(2)}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Timeline</p>
                    <p className="text-card-foreground">{viewProposal.timeline || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Valid Until</p>
                    <p className="text-card-foreground">{viewProposal.valid_until || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Payment Terms</p>
                    <p className="text-card-foreground">{viewProposal.payment_terms || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Template</p>
                    <p className="text-card-foreground capitalize">{viewProposal.template}</p>
                  </div>
                </div>

                {/* Job Source */}
                {(viewProposal as any).job_source_url && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Job Source</p>
                    {(viewProposal as any).job_source_url.startsWith("http") ? (
                      <a href={(viewProposal as any).job_source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> {(viewProposal as any).job_source_url}
                      </a>
                    ) : (
                      <p className="text-sm text-card-foreground">{(viewProposal as any).job_source_url}</p>
                    )}
                  </div>
                )}

                {viewProposal.scope && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Scope of Work</p>
                    <div className="text-sm text-card-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3">
                      <RichText text={viewProposal.scope} />
                    </div>
                  </div>
                )}

                {Array.isArray(viewProposal.deliverables) && viewProposal.deliverables.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Deliverables</p>
                    <ul className="space-y-1">
                      {viewProposal.deliverables.map((d: any, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-card-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {d.item || d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Portfolio Links */}
                {(() => {
                  const links = (viewProposal as any).portfolio_links;
                  if (!Array.isArray(links) || links.length === 0) return null;
                  return (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Portfolio / Attachments</p>
                      <div className="space-y-1">
                        {links.map((link: string, i: number) => (
                          <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                            <Link2 className="h-3 w-3 shrink-0" /> {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {viewProposal.notes && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Notes</p>
                    <div className="text-sm text-card-foreground whitespace-pre-wrap">
                      <RichText text={viewProposal.notes} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {viewProposal.status === "draft" && (
                    <Button size="sm" className="gap-1" onClick={() => { handleSend(viewProposal); setViewProposal(null); }}>
                      <Send className="h-3 w-3" /> Mark as Sent
                    </Button>
                  )}
                  {(viewProposal.status === "sent" || viewProposal.status === "draft") && (
                    <Button size="sm" variant="secondary" className="gap-1" onClick={() => { handleConvert(viewProposal); setViewProposal(null); }}>
                      <ArrowRightCircle className="h-3 w-3" /> Accept & Create Project
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
