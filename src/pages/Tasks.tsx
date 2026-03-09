import { useState, useMemo } from "react";
import {
  Plus, GripVertical, Pencil, Trash2, X, Check, CalendarIcon,
  Flag, Tag, ChevronDown, ChevronRight, ListChecks, Repeat,
  AlertCircle, Clock, CheckCircle2, Search, Filter,
  LayoutGrid, List, Calendar as CalendarViewIcon, Zap, Archive,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useTasks, type Task } from "@/hooks/useTasks";

const COLUMNS = [
  { id: "backlog" as const, title: "Backlog", icon: Archive, color: "text-muted-foreground", bg: "bg-muted/50 border-border/30" },
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

const QUICK_FILTERS = [
  { value: "all", label: "All" },
  { value: "personal", label: "🏠 Personal" },
  { value: "work", label: "💼 Business" },
  { value: "finance", label: "💰 Finance" },
];

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

type ViewMode = "board" | "list" | "calendar";

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

  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("personal");
  const [newDueDate, setNewDueDate] = useState<Date | undefined>();
  const [newDescription, setNewDescription] = useState("");
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newRecurrencePattern, setNewRecurrencePattern] = useState("daily");

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

  // Weekly velocity stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const completedThisWeek = tasks.filter((t) => {
      if (t.column_id !== "done") return false;
      const created = parseISO(t.created_at);
      return created >= weekStart && created <= weekEnd;
    });
    return completedThisWeek.length;
  }, [tasks]);

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

  // Shared task card renderer
  const renderTaskCard = (task: Task, col?: typeof COLUMNS[number]) => {
    const priority = getPriority(task.priority);
    const category = getCategory(task.category);
    const dueInfo = getDueDateLabel(task.due_date);
    const taskSubtasks = subtasks.filter((s) => s.task_id === task.id);
    const doneCount = taskSubtasks.filter((s) => s.done).length;
    const isExpanded = expandedTask === task.id;
    const isDone = (col?.id || task.column_id) === "done";

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
                  isDone ? "line-through text-muted-foreground" : "text-card-foreground"
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

              {/* Subtask progress bar */}
              {taskSubtasks.length > 0 && (
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <ListChecks className="h-3 w-3" />
                    <span>{doneCount}/{taskSubtasks.length} subtasks</span>
                  </button>
                  <Progress value={(doneCount / taskSubtasks.length) * 100} className="h-1.5" />
                </div>
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
  };

  // Add task form renderer
  const renderAddForm = (columnId: string) => (
    <Card className="border-primary/30 shadow-glow card-elevated">
      <CardContent className="p-3 space-y-3">
        <Input
          autoFocus
          placeholder="What needs to be done?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd(columnId)}
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
          <Checkbox checked={newIsRecurring} onCheckedChange={(v) => setNewIsRecurring(!!v)} id="recurring" />
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
          <Button size="sm" className="h-7 text-xs" onClick={() => handleAdd(columnId)}>
            <Check className="h-3 w-3 mr-1" /> Add
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetAddForm}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Calendar view
  const renderCalendarView = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calStart, end: calEnd });

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>
            ←
          </Button>
          <h3 className="font-semibold font-display text-sm">{format(calendarMonth, "MMMM yyyy")}</h3>
          <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>
            →
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-2 bg-muted/30">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dayTasks = filteredTasks.filter((t) => t.due_date && isSameDay(parseISO(t.due_date), day));
            const isCurrentMonth = isSameMonth(day, calendarMonth);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[80px] p-1.5 bg-card/50",
                  !isCurrentMonth && "opacity-40",
                  isToday(day) && "ring-1 ring-primary/50 bg-primary/5"
                )}
              >
                <span className={cn("text-[10px] font-medium", isToday(day) ? "text-primary" : "text-muted-foreground")}>
                  {format(day, "d")}
                </span>
                <div className="space-y-0.5 mt-0.5">
                  {dayTasks.slice(0, 3).map((t) => {
                    const p = getPriority(t.priority);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setEditingTask({ ...t })}
                        className={cn("w-full text-left text-[9px] px-1 py-0.5 rounded truncate", p.bg)}
                      >
                        {t.title}
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <span className="text-[9px] text-muted-foreground px-1">+{dayTasks.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // List view
  const renderListView = () => {
    const columns = COLUMNS;
    return (
      <div className="space-y-4">
        {columns.map((col) => {
          const ColIcon = col.icon;
          const columnTasks = filteredTasks.filter((t) => t.column_id === col.id);
          if (columnTasks.length === 0) return null;
          return (
            <div key={col.id} className="space-y-1">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <ColIcon className={cn("h-3.5 w-3.5", col.color)} />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</h3>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{columnTasks.length}</Badge>
              </div>
              <div className="rounded-lg border border-border/30 overflow-hidden divide-y divide-border/20">
                {columnTasks.map((task) => {
                  const priority = getPriority(task.priority);
                  const category = getCategory(task.category);
                  const dueInfo = getDueDateLabel(task.due_date);
                  const taskSubs = subtasks.filter((s) => s.task_id === task.id);
                  const doneCount = taskSubs.filter((s) => s.done).length;
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-3 py-2 bg-card/50 hover:bg-card transition-colors group">
                      <Checkbox
                        checked={col.id === "done"}
                        onCheckedChange={() => updateTask(task.id, { column_id: col.id === "done" ? "todo" : "done" })}
                        className="h-4 w-4"
                      />
                      <span className={cn("flex-1 text-sm min-w-0 truncate", col.id === "done" && "line-through text-muted-foreground")}>
                        {task.title}
                      </span>
                      {taskSubs.length > 0 && (
                        <span className="text-[10px] text-muted-foreground shrink-0">{doneCount}/{taskSubs.length}</span>
                      )}
                      <Badge variant="outline" className={cn("text-[9px] h-4 px-1 shrink-0", priority.bg)}>
                        {priority.label}
                      </Badge>
                      <span className="text-[10px] shrink-0">{category.emoji}</span>
                      {dueInfo && (
                        <span className={cn("text-[10px] shrink-0", dueInfo.className)}>{dueInfo.label}</span>
                      )}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTask({ ...task })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-container space-y-5">
      {/* Header with view toggles and weekly stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Organize your daily life with priorities, due dates & categories</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Weekly Velocity */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
            <Zap className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-medium text-muted-foreground">
              <span className="text-foreground font-semibold">{weeklyStats}</span> done this week
            </span>
          </div>
          {/* View Toggles */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} className="bg-muted/30 border border-border/50 rounded-lg p-0.5">
            <ToggleGroupItem value="board" className="h-8 w-8 p-0 data-[state=on]:bg-card data-[state=on]:shadow-sm">
              <LayoutGrid className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="h-8 w-8 p-0 data-[state=on]:bg-card data-[state=on]:shadow-sm">
              <List className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" className="h-8 w-8 p-0 data-[state=on]:bg-card data-[state=on]:shadow-sm">
              <CalendarViewIcon className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Search & Quick Filters */}
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

        {/* Quick project filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.value}
              onClick={() => setFilterCategory(qf.value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                filterCategory === qf.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {qf.label}
            </button>
          ))}
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

      {/* Views */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    onClick={() => { resetAddForm(); setAddingTo(col.id); }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 min-h-[220px] rounded-xl bg-muted/20 p-3 border border-border/30 transition-colors">
                  {addingTo === col.id && renderAddForm(col.id)}
                  {columnTasks.map((task) => renderTaskCard(task, col))}
                  {columnTasks.length === 0 && addingTo !== col.id && (
                    <div className="text-center py-8 text-muted-foreground/50">
                      <p className="text-xs">No tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "list" && renderListView()}
      {viewMode === "calendar" && renderCalendarView()}

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
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
                    <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue /></SelectTrigger>
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
