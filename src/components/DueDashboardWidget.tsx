import { ArrowDownLeft, ArrowUpRight, ArrowRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useDues } from "@/hooks/useDues";

export default function DueDashboardWidget() {
  const navigate = useNavigate();
  const { dues } = useDues();

  const pendingDues = dues.filter((d) => d.status === "pending");
  const totalOwedToMe = pendingDues.filter((d) => d.type === "owed_to_me").reduce((s, d) => s + d.amount, 0);
  const totalIOwe = pendingDues.filter((d) => d.type === "i_owe").reduce((s, d) => s + d.amount, 0);
  const netBalance = totalOwedToMe - totalIOwe;
  const recentPending = pendingDues.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="h-4 w-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">They Owe Me</p>
              <p className="text-lg font-bold font-display text-success leading-tight">${totalOwedToMe.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">I Owe Them</p>
              <p className="text-lg font-bold font-display text-destructive leading-tight">${totalIOwe.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">Net Balance</p>
              <p className={`text-lg font-bold font-display leading-tight ${netBalance >= 0 ? "text-success" : "text-destructive"}`}>
                {netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toFixed(0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent pending dues */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Dues</p>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7" onClick={() => navigate("/finance")}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {recentPending.length > 0 ? (
            <div className="space-y-1">
              {recentPending.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${d.type === "owed_to_me" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {d.type === "owed_to_me"
                        ? <ArrowDownLeft className="h-3 w-3 text-success" />
                        : <ArrowUpRight className="h-3 w-3 text-destructive" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{d.name}</p>
                      {d.description && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{d.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold tabular-nums ${d.type === "owed_to_me" ? "text-success" : "text-destructive"}`}>
                      ${d.amount.toFixed(0)}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                      {d.type === "owed_to_me" ? "Receivable" : "Payable"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-6">
              <Users className="h-6 w-6 mx-auto mb-2 opacity-20" />
              <p>No pending dues</p>
              <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => navigate("/finance")}>
                Add a due <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
