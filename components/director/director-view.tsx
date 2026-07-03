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
import { runDirectorAnalysis } from "@/lib/actions/ai"
import type { DirectorAnalysis } from "@/lib/ai/schemas/directorAnalysis"

const SEVERITY_LABEL: Record<"low" | "medium" | "high", string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
}

interface DirectorViewProps {
  projectId: string
  analysis: DirectorAnalysis | null
  version: number | null
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
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Problems */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="size-4 text-danger" />
              <h3 className="text-sm font-semibold text-foreground">Проблемы</h3>
              <Badge variant="danger" className="ml-auto">
                {analysis.problems.length}
              </Badge>
            </div>
            <ul className="space-y-3">
              {analysis.problems.map((p, i) => (
                <li key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.impact}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-success" />
              <h3 className="text-sm font-semibold text-foreground">Возможности</h3>
              <Badge variant="success" className="ml-auto">
                {analysis.opportunities.length}
              </Badge>
            </div>
            <ul className="space-y-3">
              {analysis.opportunities.map((o, i) => (
                <li key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{o.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{o.potential}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="size-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Риски</h3>
              <Badge variant="warning" className="ml-auto">
                {analysis.risks.length}
              </Badge>
            </div>
            <ul className="space-y-3">
              {analysis.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 border-b border-border pb-3 last:border-0 last:pb-0">
                  <Badge variant={SEVERITY_VARIANT[r.severity]} size="sm" className="mt-0.5">
                    {SEVERITY_LABEL[r.severity]}
                  </Badge>
                  <p className="text-sm text-foreground">{r.title}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Priorities */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ListOrdered className="size-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Приоритеты действий</h3>
            </div>
            <ol className="space-y-3">
              {analysis.priorities
                .sort((a, b) => a.order - b.order)
                .map((p, i) => (
                  <li key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                      {p.order}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.reason}</p>
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
