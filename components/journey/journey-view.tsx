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

export function JourneyView({ projectId, cjm, version }: JourneyViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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
                  <h3 className="mb-6 text-base font-semibold text-[#111]">
                    Воронка конверсий
                  </h3>
                  <div className="space-y-3">
                    {cjm.funnelMetrics.map((m, i) => {
                      const widths = [100, 82, 65, 50, 38, 28]
                      const width = widths[i] ?? Math.max(20, 100 - i * 15)
                      return (
                        <div key={i}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-[#6b7280]">{m.stage}</span>
                            <span className="text-xs font-medium text-[#111]">{m.conversion}</span>
                          </div>
                          <div className="flex justify-center">
                            <div
                              className="flex h-8 items-center justify-center rounded-lg bg-[#111] transition-all"
                              style={{ width: `${width}%` }}
                            >
                              <span className="truncate px-2 text-xs font-medium text-white">
                                {m.stage}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Рекомендации */}
              {cjm.recommendations.length > 0 && (
                <div className="rounded-2xl border border-[#eaeaea] bg-white p-6">
                  <h3 className="mb-6 text-base font-semibold text-[#111]">
                    Рекомендации
                  </h3>
                  <div className="space-y-3">
                    {cjm.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-xl border border-[#eaeaea] bg-[#fafafa] p-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#111] text-xs font-semibold text-white mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-[#111]">{rec}</p>
                      </div>
                    ))}
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
