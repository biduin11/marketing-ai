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
import { EmptyState } from "@/components/empty-state"
import { runDirectorAnalysis } from "@/lib/actions/ai"
import type { DirectorAnalysis } from "@/lib/ai/schemas/directorAnalysis"
import { cn } from "@/lib/utils"

const SEVERITY_LABEL: Record<"low" | "medium" | "high", string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
}

const SEVERITY_COLOR: Record<"low" | "medium" | "high", string> = {
  low: "bg-green-50 text-[#16a34a]",
  medium: "bg-amber-50 text-[#d97706]",
  high: "bg-red-50 text-[#dc2626]",
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
          <h2 className="text-lg font-semibold text-foreground">AI Директор</h2>
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
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="size-4 text-[#dc2626]" />
              <h3 className="text-sm font-semibold text-foreground">Проблемы</h3>
              <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-[#dc2626]">
                {analysis.problems.length}
              </span>
            </div>
            <ul className="space-y-3">
              {analysis.problems.map((p, i) => (
                <li key={i} className="border-b border-[#eaeaea] pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.impact}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-[#16a34a]" />
              <h3 className="text-sm font-semibold text-foreground">Возможности</h3>
              <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-[#16a34a]">
                {analysis.opportunities.length}
              </span>
            </div>
            <ul className="space-y-3">
              {analysis.opportunities.map((o, i) => (
                <li key={i} className="border-b border-[#eaeaea] pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{o.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{o.potential}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="size-4 text-[#d97706]" />
              <h3 className="text-sm font-semibold text-foreground">Риски</h3>
              <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-[#d97706]">
                {analysis.risks.length}
              </span>
            </div>
            <ul className="space-y-3">
              {analysis.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 border-b border-[#eaeaea] pb-3 last:border-0 last:pb-0">
                  <span className={cn("mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap", SEVERITY_COLOR[r.severity])}>
                    {SEVERITY_LABEL[r.severity]}
                  </span>
                  <p className="text-sm text-foreground">{r.title}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Priorities */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ListOrdered className="size-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Приоритеты действий</h3>
            </div>
            <ol className="space-y-3">
              {analysis.priorities
                .sort((a, b) => a.order - b.order)
                .map((p, i) => (
                  <li key={i} className="flex items-start gap-3 border-b border-[#eaeaea] pb-3 last:border-0 last:pb-0">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
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
