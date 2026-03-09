import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Brain, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePomodoro } from "@/hooks/usePomodoro";
import { toast } from "sonner";

type TimerMode = "work" | "shortBreak" | "longBreak";

const MODES: Record<TimerMode, { label: string; minutes: number; icon: any }> = {
  work: { label: "Focus", minutes: 25, icon: Brain },
  shortBreak: { label: "Short", minutes: 5, icon: Coffee },
  longBreak: { label: "Long", minutes: 15, icon: Coffee },
};

export default function CompactPomodoro() {
  const { todaySessions, todayMinutes, addSession } = usePomodoro();
  const [mode, setMode] = useState<TimerMode>("work");
  const [secondsLeft, setSecondsLeft] = useState(MODES.work.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = MODES[mode].minutes * 60;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsRunning(false);
  }, []);

  const switchMode = useCallback((m: TimerMode) => {
    stopTimer();
    setMode(m);
    setSecondsLeft(MODES[m].minutes * 60);
  }, [stopTimer]);

  const handleComplete = useCallback(() => {
    stopTimer();
    if (mode === "work") {
      addSession({ duration: MODES.work.minutes, type: "work" });
      const next = sessionsCompleted + 1;
      setSessionsCompleted(next);
      toast.success(`Focus #${next} complete! 🎉`);
      switchMode(next % 4 === 0 ? "longBreak" : "shortBreak");
    } else {
      toast("Break over — focus time! 💪");
      switchMode("work");
    }
  }, [mode, sessionsCompleted, stopTimer, switchMode, addSession]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft((p) => (p <= 1 ? 0 : p - 1)), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) handleComplete();
  }, [secondsLeft, isRunning, handleComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
        {(Object.keys(MODES) as TimerMode[]).map((m) => (
          <button key={m} onClick={() => switchMode(m)}
            className={`flex-1 text-[10px] font-medium py-1 rounded transition-all ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold font-display tabular-nums text-foreground flex-1">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { stopTimer(); setSecondsLeft(MODES[mode].minutes * 60); }}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" className="h-10 w-10 rounded-full shadow-md" onClick={() => setIsRunning((p) => !p)}>
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-1" />

      {/* Stats */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-2 w-2 rounded-full ${i <= sessionsCompleted % 4 ? "bg-primary" : "bg-muted-foreground/20"}`} />
          ))}
        </div>
        <span>{todayMinutes}m · {todaySessions.length} sessions</span>
      </div>
    </div>
  );
}
