import { useState } from "react";
import { Clock, Plus, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSchedule } from "@/hooks/useSchedule";

const COLOR_OPTIONS = ["primary", "destructive", "warning", "success", "info"] as const;

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export default function TodaySchedule() {
  const { events, addEvent, deleteEvent } = useSchedule();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [color, setColor] = useState<string>("primary");

  const handleAdd = () => {
    if (!title.trim()) return;
    addEvent({
      title: title.trim(),
      start_time: startTime,
      end_time: endTime || null,
      color,
    });
    setTitle("");
    setStartTime("09:00");
    setEndTime("");
    setColor("primary");
    setAdding(false);
  };

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-info" />
          <h2 className="text-sm font-semibold font-display text-foreground">Today's Schedule</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setAdding(!adding)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {adding && (
        <div className="space-y-2 p-2.5 rounded-md bg-muted/30 border border-border/50">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting, call, block..."
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div className="flex gap-2">
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-7 text-[11px] flex-1" />
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-7 text-[11px] flex-1" placeholder="End" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: `hsl(var(--${c}))` }}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleAdd}>Add</Button>
            </div>
          </div>
        </div>
      )}

      {events.length > 0 ? (
        <div className="space-y-1">
          {events.map((ev) => {
            const isPast = ev.end_time ? ev.end_time < currentTime : ev.start_time < currentTime;
            const isCurrent = ev.start_time <= currentTime && (!ev.end_time || ev.end_time >= currentTime);
            return (
              <div
                key={ev.id}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors group ${
                  isCurrent ? "bg-primary/8 border border-primary/20" : isPast ? "opacity-50" : "hover:bg-muted/40"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: `hsl(var(--${ev.color}))` }} />
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                  {formatTime(ev.start_time)}
                  {ev.end_time && ` – ${formatTime(ev.end_time)}`}
                </span>
                <span className={`text-xs flex-1 truncate ${isCurrent ? "text-foreground font-medium" : "text-foreground"}`}>
                  {ev.title}
                </span>
                <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      ) : !adding ? (
        <p className="text-xs text-muted-foreground text-center py-3">No events scheduled today</p>
      ) : null}
    </div>
  );
}
