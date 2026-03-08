import { useState } from "react";
import { Plus, GripVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/hooks/useTasks";
import PomodoroTimer from "@/components/PomodoroTimer";

const COLUMNS = [
  { id: "todo" as const, title: "To Do", color: "bg-info/10 text-info border-info/20" },
  { id: "inprogress" as const, title: "In Progress", color: "bg-warning/10 text-warning border-warning/20" },
  { id: "done" as const, title: "Completed", color: "bg-success/10 text-success border-success/20" },
];

export default function Tasks() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleAdd = (columnId: string) => {
    if (!newTitle.trim()) return;
    addTask(newTitle.trim(), columnId);
    setNewTitle("");
    setAddingTo(null);
  };

  const handleUpdate = (id: string) => {
    if (!editTitle.trim()) return;
    updateTask(id, { title: editTitle.trim() });
    setEditingId(null);
  };

  const handleDrop = (columnId: string) => {
    if (!draggedTask) return;
    updateTask(draggedTask, { column_id: columnId });
    setDraggedTask(null);
  };

  return (
    <div className="page-container space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1 page-header">
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Organize your work with a Kanban board</p>
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <PomodoroTimer />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.column_id === col.id);
          return (
            <div
              key={col.id}
              className="space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold font-display text-sm">{col.title}</h2>
                  <Badge variant="secondary" className={`${col.color} text-[10px] border px-1.5`}>
                    {columnTasks.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => { setAddingTo(col.id); setNewTitle(""); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 min-h-[220px] rounded-xl bg-muted/20 p-3 border border-border/30 transition-colors">
                {addingTo === col.id && (
                  <Card className="border-primary/30 shadow-glow card-elevated">
                    <CardContent className="p-3 space-y-2">
                      <Input
                        autoFocus
                        placeholder="Task title..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd(col.id)}
                        className="text-sm h-9"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleAdd(col.id)}>
                          <Check className="h-3 w-3 mr-1" /> Add
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingTo(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTask(task.id)}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 card-elevated"
                  >
                    <CardContent className="p-3 flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                      {editingId === task.id ? (
                        <div className="flex-1 space-y-2">
                          <Input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdate(task.id)}
                            className="text-sm h-8"
                          />
                          <div className="flex gap-1">
                            <Button size="sm" className="h-6 text-xs" onClick={() => handleUpdate(task.id)}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingId(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-start justify-between gap-2">
                          <span className={`text-sm leading-relaxed ${col.id === "done" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                            {task.title}
                          </span>
                          <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingId(task.id); setEditTitle(task.title); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteTask(task.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
