import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, Timer, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePomodoro } from "@/hooks/usePomodoro";
import { toast } from "sonner";

type TimerMode = "work" | "shortBreak" | "longBreak";

const MODES: Record<TimerMode, { label: string; minutes: number; icon: any; color: string }> = {
  work: { label: "Focus", minutes: 25, icon: Brain, color: "text-primary" },
  shortBreak: { label: "Short Break", minutes: 5, icon: Coffee, color: "text-warning" },
  longBreak: { label: "Long Break", minutes: 15, icon: Coffee, color: "text-accent" },
};

export default function PomodoroTimer() {
  const { todaySessions, todayMinutes, addSession } = usePomodoro();
  const [mode, setMode] = useState<TimerMode>("work");
  const [secondsLeft, setSecondsLeft] = useState(MODES.work.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = MODES[mode].minutes * 60;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      stopTimer();
      setMode(newMode);
      setSecondsLeft(MODES[newMode].minutes * 60);
    },
    [stopTimer]
  );

  const handleComplete = useCallback(() => {
    stopTimer();

    if (mode === "work") {
      addSession({ duration: MODES.work.minutes, type: "work" });
      const next = sessionsCompleted + 1;
      setSessionsCompleted(next);
      toast.success(`Focus session #${next} complete! 🎉`);

      if (next % 4 === 0) {
        switchMode("longBreak");
      } else {
        switchMode("shortBreak");
      }
    } else {
      toast("Break's over — time to focus! 💪");
      switchMode("work");
    }
  }, [mode, sessionsCompleted, stopTimer, switchMode, addSession]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      handleComplete();
    }
  }, [secondsLeft, isRunning, handleComplete]);

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    stopTimer();
    setSecondsLeft(MODES[mode].minutes * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const ModeIcon = MODES[mode].icon;

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <h3 className="font-semibold font-display text-sm">Pomodoro Timer</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">
              {todayMinutes}m today · {todaySessions.length} sessions
            </span>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {(Object.keys(MODES) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all ${
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ModeIcon className={`h-5 w-5 ${MODES[mode].color}`} />
            <span className={`text-xs font-medium uppercase tracking-wider ${MODES[mode].color}`}>
              {MODES[mode].label}
            </span>
          </div>
          <div className="text-5xl font-bold font-display tracking-tight tabular-nums text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <Progress value={progress} className="mt-4 h-1.5" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={resetTimer}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={toggleTimer}
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <div className="h-10 w-10" /> {/* spacer for symmetry */}
        </div>

        {/* Session Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i <= sessionsCompleted % 4 || (sessionsCompleted > 0 && sessionsCompleted % 4 === 0 && i === 4)
                  ? "bg-primary"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-2">
            {sessionsCompleted % 4}/4 until long break
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
