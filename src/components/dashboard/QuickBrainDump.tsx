import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useNotes } from "@/hooks/useNotes";
import { Lightbulb } from "lucide-react";

export default function QuickBrainDump() {
  const { brainDump, setBrainDump } = useNotes();
  const [local, setLocal] = useState(brainDump);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocal(brainDump); }, [brainDump]);

  const handleChange = (val: string) => {
    setLocal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setBrainDump(val), 800);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-warning" />
        <span className="text-[10px] text-muted-foreground font-medium">Auto-saves</span>
      </div>
      <Textarea
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Quick thought, idea, or reminder..."
        className="min-h-[72px] max-h-[120px] resize-none text-sm bg-muted/30 border-border/50"
      />
    </div>
  );
}
