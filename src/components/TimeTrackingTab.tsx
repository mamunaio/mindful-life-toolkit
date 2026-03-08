import { useState, useEffect } from "react";
import { Play, Square, Trash2, Clock, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTimeTracking, type TimeEntry } from "@/hooks/useTimeTracking";
import type { Client } from "@/hooks/useFreelance";
import type { Project } from "@/hooks/useFreelance";

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function LiveTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <span className="text-2xl font-bold font-display tabular-nums text-primary">
      {elapsed}
    </span>
  );
}

interface TimeTrackingTabProps {
  clients: Client[];
  projects: Project[];
}

export default function TimeTrackingTab({ clients, projects }: TimeTrackingTabProps) {
  const { entries, runningEntry, totalTrackedToday, startTimer, stopTimer, deleteEntry } =
    useTimeTracking();
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");

  const handleStart = () => {
    startTimer({
      project_id: projectId || null,
      client_id: clientId || null,
      description: description || undefined,
    });
    setDescription("");
  };

  const completedEntries = entries.filter((e) => !e.is_running);

  return (
    <div className="space-y-4">
      {/* Active Timer / Start New */}
      <Card className="border-primary/20">
        <CardContent className="p-5 space-y-4">
          {runningEntry ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium text-foreground">Timer Running</span>
                </div>
                <Button variant="destructive" size="sm" onClick={stopTimer} className="gap-1.5">
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              </div>
              <LiveTimer startTime={runningEntry.start_time} />
              {runningEntry.description && (
                <p className="text-sm text-muted-foreground">{runningEntry.description}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                {runningEntry.project_id && (
                  <Badge variant="secondary" className="text-xs">
                    {projects.find((p) => p.id === runningEntry.project_id)?.name || "Project"}
                  </Badge>
                )}
                {runningEntry.client_id && (
                  <Badge variant="outline" className="text-xs">
                    {clients.find((c) => c.id === runningEntry.client_id)?.name || "Client"}
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <h3 className="font-semibold font-display text-sm">Start Tracking</h3>
              </div>
              <Input
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects
                      .filter((p) => !clientId || clientId === "none" || p.client_id === clientId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStart} className="w-full gap-2">
                <Play className="h-4 w-4" /> Start Timer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <div className="flex items-center gap-3 px-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Today: <strong className="text-foreground">{formatDuration(totalTrackedToday)}</strong>
        </span>
      </div>

      {/* History */}
      {completedEntries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No time entries yet. Start tracking!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {completedEntries.map((entry) => {
            const project = projects.find((p) => p.id === entry.project_id);
            const client = clients.find((c) => c.id === entry.client_id);
            const date = new Date(entry.start_time).toLocaleDateString();
            return (
              <Card key={entry.id} className="border-border/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {entry.description || "Untitled"}
                      </span>
                      {project && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {project.name}
                        </Badge>
                      )}
                      {client && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {client.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{date}</span>
                      <span className="font-medium text-foreground">
                        {formatDuration(entry.duration_minutes || 0)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
