"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Loader2, Route } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { JourneyStageCard } from "@/components/journey/journey-stage-card"
import { runCjm } from "@/lib/actions/ai"
import type { Cjm } from "@/lib/ai/schemas/cjm"

interface JourneyViewProps {
  projectId: string
  cjm: Cjm | null
  version: number | null
}

const stageIcons = ["👁", "🔍", "💡", "🛒", "🤝", "❤️", "⭐"]

// Рекомендации хранятся как string[] — делим на заголовок (первое предложение) и остаток
function splitRecommendation(rec: string): { title: string; description: string } {
  const idx = rec.search(/[.!?]\s/)
  if (idx === -1) return { title: rec.trim(), description: "" }
  return {
    title: rec.slice(0, idx + 1).trim(),
    description: rec.slice(idx + 2).trim(),
  }
}

// mainDrop отсутствует в схеме — вычисляем этап с наименьшей конверсией
function computeMainDrop(metrics: Cjm["funnelMetrics"]): string | null {
  let worst: { stage: string; value: number } | null = null
  for (const m of metrics) {
    const match = m.conversion.match(/(\d+(?:[.,]\d+)?)/)
    if (!match) continue
    const value = parseFloat(match[1].replace(",", "."))
    if (Number.isNaN(value)) continue
    if (worst === null || value < worst.value) {
      worst = { stage: m.stage, value }
    }
  }
  return worst?.stage ?? null
}

export function JourneyView({ projectId, cjm, version }: JourneyViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const mainDrop = cjm ? computeMainDrop(cjm.funnelMetrics) : null

  async function generate(force: boolean) {
    setLoading(true)
    try {
      const result = await runCjm(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "CJM обновлён" : "CJM готов")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать CJM")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Customer Journey Map
          </h2>
          <p className="text-sm text-muted-foreground">
            Путь клиента: этапы, точки контакта, риски потери
            {version && (
              <span className="ml-2 text-xs">· версия {version}</span>
            )}
          </p>
        </div>
        {cjm ? (
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

      {!cjm ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={Route}
            title="CJM не создан"
            description="Нажмите «Сгенерировать», чтобы AI построил путь клиента с этапами, touchpoints и рисками потери."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{cjm.summary}</p>
          </div>

          {/* Stage Pipeline — vertical */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground">
              Этапы пути клиента
            </h3>
            <div className="flex flex-col gap-6">
              {cjm.stages.map((stage, i) => (
                <JourneyStageCard key={i} stage={stage} index={i} />
              ))}
            </div>
          </div>

          {/* Funnel + Recommendations grid */}
          {(cjm.funnelMetrics.length > 0 || cjm.recommendations.length > 0) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Воронка конверсий */}
              {cjm.funnelMetrics.length > 0 && (
                <div className="rounded-2xl border border-[#eaeaea] bg-white p-6">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="text-lg">▼</span>
                    <h3 className="text-lg font-semibold text-[#111]">Воронка конверсий</h3>
                  </div>

                  <div className="space-y-4">
                    {cjm.funnelMetrics.map((m, i) => {
                      const widths = [100, 78, 58, 42, 30, 20, 14]
                      const width = widths[i] ?? 14
                      return (
                        <div key={i} className="space-y-1.5">
                          {/* Строка 1: иконка + название + процент */}
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#eaeaea] bg-white text-base">
                              {stageIcons[i] ?? "•"}
                            </div>
                            <p className="min-w-0 flex-1 text-sm font-medium text-[#111]">
                              {m.stage}
                            </p>
                            <span className="shrink-0 text-sm font-semibold text-[#111]">
                              {m.conversion}
                            </span>
                          </div>
                          {/* Строка 2: бар без текста */}
                          <div className="pl-12">
                            <div
                              className="h-8 rounded-lg bg-[#111]"
                              style={{ width: `${width}%`, minWidth: "80px" }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {mainDrop && (
                    <div className="mt-6 flex items-center gap-2 border-t border-[#eaeaea] pt-4">
                      <span className="text-sm text-[#6b7280]">📊</span>
                      <p className="text-sm text-[#6b7280]">
                        Основная просадка на этапе:
                        <span className="font-medium text-[#111]"> {mainDrop}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Рекомендации */}
              {cjm.recommendations.length > 0 && (
                <div className="rounded-2xl border border-[#eaeaea] bg-white p-6">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-lg font-semibold text-[#111]">Рекомендации</h3>
                  </div>

                  <div className="space-y-4">
                    {cjm.recommendations.map((rec, i) => {
                      const { title, description } = splitRecommendation(rec)
                      return (
                        <div
                          key={i}
                          className="flex gap-4 border-b border-[#eaeaea] pb-4 last:border-0 last:pb-0"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111] text-sm font-semibold text-white">
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-sm font-semibold leading-snug text-[#111]">
                              {title}
                            </p>
                            {description && (
                              <p className="text-sm leading-relaxed text-[#6b7280]">
                                {description}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  )
}
