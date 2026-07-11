"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Calendar, Check, Clock, Loader2, Plus, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/empty-state"
import {
  generateSprint,
  toggleSprintTask,
  addSprintTask,
  deleteSprintTask,
  type SprintItem,
  type SprintTaskItem,
} from "@/lib/actions/sprint"
import { cn } from "@/lib/utils"

interface SprintViewProps {
  projectId: string
  initialSprint: SprintItem | null
}

const CATEGORIES = ["контент", "реклама", "аналитика", "работа с клиентами", "репутация", "стратегия"]

const PRIORITY_META = {
  HIGH: { label: "🔴 Высокий приоритет", dot: "bg-danger" },
  MEDIUM: { label: "🟡 Средний приоритет", dot: "bg-warning" },
  LOW: { label: "⚪ Низкий приоритет", dot: "bg-muted-foreground" },
} as const

const CATEGORY_CLASSES: Record<string, string> = {
  "контент": "bg-blue-50 text-blue-700 border-blue-200",
  "реклама": "bg-amber-50 text-amber-700 border-amber-200",
  "аналитика": "bg-purple-50 text-purple-700 border-purple-200",
}

const RU_DATE = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" })
const RU_DATE_FULL = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" })

export function SprintView({ projectId, initialSprint }: SprintViewProps) {
  const [sprint, setSprint] = useState<SprintItem | null>(initialSprint)
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<SprintTaskItem["priority"]>("MEDIUM")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [estimatedHours, setEstimatedHours] = useState("")
  const [dueDay, setDueDay] = useState("")

  const tasks = sprint?.tasks ?? []
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  async function runGenerate() {
    setLoading(true)
    const result = await generateSprint(projectId)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setSprint(result.data)
    toast.success("План недели готов")
  }

  function toggleTask(task: SprintTaskItem) {
    setSprint((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === task.id ? { ...t, completed: !t.completed } : t
            ),
          }
        : prev
    )
    startTransition(async () => {
      const result = await toggleSprintTask(task.id)
      if (!result.success) {
        toast.error(result.error)
        setSprint((prev) =>
          prev
            ? {
                ...prev,
                tasks: prev.tasks.map((t) =>
                  t.id === task.id ? { ...t, completed: task.completed } : t
                ),
              }
            : prev
        )
        return
      }
      if (!task.completed) toast.success("Задача выполнена")
    })
  }

  function deleteTask(task: SprintTaskItem) {
    setSprint((prev) =>
      prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== task.id) } : prev
    )
    startTransition(async () => {
      const result = await deleteSprintTask(task.id)
      if (!result.success) toast.error(result.error)
    })
  }

  function openAdd() {
    setTitle("")
    setDescription("")
    setPriority("MEDIUM")
    setCategory(CATEGORIES[0])
    setEstimatedHours("")
    setDueDay("")
    setAddOpen(true)
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sprint || !title.trim()) return

    startTransition(async () => {
      const result = await addSprintTask({
        sprintId: sprint.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        dueDay: dueDay.trim() || undefined,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setSprint((prev) => (prev ? { ...prev, tasks: [...prev.tasks, result.data] } : prev))
      setAddOpen(false)
      toast.success("Задача добавлена")
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground">Спринт на неделю</h1>
          {sprint && (
            <p className="text-sm text-muted-foreground">
              {RU_DATE.format(new Date(sprint.weekStart))} — {RU_DATE_FULL.format(new Date(sprint.weekEnd))}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Выполнено</p>
              <p className="text-sm font-semibold text-foreground">
                {completedCount} / {totalCount}
              </p>
            </div>
          )}
          <Button onClick={runGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Планирую...
              </>
            ) : (
              <>
                <Zap className="size-3.5" /> {sprint ? "Обновить план" : "Сгенерировать план"}
              </>
            )}
          </Button>
        </div>
      </div>

      {sprint ? (
        <>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Прогресс недели</span>
              <span className="text-xs font-medium text-foreground">{progressPct}%</span>
            </div>
            <Progress value={progressPct} />
            {sprint.aiSummary && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                ✨ {sprint.aiSummary}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => {
              const group = tasks.filter((t) => t.priority === p)
              if (group.length === 0) return null
              const meta = PRIORITY_META[p]
              return (
                <div key={p}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className={cn("size-2 rounded-full", meta.dot)} />
                    <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
                    <span className="text-xs text-muted-foreground">{group.length} задач</span>
                  </div>
                  <div className="space-y-2">
                    {group.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "rounded-2xl border border-border bg-card p-4 transition-all",
                          task.completed ? "opacity-60" : "hover:border-foreground/20"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTask(task)}
                            className={cn(
                              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                              task.completed
                                ? "border-foreground bg-foreground"
                                : "border-border hover:border-foreground"
                            )}
                          >
                            {task.completed && <Check className="size-3 text-background" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium leading-snug",
                                task.completed ? "text-muted-foreground line-through" : "text-foreground"
                              )}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              {task.dueDay && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="size-3" />
                                  {task.dueDay}
                                </span>
                              )}
                              {task.estimatedHours != null && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="size-3" />
                                  {task.estimatedHours}ч
                                </span>
                              )}
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-xs",
                                  CATEGORY_CLASSES[task.category] ??
                                    "border-border bg-muted text-muted-foreground"
                                )}
                              >
                                {task.category}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteTask(task)}
                            disabled={isPending}
                            className="shrink-0 p-1 text-muted-foreground hover:text-danger"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" /> Добавить задачу вручную
          </button>
        </>
      ) : (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={Zap}
            title="Спринт ещё не составлен"
            description="Нажмите «Сгенерировать план» — AI составит список задач на эту неделю на основе вашей стратегии и метрик."
            action={
              <Button onClick={runGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Планирую...
                  </>
                ) : (
                  <>
                    <Zap className="size-3.5" /> Сгенерировать план недели
                  </>
                )}
              </Button>
            }
          />
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Новая задача</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Название</Label>
                <Textarea
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Опубликовать пост в Instagram"
                  rows={2}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Описание</Label>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Приоритет</Label>
                  <Select value={priority} onValueChange={(v) => v && setPriority(v as SprintTaskItem["priority"])}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">Высокий</SelectItem>
                      <SelectItem value="MEDIUM">Средний</SelectItem>
                      <SelectItem value="LOW">Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="task-hours">Часы</Label>
                  <Input
                    id="task-hours"
                    type="number"
                    min={0}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-day">День недели</Label>
                  <Input
                    id="task-day"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="Понедельник"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending || !title.trim()}>
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                Добавить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
