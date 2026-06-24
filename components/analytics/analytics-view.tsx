"use client"

import { useMemo, useState } from "react"
import type { Metric } from "@prisma/client"
import { BarChart3 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { AnalyticsCards } from "@/components/analytics/analytics-cards"
import { AnalyticsChart } from "@/components/analytics/analytics-chart"
import { AnalyticsTable } from "@/components/analytics/analytics-table"
import { MetricFormDialog } from "@/components/analytics/metric-form-dialog"
import {
  computeSummary,
  computeChannelBreakdown,
  computeTimeSeries,
  computeDelta,
  filterByRange,
  getPreviousRange,
} from "@/lib/services/analytics.service"
import { cn } from "@/lib/utils"

interface AnalyticsViewProps {
  projectId: string
  metrics: Metric[]
}

type Range = "7d" | "30d" | "90d"

const RANGES: { label: string; value: Range; days: number }[] = [
  { label: "7 дней", value: "7d", days: 7 },
  { label: "30 дней", value: "30d", days: 30 },
  { label: "90 дней", value: "90d", days: 90 },
]

function getRangeDates(days: number): { from: Date; to: Date } {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = new Date()
  from.setDate(from.getDate() - days + 1)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

export function AnalyticsView({ projectId, metrics }: AnalyticsViewProps) {
  const [range, setRange] = useState<Range>("30d")

  const { current, previous } = useMemo(() => {
    const days = RANGES.find((r) => r.value === range)!.days
    const { from, to } = getRangeDates(days)
    const prev = getPreviousRange(from, to)
    return {
      current: filterByRange(metrics, from, to),
      previous: filterByRange(metrics, prev.from, prev.to),
    }
  }, [metrics, range])

  const summary = useMemo(() => computeSummary(current), [current])
  const prevSummary = useMemo(() => computeSummary(previous), [previous])
  const channels = useMemo(() => computeChannelBreakdown(current), [current])
  const timeSeries = useMemo(() => computeTimeSeries(current), [current])

  const deltas = useMemo(
    () => ({
      totalSpend: computeDelta(summary.totalSpend, prevSummary.totalSpend),
      totalRevenue: computeDelta(summary.totalRevenue, prevSummary.totalRevenue),
      roi: computeDelta(summary.roi, prevSummary.roi),
      romi: computeDelta(summary.romi, prevSummary.romi),
    }),
    [summary, prevSummary]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Аналитика</h2>
          <p className="text-sm text-muted-foreground">
            ROI, ROMI, CAC, CPL — метрики по каналам
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-neutral-100 p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  range === r.value
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <MetricFormDialog projectId={projectId} />
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={BarChart3}
            title="Нет данных"
            description="Нажмите «Добавить данные», чтобы внести метрики по каналам и увидеть дашборд."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <AnalyticsCards summary={summary} deltas={deltas} />
          <AnalyticsChart data={timeSeries} />
          <AnalyticsTable channels={channels} />
        </div>
      )}
    </div>
  )
}
