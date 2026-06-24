"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Loader2, Crosshair } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { runCompetitorAnalysis } from "@/lib/actions/ai"
import type { CompetitorAnalysis } from "@/lib/ai/schemas/competitorAnalysis"

interface CompetitorViewProps {
  projectId: string
  analysis: CompetitorAnalysis | null
  version: number | null
}

export function CompetitorView({
  projectId,
  analysis,
  version,
}: CompetitorViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function generate(force: boolean) {
    setLoading(true)
    try {
      const result = await runCompetitorAnalysis(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "Анализ конкурентов обновлён" : "Анализ конкурентов готов")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать анализ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Конкуренты</h2>
          <p className="text-sm text-muted-foreground">
            Сравнительный анализ и возможности захвата рынка
            {version && <span className="ml-2 text-xs">· версия {version}</span>}
          </p>
        </div>
        {analysis ? (
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

      {!analysis ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={Crosshair}
            title="Анализ конкурентов не создан"
            description="Нажмите «Сгенерировать», чтобы AI проанализировал конкурентов и нашёл возможности захвата рынка."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>

          {/* Competitors table */}
          {analysis.competitors.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Сравнение конкурентов
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[#eaeaea]">
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        Конкурент
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        Позиционирование
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        Сильные стороны
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        Слабые стороны
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        Каналы
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.competitors.map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#eaeaea] last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {c.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.positioning}
                        </td>
                        <td className="px-4 py-3">
                          <ul className="space-y-1">
                            {c.strengths.map((s, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-1.5 text-[#16a34a]"
                              >
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#16a34a]" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-3">
                          <ul className="space-y-1">
                            {c.weaknesses.map((w, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-1.5 text-[#dc2626]"
                              >
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#dc2626]" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.channels.map((ch, j) => (
                              <span
                                key={j}
                                className="rounded border border-[#eaeaea] bg-neutral-50 px-1.5 py-0.5 text-xs text-foreground"
                              >
                                {ch}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Capture opportunities */}
          {analysis.opportunities.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Возможности захвата рынка
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {analysis.opportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-muted-foreground">
                        {opp.competitor}
                      </span>
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {opp.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {opp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Our advantages */}
          {analysis.ourAdvantages.length > 0 && (
            <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Наши конкурентные преимущества
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.ourAdvantages.map((adv, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-[#eaeaea] bg-neutral-50 px-3 py-1.5 text-sm text-foreground"
                  >
                    {adv}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
