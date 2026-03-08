import { useState } from "react";
import { Plus, GripVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/hooks/useTasks";

const COLUMNS = [
  { id: "todo" as const, title: "To Do", color: "bg-info/10 text-info" },
  { id: "inprogress" as const, title: "In Progress", color: "bg-warning/10 text-warning" },
  { id: "done" as const, title: "Completed", color: "bg-success/10 text-success" },
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">Organize your work with a Kanban board</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.column_id === col.id);
          return (
            <div
              key={col.id}
              className="space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold font-display text-sm">{col.title}</h2>
                  <Badge variant="secondary" className={`${col.color} text-xs`}>
                    {columnTasks.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setAddingTo(col.id); setNewTitle(""); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 min-h-[200px] rounded-xl bg-muted/30 p-3 border border-border/30 transition-colors">
                {addingTo === col.id && (
                  <Card className="border-primary/30 shadow-glow">
                    <CardContent className="p-3 space-y-2">
                      <Input
                        autoFocus
                        placeholder="Task title..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd(col.id)}
                        className="text-sm"
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
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-border/50"
                  >
                    <CardContent className="p-3 flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                      {editingId === task.id ? (
                        <div className="flex-1 space-y-2">
                          <Input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdate(task.id)}
                            className="text-sm"
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
                          <span className={`text-sm ${col.id === "done" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                            {task.title}
                          </span>
                          <div className="flex gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => { setEditingId(task.id); setEditTitle(task.title); }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => deleteTask(task.id)}
                            >
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
