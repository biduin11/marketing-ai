"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  ListOrdered,
  RefreshCw,
  Loader2,
  BotMessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, SEVERITY_VARIANT } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { StatCard, StatRow } from "@/components/shared/stat-card"
import { runDirectorAnalysis } from "@/lib/actions/ai"
import type { DirectorAnalysis } from "@/lib/ai/schemas/directorAnalysis"
import { cn } from "@/lib/utils"

const SEVERITY_LABEL: Record<"low" | "medium" | "high", string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
}

const SEVERITY_ORDER: Record<"low" | "medium" | "high", number> = {
  high: 0,
  medium: 1,
  low: 2,
}

interface DirectorViewProps {
  projectId: string
  analysis: DirectorAnalysis | null
  version: number | null
}

/** Карточка секции с иконкой-в-чипе и счётчиком (паттерн эталона #3). */
function SectionCard({
  title,
  icon: Icon,
  chip,
  count,
  countVariant,
  children,
}: {
  title: string
  icon: typeof AlertCircle
  chip: string
  count?: number
  countVariant?: "danger" | "success" | "warning" | "neutral"
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", chip)}>
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {count != null && (
          <Badge variant={countVariant ?? "neutral"} className="ml-auto">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </div>
  )
}

export function DirectorView({ projectId, analysis, version }: DirectorViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRefresh(force: boolean) {
    setLoading(true)
    try {
      const result = await runDirectorAnalysis(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Анализ обновлён")
      router.refresh()
    } catch {
      toast.error("Не удалось обновить анализ")
    } finally {
      setLoading(false)
    }
  }

  const highRisks =
    analysis?.risks.filter((r) => r.severity === "high").length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">AI Директор</h2>
          <p className="text-sm text-muted-foreground">
            {version ? `Снапшот версии ${version}` : "Стратегический анализ проекта"}
          </p>
        </div>
        {analysis ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefresh(true)}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Обновить анализ
          </Button>
        ) : (
          <Button size="sm" onClick={() => handleRefresh(false)} disabled={loading}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <BotMessageSquare className="size-3.5" />}
            Запустить анализ
          </Button>
        )}
      </div>

      {!analysis ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={BotMessageSquare}
            title="Анализ не запущен"
            description="AI Директор сканирует все артефакты и метрики проекта и формирует приоритеты действий."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Метрик-строка — фирменный приём эталона (#1) */}
          <StatRow cols={4}>
            <StatCard
              label="Проблемы"
              value={analysis.problems.length}
              sub="обнаружено"
              icon={AlertCircle}
              tone="danger"
            />
            <StatCard
              label="Возможности"
              value={analysis.opportunities.length}
              sub="для роста"
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Риски"
              value={analysis.risks.length}
              sub={highRisks > 0 ? `${highRisks} высоких` : "под контролем"}
              icon={ShieldAlert}
              tone="warning"
            />
            <StatCard
              label="Приоритеты"
              value={analysis.priorities.length}
              sub="действий в плане"
              icon={ListOrdered}
            />
          </StatRow>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Problems */}
            <SectionCard
              title="Проблемы"
              icon={AlertCircle}
              chip="bg-danger/10 text-danger"
              count={analysis.problems.length}
              countVariant="danger"
            >
              <ul className="space-y-3">
                {analysis.problems.map((p, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-border p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{p.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.impact}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Opportunities */}
            <SectionCard
              title="Возможности"
              icon={TrendingUp}
              chip="bg-success/10 text-success"
              count={analysis.opportunities.length}
              countVariant="success"
            >
              <ul className="space-y-3">
                {analysis.opportunities.map((o, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-border p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{o.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{o.potential}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Risks */}
            <SectionCard
              title="Риски"
              icon={ShieldAlert}
              chip="bg-warning/10 text-warning"
              count={analysis.risks.length}
              countVariant="warning"
            >
              <ul className="space-y-2.5">
                {[...analysis.risks]
                  .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
                  .map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl border border-border p-3"
                    >
                      <Badge variant={SEVERITY_VARIANT[r.severity]} size="sm" className="mt-0.5 shrink-0">
                        {SEVERITY_LABEL[r.severity]}
                      </Badge>
                      <p className="text-sm text-foreground">{r.title}</p>
                    </li>
                  ))}
              </ul>
            </SectionCard>

            {/* Priorities — нумерованные кружки (#4) */}
            <SectionCard
              title="Приоритеты действий"
              icon={ListOrdered}
              chip="bg-muted text-foreground"
              count={analysis.priorities.length}
            >
              <ol className="space-y-3">
                {[...analysis.priorities]
                  .sort((a, b) => a.order - b.order)
                  .map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                        {p.order}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{p.action}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.reason}</p>
                      </div>
                    </li>
                  ))}
              </ol>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  )
}
