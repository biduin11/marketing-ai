"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  RefreshCw,
  Loader2,
  LayoutList,
  Hash,
  Video,
  Plus,
  BarChart2,
  Eye,
  Clock,
  CheckCircle2,
  Upload,
  FolderOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/empty-state"
import { ContentCalendar } from "@/components/content/content-calendar"
import { PlatformsTab } from "@/components/content/platforms-tab"
import { runContentPlan } from "@/lib/actions/ai"
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"
import type { ContentPlatformItem } from "@/lib/actions/content-platforms"

interface ContentViewProps {
  projectId: string
  plan: ContentPlan | null
  version: number | null
  platforms: ContentPlatformItem[]
}

type Tab = "calendar" | "ideas" | "rubrics" | "platforms" | "files"

const tabs: { id: Tab; label: string }[] = [
  { id: "calendar", label: "Календарь" },
  { id: "ideas", label: "Идеи контента" },
  { id: "rubrics", label: "Рубрики" },
  { id: "platforms", label: "Площадки" },
  { id: "files", label: "Файлы" },
]

// --- Metrics helpers ---

function computeMetrics(plan: ContentPlan) {
  const cal = plan.calendar
  const total = cal.length

  // Estimated reach per type
  const reach = cal.reduce((sum, item) => {
    switch (item.type) {
      case "reels":
        return sum + 8000
      case "post":
        return sum + 3000
      case "stories":
        return sum + 1500
      case "email":
        return sum + 1000
      default:
        return sum + 2000
    }
  }, 0)

  // ER — based on educational share (higher = better)
  const eduCount = cal.filter((i) => i.category === "educational").length
  const er = total > 0 ? ((eduCount / total) * 4 + 4).toFixed(1) : "—"

  // Status counts
  const review = cal.filter(
    (i) => (i as { status?: string }).status === "review"
  ).length
  const ready = cal.filter(
    (i) => (i as { status?: string }).status === "ready"
  ).length
  const published = cal.filter(
    (i) => (i as { status?: string }).status === "published"
  ).length

  return { total, reach, er, review, ready, published }
}

export function ContentView({ projectId, plan, version, platforms }: ContentViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("calendar")

  async function generate(force: boolean) {
    setLoading(true)
    try {
      const result = await runContentPlan(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "Контент-план обновлён" : "Контент-план готов")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать контент-план")
    } finally {
      setLoading(false)
    }
  }

  const metrics = plan ? computeMetrics(plan) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Контент-план
          </h2>
          <p className="text-sm text-muted-foreground">
            Публикационный календарь, идеи и сценарии
            {version && (
              <span className="ml-2 text-xs">· версия {version}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {plan && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generate(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Регенерировать
            </Button>
          )}
          {!plan && (
            <Button size="sm" onClick={() => generate(false)} disabled={loading}>
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Создать контент-план
            </Button>
          )}
        </div>
      </div>

      {!plan ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={LayoutList}
            title="Контент-план не создан"
            description="Нажмите «Создать контент-план» — AI составит публикационный календарь по платформам, идеи Reels, сценарии и email-цепочку."
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Metrics row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              label="Всего публикаций"
              value={metrics!.total}
              sub="на месяц"
              icon={LayoutList}
            />
            <MetricCard
              label="Прогн. охват"
              value={`${(metrics!.reach / 1000).toFixed(0)} тыс.`}
              sub="чел."
              icon={Eye}
            />
            <MetricCard
              label="Вовлечённость"
              value={`${metrics!.er}%`}
              sub="средний ER"
              icon={BarChart2}
            />
            <MetricCard
              label="На согласовании"
              value={metrics!.review}
              sub="материалов"
              icon={Clock}
            />
            <MetricCard
              label="Подготовлено"
              value={metrics!.ready}
              sub="материалов"
              icon={CheckCircle2}
            />
            <MetricCard
              label="Опубликовано"
              value={metrics!.published}
              sub="материалов"
              icon={Upload}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-5 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={
                  activeTab === t.id
                    ? "border-b-2 border-foreground pb-2 text-sm font-medium text-foreground"
                    : "pb-2 text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Calendar tab */}
          {activeTab === "calendar" && (
            <ContentCalendar items={plan.calendar} projectId={projectId} />
          )}

          {/* Ideas tab */}
          {activeTab === "ideas" && (
            <div className="space-y-6">
              <IdeaSection
                title="Reels"
                count={plan.ideas.reels.length}
                icon={Video}
                color="violet"
              >
                {plan.ideas.reels.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Hook:</span>{" "}
                      {item.hook}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium">Угол:</span> {item.angle}
                    </p>
                  </div>
                ))}
              </IdeaSection>

              <IdeaSection
                title="Посты"
                count={plan.ideas.posts.length}
                icon={Hash}
                color="blue"
              >
                {plan.ideas.posts.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Формат:</span>{" "}
                      {item.format}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium">Угол:</span> {item.angle}
                    </p>
                  </div>
                ))}
              </IdeaSection>

              <IdeaSection
                title="Stories"
                count={plan.ideas.stories.length}
                icon={LayoutList}
                color="orange"
              >
                {plan.ideas.stories.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-warning">
                        Формат:
                      </span>{" "}
                      {item.format}
                    </p>
                  </div>
                ))}
              </IdeaSection>
            </div>
          )}

          {/* Reels scripts — accessible via Идеи → scroll, but keep as legacy sub-section */}
          {activeTab === "ideas" && plan.reelsScripts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">
                Готовые сценарии Reels
              </h3>
              {plan.reelsScripts.map((script, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {script.title}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <ScriptBlock
                      label="Hook (первые 3 сек)"
                      color="violet"
                      text={script.hook}
                    />
                    <ScriptBlock
                      label="Основной контент"
                      color="blue"
                      text={script.body}
                    />
                    <ScriptBlock label="CTA" color="green" text={script.cta} />
                  </div>
                  {script.hashtags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {script.hashtags.map((tag, j) => (
                        <span
                          key={j}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Rubrics tab */}
          {activeTab === "rubrics" && (
            <RubricsTab plan={plan} />
          )}

          {/* Platforms tab */}
          {activeTab === "platforms" && (
            <PlatformsTab
              projectId={projectId}
              initialPlatforms={platforms}
              plan={plan}
            />
          )}

          {/* Files tab */}
          {activeTab === "files" && (
            <div className="flex h-[40vh] items-center justify-center">
              <EmptyState
                icon={FolderOpen}
                title="Файлы контента"
                description="Здесь будут храниться готовые материалы: тексты, изображения, видео для публикаций."
              />
            </div>
          )}

          {/* Email sequence — shown in Calendar tab as side section */}
          {activeTab === "calendar" && plan.emailSequence.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Email-цепочка
              </h3>
              <div className="relative space-y-0 pl-6">
                <div className="absolute left-2 top-0 h-full w-px bg-border" />
                {plan.emailSequence.map((email, i) => (
                  <div key={i} className="relative pb-4 last:pb-0">
                    <span className="absolute -left-4 flex size-4 items-center justify-center rounded-full border-2 border-card bg-foreground text-[9px] font-bold text-background">
                      {email.number}
                    </span>
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {email.subject}
                        </p>
                        <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs text-success">
                          {email.sendDay}
                        </span>
                      </div>
                      <p className="mb-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Цель:
                        </span>{" "}
                        {email.goal}
                      </p>
                      <div className="rounded-lg bg-muted px-3 py-2">
                        <p className="text-xs italic text-muted-foreground">
                          {email.preview}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Rubrics tab ---

function RubricsTab({ plan }: { plan: ContentPlan }) {
  const cal = plan.calendar
  const total = cal.length || 1

  const groups = [
    {
      key: "educational",
      label: "Образовательный",
      description: "Полезный контент, обучающий аудиторию",
      color: "bg-muted0",
      lightColor: "bg-muted text-foreground border-border",
      target: 70,
    },
    {
      key: "engagement",
      label: "Вовлечение",
      description: "Истории, кейсы, опросы, за кулисами",
      color: "bg-warning/100",
      lightColor: "bg-warning/10 text-warning border-warning/20",
      target: 20,
    },
    {
      key: "sales",
      label: "Продающий",
      description: "Офферы, акции, призывы к действию",
      color: "bg-success/100",
      lightColor: "bg-success/10 text-success border-success/20",
      target: 10,
    },
  ] as const

  return (
    <div className="space-y-4">
      {groups.map(({ key, label, description, color, lightColor, target }) => {
        const count = cal.filter((i) => i.category === key).length
        const pct = Math.round((count / total) * 100)
        return (
          <div
            key={key}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block size-2.5 rounded-full ${color}`} />
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs font-medium ${lightColor}`}
                  >
                    Цель {target}%
                  </span>
                </div>
                <p className="mt-0.5 pl-4 text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">публ. · {pct}%</p>
              </div>
            </div>
            {/* Progress bar */}
            <Progress value={pct} barClassName={color} />
          </div>
        )
      })}
    </div>
  )
}


// --- Shared sub-components ---

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string | number
  sub: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground/50" />
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

function IdeaSection({
  title,
  count,
  icon: Icon,
  color,
  children,
}: {
  title: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: "violet" | "blue" | "orange"
  children: React.ReactNode
}) {
  const colorMap = {
    violet: "text-foreground bg-muted",
    blue: "text-foreground bg-muted",
    orange: "text-warning bg-warning/10",
  }
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-lg p-1.5 ${colorMap[color]}`}>
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-medium text-foreground">
          {title}{" "}
          <span className="text-muted-foreground">({count})</span>
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

function ScriptBlock({
  label,
  color,
  text,
}: {
  label: string
  color: "violet" | "blue" | "green"
  text: string
}) {
  const border = {
    violet: "border-l-violet-400",
    blue: "border-l-blue-400",
    green: "border-l-green-500",
  }[color]
  return (
    <div className={`border-l-2 pl-3 ${border}`}>
      <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  )
}
