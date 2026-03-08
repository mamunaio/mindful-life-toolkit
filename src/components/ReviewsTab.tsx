import { useState, useMemo } from "react";
import { Star, Plus, Trash2, MessageSquareQuote, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ClientReview } from "@/hooks/useReviews";
import type { Client } from "@/hooks/useFreelance";
import type { Project } from "@/hooks/useFreelance";

interface Props {
  reviews: ClientReview[];
  clients: Client[];
  projects: Project[];
  addReview: (r: Omit<ClientReview, "id" | "created_at">) => void;
  deleteReview: (id: string) => void;
}

function StarRating({ rating, onChange, size = "md" }: { rating: number; onChange?: (r: number) => void; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${s} ${i <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"} ${onChange ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

export { StarRating };

export default function ReviewsTab({ reviews, clients, projects, addReview, deleteReview }: Props) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleAdd = () => {
    const client = clients.find((c) => c.id === clientId);
    const project = projects.find((p) => p.id === projectId);
    if (!client) return;
    addReview({
      client_id: clientId,
      project_id: projectId || null,
      rating,
      comment: comment.trim() || null,
      client_name: client.name,
      project_name: project?.name || null,
    });
    setClientId(""); setProjectId(""); setRating(5); setComment(""); setOpen(false);
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-display text-card-foreground">{reviews.length}</p>
              <p className="text-[11px] text-muted-foreground">Total Reviews</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold font-display text-warning">{avgRating.toFixed(1)}</p>
                <Star className="h-4 w-4 fill-warning text-warning" />
              </div>
              <p className="text-[11px] text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-display text-success">{fiveStarCount}</p>
              <p className="text-[11px] text-muted-foreground">5-Star Reviews</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add button */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1 h-9"><Plus className="h-4 w-4" /> Add Review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Client Review</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Project (optional)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Rating</Label>
                <StarRating rating={rating} onChange={setRating} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Comment / Feedback</Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did the client say?" rows={3} />
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={!clientId}>Add Review</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Feedback - Completed projects without reviews */}
      {(() => {
        const reviewedProjectIds = new Set(reviews.map((r) => r.project_id).filter(Boolean));
        const pendingFeedback = projects.filter(
          (p: any) => p.status === "completed" && !reviewedProjectIds.has(p.id)
        );
        if (pendingFeedback.length === 0) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="font-display font-semibold text-sm text-card-foreground">Pending Feedback ({pendingFeedback.length})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {pendingFeedback.map((p: any) => {
                const client = clients.find((c: any) => c.id === p.client_id);
                return (
                  <Card key={p.id} className="card-elevated border-warning/20">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-card-foreground text-sm">{p.name}</p>
                        {client && <p className="text-[11px] text-muted-foreground">{client.name}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StarRating rating={0} size="sm" />
                        <span className="text-[10px] text-warning font-medium">No review</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Review Cards */}
      {reviews.length === 0 && projects.filter((p: any) => p.status === "completed").length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <MessageSquareQuote className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm">No client reviews yet. Track your first feedback!</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reviews.map((r) => (
            <Card key={r.id} className="group card-elevated overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-card-foreground text-sm">{r.client_name}</p>
                    {r.project_name && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">Project: {r.project_name}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteReview(r.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <StarRating rating={r.rating} size="sm" />
                {r.comment && (
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                    "{r.comment}"
                  </blockquote>
                )}
                <p className="text-[10px] text-muted-foreground/60">
                  {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
