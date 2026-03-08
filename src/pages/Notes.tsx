import { useState, useEffect, useRef } from "react";
import { BookOpen, Brain, ListChecks, Plus, Trash2, Check, X, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotes } from "@/hooks/useNotes";

export default function Notes() {
  const {
    journal, brainDump, checklists,
    addJournalEntry, deleteJournalEntry,
    setBrainDump,
    addChecklist, deleteChecklist,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
  } = useNotes();

  const [journalDraft, setJournalDraft] = useState("");
  const [newListName, setNewListName] = useState("");
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [localBrainDump, setLocalBrainDump] = useState(brainDump);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocalBrainDump(brainDump); }, [brainDump]);

  const handleBrainDumpChange = (val: string) => {
    setLocalBrainDump(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBrainDump(val), 800);
  };

  const handleAddEntry = () => {
    if (!journalDraft.trim()) return;
    addJournalEntry(journalDraft.trim());
    setJournalDraft("");
  };

  const handleAddChecklist = () => {
    if (!newListName.trim()) return;
    addChecklist(newListName.trim());
    setNewListName("");
  };

  const handleAddItem = (checklistId: string) => {
    if (!newItemText.trim()) return;
    addChecklistItem(checklistId, newItemText.trim());
    setNewItemText("");
    setAddingItemTo(null);
  };

  return (
    <div className="page-container space-y-8">
      <div className="page-header">
        <h1 className="page-title">Notes</h1>
        <p className="page-subtitle">Journal, brain dump, and checklists</p>
      </div>

      <Tabs defaultValue="journal" className="space-y-5">
        <TabsList className="grid w-full grid-cols-3 h-10">
          <TabsTrigger value="journal" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5" /> Journal
          </TabsTrigger>
          <TabsTrigger value="braindump" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="h-3.5 w-3.5" /> Brain Dump
          </TabsTrigger>
          <TabsTrigger value="checklists" className="gap-1.5 text-xs sm:text-sm">
            <ListChecks className="h-3.5 w-3.5" /> Checklists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="space-y-4">
          <Card className="card-elevated">
            <CardContent className="p-5 space-y-3">
              <Textarea
                placeholder="How was your day? What's on your mind..."
                value={journalDraft}
                onChange={(e) => setJournalDraft(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="flex justify-end">
                <Button onClick={handleAddEntry} disabled={!journalDraft.trim()} className="gap-1.5 h-9">
                  <Send className="h-3.5 w-3.5" /> Save Entry
                </Button>
              </div>
            </CardContent>
          </Card>

          {journal.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
              Your journal is empty. Write your first reflection!
            </div>
          ) : (
            <div className="space-y-3">
              {journal.map((entry) => {
                const d = new Date(entry.created_at);
                return (
                  <Card key={entry.id} className="group card-elevated">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1.5 flex-1">
                          <p className="text-[11px] text-muted-foreground font-medium">
                            {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            {" · "}
                            {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                          <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteJournalEntry(entry.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="braindump">
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" /> Scratchpad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Dump your thoughts, ideas, random notes here..."
                value={localBrainDump}
                onChange={(e) => handleBrainDumpChange(e.target.value)}
                className="min-h-[350px] resize-none text-sm leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground mt-2">Auto-saved as you type</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4">
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="p-4 flex gap-2">
              <Input placeholder="New checklist name..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddChecklist()} />
              <Button onClick={handleAddChecklist} disabled={!newListName.trim()} className="gap-1 shrink-0 h-9">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </CardContent>
          </Card>

          {checklists.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <ListChecks className="h-10 w-10 mx-auto mb-3 opacity-20" />
              No checklists yet. Create one above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklists.map((list) => {
                const done = list.items.filter((i) => i.done).length;
                return (
                  <Card key={list.id} className="card-elevated">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-sm flex items-center justify-between">
                        <span>{list.name}</span>
                        <div className="flex items-center gap-2">
                          {list.items.length > 0 && <span className="text-[11px] font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{done}/{list.items.length}</span>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteChecklist(list.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {list.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 group/item py-0.5">
                          <button onClick={() => toggleChecklistItem(list.id, item.id)} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${item.done ? "bg-primary border-primary" : "border-muted-foreground/25 hover:border-primary"}`}>
                            {item.done && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </button>
                          <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : "text-card-foreground"}`}>{item.text}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteChecklistItem(list.id, item.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {addingItemTo === list.id ? (
                        <div className="flex gap-1.5 pt-1">
                          <Input autoFocus placeholder="Item..." value={newItemText} onChange={(e) => setNewItemText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddItem(list.id)} className="h-8 text-sm" />
                          <Button size="sm" className="h-8" onClick={() => handleAddItem(list.id)}><Check className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingItemTo(null)}><X className="h-3 w-3" /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground mt-1 h-8" onClick={() => { setAddingItemTo(list.id); setNewItemText(""); }}>
                          <Plus className="h-3 w-3 mr-1" /> Add item
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
