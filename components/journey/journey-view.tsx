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

          {/* Stage Pipeline — horizontal scroll */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-foreground">
              Этапы пути клиента
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {cjm.stages.map((stage, i) => (
                <div key={i} className="flex items-start gap-2">
                  <JourneyStageCard stage={stage} index={i} />
                  {i < cjm.stages.length - 1 && (
                    <div className="mt-8 shrink-0 text-muted-foreground">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Funnel Metrics */}
          {cjm.funnelMetrics.length > 0 && (
            <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-foreground">
                Воронка конверсий
              </h3>
              <div className="space-y-3">
                {cjm.funnelMetrics.map((m, i) => {
                  const pct = parseFloat(m.conversion.replace(/[^0-9.]/g, "")) || 0
                  const width = Math.min(Math.max(pct, 5), 100)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <p className="w-32 shrink-0 text-xs text-muted-foreground">
                        {m.stage}
                      </p>
                      <div className="flex-1">
                        <div className="h-5 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-neutral-800 transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <p className="w-16 shrink-0 text-right text-xs font-medium text-foreground">
                        {m.conversion}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {cjm.recommendations.length > 0 && (
            <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Рекомендации
              </h3>
              <ul className="space-y-2">
                {cjm.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
