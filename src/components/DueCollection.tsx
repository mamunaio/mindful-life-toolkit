import { useState } from "react";
import { Plus, Trash2, Check, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDues, PersonalDue } from "@/hooks/useDues";

export default function DueCollection() {
  const { dues, addDue, updateDue, deleteDue } = useDues();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"owed_to_me" | "i_owe">("owed_to_me");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"all" | "owed_to_me" | "i_owe">("all");

  const pendingDues = dues.filter((d) => d.status === "pending");
  const totalOwedToMe = pendingDues.filter((d) => d.type === "owed_to_me").reduce((s, d) => s + d.amount, 0);
  const totalIOwe = pendingDues.filter((d) => d.type === "i_owe").reduce((s, d) => s + d.amount, 0);

  const filtered = dues.filter((d) => {
    if (filter === "all") return true;
    return d.type === filter;
  });

  const handleSubmit = () => {
    if (!name || !amount) return;
    addDue({
      type,
      name,
      amount: parseFloat(amount),
      description: description || null,
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    });
    setName(""); setAmount(""); setDescription(""); setOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-cool flex items-center justify-center shrink-0">
              <ArrowDownLeft className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">They Owe Me</p>
              <p className="text-lg font-bold font-display text-success">${totalOwedToMe.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-warm flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">I Owe Them</p>
              <p className="text-lg font-bold font-display text-destructive">${totalIOwe.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-display text-sm">Due Collection</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs"><Plus className="h-3.5 w-3.5" /> Add Due</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">New Due</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Button variant={type === "owed_to_me" ? "default" : "outline"} className="flex-1 h-9 text-xs" onClick={() => setType("owed_to_me")}>
                    <ArrowDownLeft className="h-3.5 w-3.5 mr-1.5" /> They Owe Me
                  </Button>
                  <Button variant={type === "i_owe" ? "default" : "outline"} className="flex-1 h-9 text-xs" onClick={() => setType("i_owe")}>
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" /> I Owe Them
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Person Name</Label>
                  <Input placeholder="Who?" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Amount</Label>
                  <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Description (optional)</Label>
                  <Input placeholder="What for?" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleSubmit}>Add Due</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Filter tabs */}
          <div className="flex gap-1.5 mb-4">
            {(["all", "owed_to_me", "i_owe"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                className="h-7 text-[11px] px-3"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "owed_to_me" ? "They Owe Me" : "I Owe Them"}
              </Button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-1">
              {filtered.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${d.type === "owed_to_me" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {d.type === "owed_to_me"
                        ? <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                        : <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-card-foreground">{d.name}</p>
                        {d.status === "settled" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Settled</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {d.description ? `${d.description} · ` : ""}{d.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold tabular-nums ${d.type === "owed_to_me" ? "text-success" : "text-destructive"}`}>
                      ${d.amount.toFixed(2)}
                    </span>
                    {d.status === "pending" && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-success opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => updateDue(d.id, { status: "settled" })}
                        title="Mark as settled"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteDue(d.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">
              No dues yet. Track who owes you or who you owe!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
