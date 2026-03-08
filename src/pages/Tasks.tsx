import { useState, useMemo } from "react";
import {
  Plus, GripVertical, Pencil, Trash2, X, Check, CalendarIcon,
  Flag, Tag, ChevronDown, ChevronRight, ListChecks, Repeat,
  AlertCircle, Clock, CheckCircle2, Search, Filter,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTasks, type Task } from "@/hooks/useTasks";
import PomodoroTimer from "@/components/PomodoroTimer";

const COLUMNS = [
  { id: "todo" as const, title: "To Do", icon: Clock, color: "text-info", bg: "bg-info/10 border-info/20" },
  { id: "inprogress" as const, title: "In Progress", icon: AlertCircle, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  { id: "done" as const, title: "Completed", icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/20" },
];

const PRIORITIES = [
  { value: "high", label: "High", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  { value: "medium", label: "Medium", color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  { value: "low", label: "Low", color: "text-muted-foreground", bg: "bg-muted border-border" },
];

const CATEGORIES = [
  { value: "personal", label: "Personal", emoji: "🏠" },
  { value: "work", label: "Work", emoji: "💼" },
  { value: "errands", label: "Errands", emoji: "🛒" },
  { value: "health", label: "Health", emoji: "💪" },
  { value: "finance", label: "Finance", emoji: "💰" },
  { value: "learning", label: "Learning", emoji: "📚" },
  { value: "social", label: "Social", emoji: "👥" },
];

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function getDueDateLabel(dateStr: string | null) {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (isToday(date)) return { label: "Today", className: "text-warning" };
  if (isTomorrow(date)) return { label: "Tomorrow", className: "text-info" };
  if (isPast(date)) return { label: "Overdue", className: "text-destructive" };
  return { label: format(date, "MMM d"), className: "text-muted-foreground" };
}

export default function Tasks() {
  const { tasks, subtasks, addTask, updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask } = useTasks();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Add task state
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("personal");
  const [newDueDate, setNewDueDate] = useState<Date | undefined>();
  const [newDescription, setNewDescription] = useState("");
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newRecurrencePattern, setNewRecurrencePattern] = useState("daily");

  // Edit/expand state
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterCategory]);

  const hasFilters = searchQuery || filterPriority !== "all" || filterCategory !== "all";

  const resetAddForm = () => {
    setNewTitle("");
    setNewPriority("medium");
    setNewCategory("personal");
    setNewDueDate(undefined);
    setNewDescription("");
    setNewIsRecurring(false);
    setNewRecurrencePattern("daily");
    setAddingTo(null);
  };

  const handleAdd = (columnId: string) => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      column_id: columnId,
      priority: newPriority,
      category: newCategory,
      due_date: newDueDate ? format(newDueDate, "yyyy-MM-dd") : null,
      description: newDescription.trim() || null,
      is_recurring: newIsRecurring,
      recurrence_pattern: newIsRecurring ? newRecurrencePattern : null,
    });
    resetAddForm();
  };

  const handleEditSave = () => {
    if (!editingTask) return;
    updateTask(editingTask.id, {
      title: editingTask.title,
      priority: editingTask.priority,
      category: editingTask.category,
      due_date: editingTask.due_date,
      description: editingTask.description,
      is_recurring: editingTask.is_recurring,
      recurrence_pattern: editingTask.recurrence_pattern,
    });
    setEditingTask(null);
  };

  const handleDrop = (columnId: string) => {
    if (!draggedTask) return;
    updateTask(draggedTask, { column_id: columnId });
    setDraggedTask(null);
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;
    addSubtask(taskId, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  const getPriority = (value: string) => PRIORITIES.find((p) => p.value === value) || PRIORITIES[1];
  const getCategory = (value: string) => CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1 page-header">
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Organize your daily life with priorities, due dates & categories</p>
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <PomodoroTimer />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasFilters && (
              <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                !
              </Badge>
            )}
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setFilterPriority("all"); setFilterCategory("all"); }}>
              Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Flag className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <Tag className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const ColIcon = col.icon;
          const columnTasks = filteredTasks.filter((t) => t.column_id === col.id);
          return (
            <div
              key={col.id}
              className="space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ColIcon className={cn("h-4 w-4", col.color)} />
                  <h2 className="font-semibold font-display text-sm">{col.title}</h2>
                  <Badge variant="secondary" className={cn("text-[10px] border px-1.5", col.bg)}>
                    {columnTasks.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => { setAddingTo(col.id); resetAddForm(); setAddingTo(col.id); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 min-h-[220px] rounded-xl bg-muted/20 p-3 border border-border/30 transition-colors">
                {/* Add Task Form */}
                {addingTo === col.id && (
                  <Card className="border-primary/30 shadow-glow card-elevated">
                    <CardContent className="p-3 space-y-3">
                      <Input
                        autoFocus
                        placeholder="What needs to be done?"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd(col.id)}
                        className="text-sm h-9"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={newPriority} onValueChange={setNewPriority}>
                          <SelectTrigger className="h-8 text-xs">
                            <Flag className="h-3 w-3 mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                <span className={p.color}>{p.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={newCategory} onValueChange={setNewCategory}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full h-8 text-xs justify-start", !newDueDate && "text-muted-foreground")}>
                            <CalendarIcon className="h-3 w-3 mr-1.5" />
                            {newDueDate ? format(newDueDate, "MMM d, yyyy") : "Set due date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={newDueDate} onSelect={setNewDueDate} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <Textarea
                        placeholder="Description (optional)"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="text-xs min-h-[60px] resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={newIsRecurring}
                          onCheckedChange={(v) => setNewIsRecurring(!!v)}
                          id="recurring"
                        />
                        <label htmlFor="recurring" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                          <Repeat className="h-3 w-3" /> Recurring
                        </label>
                        {newIsRecurring && (
                          <Select value={newRecurrencePattern} onValueChange={setNewRecurrencePattern}>
                            <SelectTrigger className="h-7 text-[11px] w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RECURRENCE_OPTIONS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleAdd(col.id)}>
                          <Check className="h-3 w-3 mr-1" /> Add
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetAddForm}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Task Cards */}
                {columnTasks.map((task) => {
                  const priority = getPriority(task.priority);
                  const category = getCategory(task.category);
                  const dueInfo = getDueDateLabel(task.due_date);
                  const taskSubtasks = subtasks.filter((s) => s.task_id === task.id);
                  const doneCount = taskSubtasks.filter((s) => s.done).length;
                  const isExpanded = expandedTask === task.id;

                  return (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTask(task.id)}
                      className={cn(
                        "cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 card-elevated group",
                        task.priority === "high" && "border-l-2 border-l-destructive"
                      )}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <span className={cn(
                                "text-sm leading-relaxed break-words",
                                col.id === "done" ? "line-through text-muted-foreground" : "text-card-foreground"
                              )}>
                                {task.title}
                              </span>
                              <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTask({ ...task })}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteTask(task.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Metadata row */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 gap-0.5", priority.bg)}>
                                <Flag className="h-2.5 w-2.5" /> {priority.label}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {category.emoji} {category.label}
                              </Badge>
                              {dueInfo && (
                                <span className={cn("text-[10px] flex items-center gap-0.5", dueInfo.className)}>
                                  <CalendarIcon className="h-2.5 w-2.5" /> {dueInfo.label}
                                </span>
                              )}
                              {task.is_recurring && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Repeat className="h-2.5 w-2.5" /> {task.recurrence_pattern}
                                </span>
                              )}
                            </div>

                            {/* Subtask progress & expand */}
                            {(taskSubtasks.length > 0 || isExpanded) && (
                              <button
                                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
                              >
                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <ListChecks className="h-3 w-3" />
                                {taskSubtasks.length > 0 ? `${doneCount}/${taskSubtasks.length} subtasks` : "Subtasks"}
                              </button>
                            )}

                            {taskSubtasks.length === 0 && !isExpanded && (
                              <button
                                onClick={() => setExpandedTask(task.id)}
                                className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                              >
                                <Plus className="h-3 w-3" /> Add subtasks
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded subtasks */}
                        {isExpanded && (
                          <div className="pl-6 space-y-1.5 pt-1 border-t border-border/30">
                            {taskSubtasks.map((st) => (
                              <div key={st.id} className="flex items-center gap-2 group/sub">
                                <Checkbox
                                  checked={st.done}
                                  onCheckedChange={(v) => toggleSubtask(st.id, !!v)}
                                  className="h-3.5 w-3.5"
                                />
                                <span className={cn("text-xs flex-1", st.done && "line-through text-muted-foreground")}>
                                  {st.title}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-0 group-hover/sub:opacity-100"
                                  onClick={() => deleteSubtask(st.id)}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex gap-1">
                              <Input
                                placeholder="Add subtask..."
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask(task.id)}
                                className="h-7 text-xs"
                              />
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleAddSubtask(task.id)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {columnTasks.length === 0 && !addingTo && (
                  <div className="text-center py-8 text-muted-foreground/50">
                    <p className="text-xs">No tasks here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <Input
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="text-sm"
                placeholder="Task title"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <Select value={editingTask.priority} onValueChange={(v) => setEditingTask({ ...editingTask, priority: v })}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Select value={editingTask.category} onValueChange={(v) => setEditingTask({ ...editingTask, category: v })}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full h-9 text-sm justify-start", !editingTask.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {editingTask.due_date ? format(parseISO(editingTask.due_date), "MMM d, yyyy") : "No due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editingTask.due_date ? parseISO(editingTask.due_date) : undefined}
                      onSelect={(d) => setEditingTask({ ...editingTask, due_date: d ? format(d, "yyyy-MM-dd") : null })}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value || null })}
                  placeholder="Add notes or details..."
                  className="text-sm min-h-[80px] resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={editingTask.is_recurring}
                  onCheckedChange={(v) => setEditingTask({ ...editingTask, is_recurring: !!v })}
                  id="edit-recurring"
                />
                <label htmlFor="edit-recurring" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1">
                  <Repeat className="h-3.5 w-3.5" /> Recurring task
                </label>
                {editingTask.is_recurring && (
                  <Select
                    value={editingTask.recurrence_pattern || "daily"}
                    onValueChange={(v) => setEditingTask({ ...editingTask, recurrence_pattern: v })}
                  >
                    <SelectTrigger className="h-8 text-xs w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                <Button onClick={handleEditSave}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
