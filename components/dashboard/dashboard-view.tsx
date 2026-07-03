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
  Sunrise,
  TrendingDown,
  Camera,
  Send,
  PlayCircle,
  Mail,
  Hash,
  Target,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
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
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"
import { OnboardingProgress } from "@/components/dashboard/onboarding-progress"
import type { OnboardingStep } from "@/components/dashboard/onboarding-progress"

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

interface KpiRow {
  name: string
  target: string
}

type ContentItem = ContentPlan["calendar"][number]

interface DashboardViewProps {
  projectId: string | null
  projectName: string | null
  projects: ProjectRow[]
  analysis: DirectorAnalysis | null
  summary: MetricSummary | null
  prevSummary: MetricSummary | null
  channels: ChannelMetrics[]
  tasks: TaskRow[]
  reports: ReportRow[]
  strategyKpis: KpiRow[]
  todayContent: ContentItem[]
  hasContentPlan: boolean
  contentPlanUpdatedAt: string | null
  onboardingSteps?: OnboardingStep[]
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

const CONTENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  reels: PlayCircle,
  post: Hash,
  stories: Camera,
  email: Mail,
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  reels: "Reels",
  post: "Пост",
  stories: "Сторис",
  email: "Email",
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  vk: "VK",
  youtube: "YouTube",
  blog: "Блог",
  email: "Email",
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

function todayRu(): string {
  return new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) {
    return (
      <span className="ml-1 inline-flex items-center rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-muted-foreground">
        нет базы
      </span>
    )
  }
  const delta = ((current - prev) / Math.abs(prev)) * 100
  const up = delta >= 0
  const big = Math.abs(delta) >= 20
  return (
    <span
      className={cn(
        "ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
        up ? "bg-green-50 text-[#16a34a]" : big ? "bg-red-50 text-[#dc2626]" : "bg-amber-50 text-[#d97706]"
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {Math.abs(delta).toFixed(0)}%
    </span>
  )
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

function detectAnomalies(
  summary: MetricSummary,
  prevSummary: MetricSummary
): Array<{ label: string; delta: number; bad: boolean }> {
  const anomalies: Array<{ label: string; delta: number; bad: boolean }> = []
  const threshold = 10

  const revDelta = prevSummary.totalRevenue > 0
    ? ((summary.totalRevenue - prevSummary.totalRevenue) / prevSummary.totalRevenue) * 100
    : 0
  if (Math.abs(revDelta) >= threshold) {
    anomalies.push({ label: "Выручка", delta: revDelta, bad: revDelta < 0 })
  }

  const leadsDelta = prevSummary.totalLeads > 0
    ? ((summary.totalLeads - prevSummary.totalLeads) / prevSummary.totalLeads) * 100
    : 0
  if (Math.abs(leadsDelta) >= threshold) {
    anomalies.push({ label: "Лиды", delta: leadsDelta, bad: leadsDelta < 0 })
  }

  const roiDelta = prevSummary.roi > 0
    ? ((summary.roi - prevSummary.roi) / prevSummary.roi) * 100
    : 0
  if (Math.abs(roiDelta) >= threshold) {
    anomalies.push({ label: "ROI", delta: roiDelta, bad: roiDelta < 0 })
  }

  return anomalies
}

export function DashboardView({
  projectId,
  projectName,
  projects,
  analysis,
  summary,
  prevSummary,
  channels,
  tasks,
  reports,
  strategyKpis,
  todayContent,
  hasContentPlan,
  contentPlanUpdatedAt,
  onboardingSteps,
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
  const anomalies =
    summary && prevSummary ? detectAnomalies(summary, prevSummary) : []
  const badAnomalies = anomalies.filter((a) => a.bad)

  if (!projectId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Главная</h1>
          <Button size="sm" onClick={() => setNewProjectOpen(true)}>
            <Plus className="size-3.5" />
            Новый проект
          </Button>
        </div>
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-10 shadow-sm text-center">
          <BotMessageSquare className="mx-auto mb-4 size-10 text-muted-foreground opacity-40" />
          <p className="text-base font-semibold text-foreground mb-1">Выберите активный проект</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Переключитесь на один из ваших проектов через меню слева, чтобы видеть аналитику, задачи и рекомендации AI.
          </p>
          {projects.length > 0 && (
            <div className="divide-y divide-[#eaeaea] rounded-xl border border-[#eaeaea] text-left max-w-xs mx-auto">
              {projects.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    {p.niche && <p className="truncate text-xs text-muted-foreground">{p.niche}</p>}
                  </div>
                  <span className={cn("ml-3 rounded-full px-2 py-0.5 text-xs font-medium shrink-0", STATUS_STYLES[p.status] ?? "bg-neutral-100 text-[#6b7280]")}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreateProject() }}
                autoFocus
              />
              <Button className="w-full" onClick={() => void handleCreateProject()} disabled={creating || !newProjectName.trim()}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : "Создать"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-foreground">
          {projectName ?? "Главная"}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/inbox"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8")}
          >
            <Bell className="size-3.5" />
          </Link>
          <Button size="sm" onClick={() => setNewProjectOpen(true)}>
            <Plus className="size-3.5" />
            Новый проект
          </Button>
        </div>
      </div>

      {/* Onboarding Progress */}
      {onboardingSteps && onboardingSteps.some((s) => !s.done) && (
        <OnboardingProgress steps={onboardingSteps} />
      )}

      {/* Morning Brief */}
      {projectId && (
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sunrise className="size-4 text-[#d97706]" />
            <span className="text-sm font-semibold text-foreground">Morning Brief</span>
            <span className="ml-auto text-xs text-muted-foreground capitalize">{todayRu()}</span>
            {contentPlanUpdatedAt && (
              <span className="text-xs text-muted-foreground border-l border-[#eaeaea] pl-2">
                план от {fmtDate(contentPlanUpdatedAt)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Today's content */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Опубликовать сегодня</p>
              {todayContent.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {!hasContentPlan
                    ? "Контент-план не создан"
                    : "Сегодня публикаций нет"}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {todayContent.map((item, i) => {
                    const Icon = CONTENT_TYPE_ICONS[item.type] ?? Hash
                    const platform = (item as { platform?: string }).platform
                    return (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-neutral-50 px-2.5 py-2">
                        <Icon className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground line-clamp-1">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {CONTENT_TYPE_LABELS[item.type] ?? item.type}
                            {platform && ` · ${PLATFORM_LABELS[platform] ?? platform}`}
                            {(item as { time?: string }).time && ` · ${(item as { time?: string }).time}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Next priority from Director */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Приоритет #1</p>
              {topPriority ? (
                <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
                  <p className="text-xs text-foreground leading-relaxed">{topPriority.action}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {analysis ? "Нет приоритетов" : "Запустите AI Директора"}
                </p>
              )}
            </div>

            {/* Anomalies */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Изменения vs прошлый месяц</p>
              {anomalies.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {summary ? "Значительных изменений нет" : "Нет данных за этот месяц"}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {anomalies.map((a) => (
                    <div key={a.label} className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5",
                      a.bad ? "bg-red-50" : "bg-green-50"
                    )}>
                      <span className="text-xs text-foreground">{a.label}</span>
                      <span className={cn(
                        "text-xs font-semibold",
                        a.bad ? "text-[#dc2626]" : "text-[#16a34a]"
                      )}>
                        {a.delta > 0 ? "+" : ""}{a.delta.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    Подробнее
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
                      <span className="font-heading text-sm font-semibold tabular-nums text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                {badAnomalies.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-[#dc2626]" />
                    <p className="text-xs text-[#dc2626]">
                      Внимание: {badAnomalies.map((a) => `${a.label} упал${a.label === "ROI" ? "" : "и"} на ${Math.abs(a.delta).toFixed(0)}%`).join(", ")} по сравнению с прошлым месяцем
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Block 2: Plan vs Fact */}
          {strategyKpis.length > 0 && (
            <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-foreground" />
                  <p className="text-sm font-medium text-foreground">План / Факт</p>
                </div>
                <Link
                  href="/strategy"
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Стратегия <ChevronRight className="size-3" />
                </Link>
              </div>
              <div className="divide-y divide-[#eaeaea]">
                {strategyKpis.map((kpi) => {
                  const factValue = getFactForKpi(kpi.name, summary)
                  return (
                    <div key={kpi.name} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-foreground">{kpi.name}</span>
                      <div className="flex items-center gap-3">
                        {factValue !== null && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Факт</p>
                            <p className="text-sm font-semibold text-foreground">{factValue}</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">План</p>
                          <p className="text-sm font-medium text-muted-foreground">{kpi.target}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Block 3: Tasks */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-foreground" />
                <p className="text-sm font-medium text-foreground">Задачи</p>
              </div>
              <Link
                href="/strategy"
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
              <Link href="/analytics" className="text-xs text-muted-foreground hover:text-foreground">
                этот месяц
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "ROI",
                  value: summary ? fmtNum(summary.roi, "%") : "—",
                  prev: prevSummary?.roi ?? null,
                  curr: summary?.roi ?? null,
                },
                {
                  label: "CAC",
                  value: summary ? fmtNum(summary.cac, " ₽") : "—",
                  prev: prevSummary?.cac ?? null,
                  curr: summary?.cac ?? null,
                },
                {
                  label: "Выручка",
                  value: summary ? fmtNum(summary.totalRevenue, " ₽") : "—",
                  prev: prevSummary?.totalRevenue ?? null,
                  curr: summary?.totalRevenue ?? null,
                },
                {
                  label: "Лиды",
                  value: summary ? fmtNum(summary.totalLeads) : "—",
                  prev: prevSummary?.totalLeads ?? null,
                  curr: summary?.totalLeads ?? null,
                },
              ].map(({ label, value, prev, curr }) => (
                <div key={label} className="rounded-xl bg-neutral-50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="mt-0.5 flex items-center">
                    <p className="font-heading text-lg font-semibold tabular-nums text-foreground">{value}</p>
                    {curr !== null && prev !== null && (
                      <DeltaBadge current={curr} prev={prev} />
                    )}
                  </div>
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
                  <Link
                    key={c.channel}
                    href={`/analytics?channel=${encodeURIComponent(c.channel)}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors"
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
                  </Link>
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

          {/* Block 7: Quick Actions */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
            <div className="border-b border-[#eaeaea] px-5 py-3.5">
              <p className="text-sm font-medium text-foreground">Быстрые действия</p>
            </div>
            <div className="divide-y divide-[#eaeaea]">
              {[
                { label: "Добавить метрики", href: "/analytics", icon: BarChart3, desc: "Данные по каналам" },
                { label: "Создать отчёт", href: "/reports", icon: FileText, desc: "Weekly / Monthly" },
                { label: "Запустить AI Директора", href: "/director", icon: BotMessageSquare, desc: "Анализ + приоритеты" },
                { label: "Контент на сегодня", href: "/content", icon: Send, desc: "Готовые тексты" },
              ].map(({ label, href, icon: Icon, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <Icon className="size-3.5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ChevronRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
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


function getFactForKpi(kpiName: string, summary: MetricSummary | null): string | null {
  if (!summary) return null
  const name = kpiName.toLowerCase()
  if (name.includes("выруч") || name.includes("revenue")) {
    return summary.totalRevenue.toLocaleString("ru-RU") + " ₽"
  }
  if (name.includes("лид") || name.includes("lead")) {
    return summary.totalLeads.toLocaleString("ru-RU")
  }
  if (name.includes("roi")) {
    return summary.roi.toFixed(1) + "%"
  }
  if (name.includes("cac") || name.includes("стоим") || name.includes("клиент")) {
    return summary.cac.toLocaleString("ru-RU") + " ₽"
  }
  if (name.includes("конверс")) {
    return summary.totalLeads > 0 && summary.totalClicks > 0
      ? ((summary.totalLeads / summary.totalClicks) * 100).toFixed(1) + "%"
      : null
  }
  return null
}
