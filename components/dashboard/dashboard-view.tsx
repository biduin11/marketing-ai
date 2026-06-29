"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  BotMessageSquare,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Loader2,
  Bell,
  Plus,
  BarChart3,
  CheckSquare,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { runDirectorAnalysis } from "@/lib/actions/ai"
import { toggleStrategyTask } from "@/lib/actions/strategy-tasks"
import { createProject } from "@/lib/actions/projects"
import type { DirectorAnalysis } from "@/lib/ai/schemas/directorAnalysis"
import type { MetricSummary, ChannelMetrics } from "@/lib/services/analytics.service"

interface ProjectRow {
  id: string
  name: string
  niche: string | null
  status: string
  updatedAt: string
}

interface TaskRow {
  id: string
  artifactId: string
  taskKey: string
  done: boolean
}

interface ReportRow {
  id: string
  type: string
  createdAt: string
}

interface DashboardViewProps {
  projectId: string | null
  projectName: string | null
  projects: ProjectRow[]
  analysis: DirectorAnalysis | null
  summary: MetricSummary | null
  channels: ChannelMetrics[]
  tasks: TaskRow[]
  reports: ReportRow[]
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  ACTIVE: "Активный",
  PAUSED: "Пауза",
  ARCHIVED: "Архив",
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "text-[#6b7280] bg-neutral-100",
  ACTIVE: "text-[#16a34a] bg-green-50",
  PAUSED: "text-[#d97706] bg-amber-50",
  ARCHIVED: "text-[#6b7280] bg-neutral-100",
}

const REPORT_LABELS: Record<string, string> = {
  REPORT_WEEKLY: "Еженедельный",
  REPORT_MONTHLY: "Ежемесячный",
  REPORT_QUARTERLY: "Квартальный",
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  })
}

function fmtNum(v: number, suffix = ""): string {
  return `${v.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}${suffix}`
}

function RoiBadge({ roi }: { roi: number }) {
  const cls =
    roi > 100
      ? "bg-green-50 text-[#16a34a]"
      : roi > 0
      ? "bg-amber-50 text-[#d97706]"
      : "bg-red-50 text-[#dc2626]"
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
      {roi.toFixed(1)}%
    </span>
  )
}

export function DashboardView({
  projectId,
  projectName,
  projects,
  analysis,
  summary,
  channels,
  tasks,
  reports,
}: DashboardViewProps) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [tasksDone, setTasksDone] = useState<Record<string, boolean>>(
    () => Object.fromEntries(tasks.map((t) => [t.id, t.done]))
  )
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [creating, setCreating] = useState(false)

  async function handleRefreshDirector() {
    if (!projectId) return
    setRefreshing(true)
    try {
      const result = await runDirectorAnalysis(projectId, true)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Анализ обновлён")
      router.refresh()
    } catch {
      toast.error("Ошибка обновления")
    } finally {
      setRefreshing(false)
    }
  }

  async function handleToggle(task: TaskRow) {
    const newDone = !tasksDone[task.id]
    setTasksDone((prev) => ({ ...prev, [task.id]: newDone }))
    const result = await toggleStrategyTask({
      artifactId: task.artifactId,
      taskKey: task.taskKey,
      done: newDone,
    })
    if (!result.success) {
      setTasksDone((prev) => ({ ...prev, [task.id]: !newDone }))
      toast.error(result.error)
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return
    setCreating(true)
    try {
      const result = await createProject({ name: newProjectName.trim() })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setNewProjectOpen(false)
      setNewProjectName("")
      toast.success("Проект создан")
      router.refresh()
    } catch {
      toast.error("Не удалось создать проект")
    } finally {
      setCreating(false)
    }
  }

  const topPriority = analysis?.priorities.sort((a, b) => a.order - b.order)[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          {projectName ?? "Главная"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Bell className="size-3.5" />
          </Button>
          <Button size="sm" onClick={() => setNewProjectOpen(true)}>
            <Plus className="size-3.5" />
            Новый проект
          </Button>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* LEFT col-span-3 */}
        <div className="space-y-5 lg:col-span-3">
          {/* Block 1: AI Director */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BotMessageSquare className="size-4 text-foreground" />
                <span className="text-sm font-semibold text-foreground">AI Директор</span>
              </div>
              <div className="flex items-center gap-2">
                {projectId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-xs"
                    onClick={handleRefreshDirector}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3" />
                    )}
                    Обновить
                  </Button>
                )}
                <Link href="/director">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                    Рекомендации
                    <ChevronRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {!analysis ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Анализ ещё не запущен. Нажмите «Обновить».
              </p>
            ) : (
              <>
                <div className="mt-4 flex gap-5">
                  {[
                    {
                      label: "проблем",
                      count: analysis.problems.length,
                      Icon: AlertCircle,
                      color: "text-[#dc2626]",
                    },
                    {
                      label: "возможностей",
                      count: analysis.opportunities.length,
                      Icon: TrendingUp,
                      color: "text-[#16a34a]",
                    },
                    {
                      label: "рисков",
                      count: analysis.risks.length,
                      Icon: ShieldAlert,
                      color: "text-[#d97706]",
                    },
                  ].map(({ label, count, Icon, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon className={cn("size-3.5", color)} />
                      <span className="text-sm font-semibold text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                {topPriority && (
                  <div className="mt-4 rounded-lg bg-neutral-50 px-3 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground">Приоритет #1</p>
                    <p className="mt-0.5 text-sm text-foreground">{topPriority.action}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Block 2: Projects Table */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3.5">
              <p className="text-sm font-medium text-foreground">Проекты</p>
              <span className="text-xs text-muted-foreground">{projects.length}</span>
            </div>
            {projects.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Нет проектов</p>
            ) : (
              <div className="divide-y divide-[#eaeaea]">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      {p.niche && (
                        <p className="truncate text-xs text-muted-foreground">{p.niche}</p>
                      )}
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_STYLES[p.status] ?? "bg-neutral-100 text-[#6b7280]"
                        )}
                      >
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(p.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block 3: Tasks */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-foreground" />
                <p className="text-sm font-medium text-foreground">Задачи</p>
              </div>
              <Link
                href="/company"
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Стратегия <ChevronRight className="size-3" />
              </Link>
            </div>
            {tasks.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                {projectId ? "Все задачи выполнены" : "Выберите активный проект"}
              </p>
            ) : (
              <div className="divide-y divide-[#eaeaea]">
                {tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-start gap-3 px-5 py-3 hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      checked={tasksDone[task.id] ?? task.done}
                      onChange={() => handleToggle(task)}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[#eaeaea] accent-[#111]"
                    />
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        tasksDone[task.id]
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {task.taskKey}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT col-span-2 */}
        <div className="space-y-5 lg:col-span-2">
          {/* Block 4: Key Metrics */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-foreground" />
                <p className="text-sm font-medium text-foreground">Метрики</p>
              </div>
              <span className="text-xs text-muted-foreground">этот месяц</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "ROI", value: summary ? fmtNum(summary.roi, "%") : "—" },
                { label: "CAC", value: summary ? fmtNum(summary.cac, " ₽") : "—" },
                { label: "LTV", value: summary ? fmtNum(summary.ltv, " ₽") : "—" },
                { label: "ROMI", value: summary ? fmtNum(summary.romi, "%") : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-neutral-50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Block 5: Top Channels */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3.5">
              <p className="text-sm font-medium text-foreground">Топ каналы</p>
              <Link
                href="/analytics"
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Все <ChevronRight className="size-3" />
              </Link>
            </div>
            {channels.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                Нет данных.{" "}
                <Link href="/analytics" className="underline">
                  Добавить →
                </Link>
              </p>
            ) : (
              <div className="divide-y divide-[#eaeaea]">
                {channels.slice(0, 5).map((c, i) => (
                  <div
                    key={c.channel}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{c.channel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {c.spend.toLocaleString("ru-RU")} ₽
                      </span>
                      <RoiBadge roi={c.roi} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block 6: Recent Reports */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-foreground" />
                <p className="text-sm font-medium text-foreground">Отчёты</p>
              </div>
              <Link
                href="/reports"
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Все <ChevronRight className="size-3" />
              </Link>
            </div>
            {reports.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                Нет отчётов.{" "}
                <Link href="/reports" className="underline">
                  Создать →
                </Link>
              </p>
            ) : (
              <div className="divide-y divide-[#eaeaea]">
                {reports.map((r) => (
                  <Link
                    key={r.id}
                    href="/reports"
                    className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {REPORT_LABELS[r.type] ?? r.type}
                    </p>
                    <span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Название проекта"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreateProject()
              }}
              autoFocus
            />
            <Button
              className="w-full"
              onClick={() => void handleCreateProject()}
              disabled={creating || !newProjectName.trim()}
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : "Создать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
