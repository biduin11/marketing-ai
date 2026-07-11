"use client"

import { useMemo, useState, useTransition } from "react"
import type { Metric } from "@prisma/client"
import { Loader2, Sparkles } from "lucide-react"
import {
  computeSummary,
  computeChannelBreakdown,
  computeChannelComparison,
  filterByRange,
  getComparisonRanges,
  type ComparisonPeriod,
} from "@/lib/services/analytics.service"
import { generatePeriodComment } from "@/lib/actions/ai"
import { cn } from "@/lib/utils"

interface ComparisonDashboardProps {
  projectId: string
  metrics: Metric[]
}

const PERIODS: { value: ComparisonPeriod; label: string; comparisonLabel: string }[] = [
  { value: "month", label: "Месяц", comparisonLabel: "Этот месяц vs прошлый месяц" },
  { value: "week", label: "Неделя", comparisonLabel: "Эта неделя vs прошлая неделя" },
  { value: "quarter", label: "Квартал", comparisonLabel: "Этот квартал vs прошлый квартал" },
  { value: "year", label: "Год", comparisonLabel: "Этот год vs прошлый год" },
]

interface MetricDef {
  label: string
  key: "spend" | "revenue" | "leads" | "roi" | "cac" | "cpl" | "clicks" | "impressions"
  suffix: string
  invertDelta?: boolean
}

const METRIC_DEFS: MetricDef[] = [
  { label: "Расходы", key: "spend", suffix: " ₽", invertDelta: true },
  { label: "Выручка", key: "revenue", suffix: " ₽" },
  { label: "Лиды", key: "leads", suffix: "" },
  { label: "ROI", key: "roi", suffix: "%" },
  { label: "CAC", key: "cac", suffix: " ₽", invertDelta: true },
  { label: "CPL", key: "cpl", suffix: " ₽", invertDelta: true },
  { label: "Клики", key: "clicks", suffix: "" },
  { label: "Показы", key: "impressions", suffix: "" },
]

export function ComparisonDashboard({ projectId, metrics }: ComparisonDashboardProps) {
  const [period, setPeriod] = useState<ComparisonPeriod>("month")
  const [aiComment, setAiComment] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const periodMeta = PERIODS.find((p) => p.value === period)!

  const { current, previous } = useMemo(() => {
    const ranges = getComparisonRanges(period)
    return {
      current: filterByRange(metrics, ranges.current.from, ranges.current.to),
      previous: filterByRange(metrics, ranges.previous.from, ranges.previous.to),
    }
  }, [metrics, period])

  const currentSummary = useMemo(() => computeSummary(current), [current])
  const previousSummary = useMemo(() => computeSummary(previous), [previous])

  const currentValues = useMemo(
    () => ({
      spend: currentSummary.totalSpend,
      revenue: currentSummary.totalRevenue,
      leads: currentSummary.totalLeads,
      roi: Math.round(currentSummary.roi),
      cac: Math.round(currentSummary.cac),
      cpl: Math.round(currentSummary.cpl),
      clicks: currentSummary.totalClicks,
      impressions: currentSummary.totalImpressions,
    }),
    [currentSummary]
  )

  const previousValues = useMemo(
    () => ({
      spend: previousSummary.totalSpend,
      revenue: previousSummary.totalRevenue,
      leads: previousSummary.totalLeads,
      roi: Math.round(previousSummary.roi),
      cac: Math.round(previousSummary.cac),
      cpl: Math.round(previousSummary.cpl),
      clicks: previousSummary.totalClicks,
      impressions: previousSummary.totalImpressions,
    }),
    [previousSummary]
  )

  const channelComparison = useMemo(() => {
    const currentChannels = computeChannelBreakdown(current)
    const previousChannels = computeChannelBreakdown(previous)
    return computeChannelComparison(currentChannels, previousChannels)
  }, [current, previous])

  const maxRoi = Math.max(1, ...channelComparison.flatMap((c) => [c.currRoi, c.prevRoi]))

  const hasPreviousData = previous.length > 0

  function handlePeriodChange(value: ComparisonPeriod) {
    setPeriod(value)
    setAiComment(null)
    setAiError(null)
  }

  function generateComment() {
    setAiError(null)
    startTransition(async () => {
      const result = await generatePeriodComment(projectId, {
        periodLabel: periodMeta.comparisonLabel,
        current: currentValues,
        previous: previousValues,
      })
      if (result.success) {
        setAiComment(result.comment)
      } else {
        setAiError(result.error)
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Переключатель периода */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriodChange(p.value)}
            className={cn(
              "text-sm px-4 py-2 rounded-lg border transition-all",
              period === p.value
                ? "bg-[#111] text-white border-[#111]"
                : "border-[#eaeaea] text-[#6b7280] hover:bg-[#fafafa]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[#6b7280]">
        {periodMeta.comparisonLabel} · сравнение с предыдущим периодом
      </p>

      {!hasPreviousData && (
        <p className="text-sm text-[#6b7280]">Нет данных за предыдущий период</p>
      )}

      {/* Сетка метрик с дельтой */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRIC_DEFS.map((m) => {
          const curr = currentValues[m.key]
          const prev = previousValues[m.key]
          const delta = prev > 0 ? ((curr - prev) / prev) * 100 : 0
          const isPositive = m.invertDelta ? delta < 0 : delta > 0

          return (
            <div key={m.key} className="rounded-2xl border border-[#eaeaea] bg-white p-4">
              <p className="mb-1 text-xs text-[#6b7280]">{m.label}</p>

              <p className="text-xl font-bold tabular-nums text-[#111]">
                {curr > 0 ? `${curr.toLocaleString("ru-RU")}${m.suffix}` : "—"}
              </p>

              {prev > 0 && curr > 0 && (
                <div className={cn("mt-1 flex items-center gap-1", isPositive ? "text-green-600" : "text-red-500")}>
                  <span className="text-sm">{isPositive ? "↑" : "↓"}</span>
                  <span className="text-xs font-medium">{Math.abs(delta).toFixed(1)}%</span>
                  <span className="text-xs text-[#6b7280]">vs прошлый период</span>
                </div>
              )}

              {prev > 0 && (
                <p className="mt-1 text-xs text-[#6b7280]">
                  Было: {prev.toLocaleString("ru-RU")}
                  {m.suffix}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Сравнение по каналам */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-[#111]">Сравнение по каналам</h3>

        <div className="space-y-4">
          {channelComparison.map((ch) => {
            const delta = ch.prevRoi > 0 ? ((ch.currRoi - ch.prevRoi) / ch.prevRoi) * 100 : 0
            const isPositive = delta > 0

            return (
              <div key={ch.channel}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-[#111]">{ch.channel}</span>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-medium", isPositive ? "text-green-600" : "text-red-500")}>
                      {isPositive ? "↑" : "↓"} {Math.abs(delta).toFixed(0)}%
                    </span>
                    <span className="text-sm font-semibold text-[#111]">ROI {ch.currRoi}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-[#6b7280]">Сейчас</span>
                    <div className="h-2 flex-1 rounded-full bg-[#eaeaea]">
                      <div
                        className="h-2 rounded-full bg-[#111]"
                        style={{ width: `${Math.min((ch.currRoi / maxRoi) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-[#6b7280]">Прошлый</span>
                    <div className="h-2 flex-1 rounded-full bg-[#eaeaea]">
                      <div
                        className="h-2 rounded-full bg-[#6b7280]"
                        style={{ width: `${Math.min((ch.prevRoi / maxRoi) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {channelComparison.length === 0 && (
          <p className="py-4 text-center text-sm text-[#6b7280]">Нет данных для сравнения</p>
        )}
      </div>

      {/* AI-комментарий */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-6">
        <div className="mb-3 flex items-center gap-2">
          <span>✨</span>
          <h3 className="text-sm font-semibold text-[#111]">AI-комментарий</h3>
        </div>

        {aiComment ? (
          <p className="text-sm leading-relaxed text-[#111]">{aiComment}</p>
        ) : (
          <div>
            <p className="mb-3 text-sm text-[#6b7280]">
              AI проанализирует изменения и объяснит причины
            </p>
            {aiError && <p className="mb-3 text-sm text-red-500">{aiError}</p>}
            <button
              onClick={generateComment}
              disabled={isPending || !hasPreviousData}
              className="flex items-center gap-2 rounded-lg border border-[#eaeaea] px-4 py-2 text-sm hover:bg-[#fafafa] disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Анализирую...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Объяснить изменения
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
