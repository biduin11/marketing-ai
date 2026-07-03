"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Loader2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/strategy/kpi-card"
import { TaskList, type TaskItem } from "@/components/strategy/task-list"
import { ExportPdfButton } from "@/components/shared/export-pdf-button"
import { runStrategy } from "@/lib/actions/ai"
import type { Strategy, Horizon } from "@/lib/ai/schemas/strategy"
import { cn } from "@/lib/utils"
import { ArtifactVersionSelect } from "@/components/shared/artifact-version-select"

export interface StrategyEntry {
  artifactId: string
  version: number
  createdAt?: string
  data: Strategy
  doneKeys: string[]
}

interface StrategyViewProps {
  projectId: string
  entries: Record<number, StrategyEntry | null>
  allVersionEntries?: Record<number, StrategyEntry[]>
}

const horizons: { value: Horizon; label: string }[] = [
  { value: 30, label: "30 дней" },
  { value: 90, label: "90 дней" },
  { value: 180, label: "180 дней" },
  { value: 365, label: "1 год" },
]

export function StrategyView({ projectId, entries, allVersionEntries }: StrategyViewProps) {
  const router = useRouter()
  const [horizon, setHorizon] = useState<Horizon>(30)
  const [loading, setLoading] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<Record<number, string>>({})

  const versions = allVersionEntries?.[horizon] ?? []
  const activeVersionId = selectedVersionId[horizon] ?? versions[0]?.artifactId ?? ""
  const entry = versions.find((v) => v.artifactId === activeVersionId) ?? entries[horizon] ?? null

  function handleVersionChange(id: string) {
    setSelectedVersionId((prev) => ({ ...prev, [horizon]: id }))
  }

  async function generate(force: boolean) {
    setLoading(true)
    try {
      const result = await runStrategy(projectId, horizon, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "Стратегия обновлена" : "Стратегия готова")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать стратегию")
    } finally {
      setLoading(false)
    }
  }

  const tasks: TaskItem[] = entry
    ? entry.data.roadmap.map((r, i) => ({
        taskKey: `roadmap-${i}`,
        task: r.task,
        dueDate: r.dueDate,
        done: entry.doneKeys.includes(`roadmap-${i}`),
      }))
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Стратегия</h2>
          <p className="text-sm text-muted-foreground">
            Маркетинговый план по горизонтам
          </p>
        </div>
        <div className="flex items-center gap-2">
          {versions.length > 1 && (
            <ArtifactVersionSelect
              versions={versions.map((v) => ({
                id: v.artifactId,
                version: v.version,
                createdAt: v.createdAt ?? new Date().toISOString(),
              }))}
              selectedId={activeVersionId}
              onSelect={handleVersionChange}
            />
          )}
          {entry && (
            <ExportPdfButton
              printAreaId="strategy-print-area"
              filename={`strategy-${horizon}d`}
            />
          )}
          {entry ? (
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
          ) : (
            <Button size="sm" onClick={() => generate(false)} disabled={loading}>
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Сгенерировать
            </Button>
          )}
        </div>
      </div>

      {/* Horizon switcher */}
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {horizons.map((h) => (
          <button
            key={h.value}
            onClick={() => setHorizon(h.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              horizon === h.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!entry ? (
        <div className="flex h-[40vh] items-center justify-center">
          <EmptyState
            icon={CalendarDays}
            title={`План на ${horizons.find((h) => h.value === horizon)?.label} не создан`}
            description="Нажмите «Сгенерировать», чтобы AI построил стратегию с KPI, неделями и задачами."
          />
        </div>
      ) : (
        <div id="strategy-print-area" className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {entry.data.summary}
            </p>
          </div>

          {/* KPI */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-foreground">KPI</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {entry.data.kpi.map((k, i) => (
                <KpiCard key={i} name={k.name} target={k.target} />
              ))}
            </div>
          </div>

          {/* Weeks + Tasks */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-medium text-foreground">
                Недели / этапы
              </h3>
              <ol className="space-y-4">
                {entry.data.weeks.map((w) => (
                  <li key={w.n} className="flex gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                      {w.n}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {w.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{w.focus}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-2 text-sm font-medium text-foreground">
                Задачи
              </h3>
              <TaskList artifactId={entry.artifactId} tasks={tasks} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
