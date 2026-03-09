import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/hooks/useNotes";
import { Send, Check } from "lucide-react";
import { toast } from "sonner";

export default function QuickBrainDump() {
  const { brainDump, setBrainDump } = useNotes();
  const [local, setLocal] = useState(brainDump);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setLocal(brainDump); }, [brainDump]);

  const handleSave = () => {
    if (!local.trim()) return;
    setBrainDump(local.trim());
    setSaved(true);
    toast.success("Saved to Notes!");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={local}
        onChange={(e) => { setLocal(e.target.value); setSaved(false); }}
        placeholder="Quick thought, idea, or reminder..."
        className="min-h-[68px] max-h-[110px] resize-none text-sm bg-muted/30 border-border/50"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave(); }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">⌘+Enter to save</span>
        <Button
          size="sm"
          className="h-7 text-xs gap-1.5 px-3"
          onClick={handleSave}
          disabled={!local.trim() || saved}
          variant={saved ? "outline" : "default"}
        >
          {saved ? <><Check className="h-3 w-3" /> Saved</> : <><Send className="h-3 w-3" /> Save to Notes</>}
        </Button>
      </div>
    </div>
  );
}
