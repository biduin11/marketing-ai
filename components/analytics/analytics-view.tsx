"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import type { Metric } from "@prisma/client"
import { BarChart3, Download, RefreshCw, Settings2 } from "lucide-react"
import { MetricsList } from "@/components/analytics/metrics-list"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { AnalyticsCards } from "@/components/analytics/analytics-cards"
import { AnalyticsChart } from "@/components/analytics/analytics-chart"
import { AnalyticsTable } from "@/components/analytics/analytics-table"
import { AnalyticsFunnel } from "@/components/analytics/analytics-funnel"
import { AnalyticsDonuts } from "@/components/analytics/analytics-donuts"
import { AnalyticsBottom } from "@/components/analytics/analytics-bottom"
import { AnalyticsAnomalies } from "@/components/analytics/analytics-anomalies"
import { AnalyticsBudgetPacing } from "@/components/analytics/analytics-budget-pacing"
import { MetricFormDialog } from "@/components/analytics/metric-form-dialog"
import { ContentTab } from "@/components/analytics/tabs/content-tab"
import { AudienceTab } from "@/components/analytics/tabs/audience-tab"
import { ChannelsTab } from "@/components/analytics/tabs/channels-tab"
import { CampaignsTab } from "@/components/analytics/tabs/campaigns-tab"
import { ConversionsTab } from "@/components/analytics/tabs/conversions-tab"
import { AttributionTab } from "@/components/analytics/tabs/attribution-tab"
import { AiInsightsTab } from "@/components/analytics/tabs/ai-insights-tab"
import { ComparisonDashboard } from "@/components/analytics/comparison-dashboard"
import { RoiCalculator } from "@/components/analytics/roi-calculator"
import { syncNow, type YandexMetrikaIntegrationItem } from "@/lib/actions/yandex-metrika"
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"
import type { AudienceSegments, BuyerPersona } from "@/lib/ai/schemas/audience"
import {
  computeSummary,
  computeChannelBreakdown,
  computeTimeSeries,
  computeDelta,
  computeFunnel,
  computeChannelTimeSeries,
  computeAttribution,
  computeHealthScore,
  computeAnomalies,
  filterByRange,
  getPreviousRange,
} from "@/lib/services/analytics.service"
import { cn } from "@/lib/utils"

interface AnalyticsViewProps {
  projectId: string
  metrics: Metric[]
  channels: string[]
  budget: number | null
  contentPlan: ContentPlan | null
  audienceSegments: AudienceSegments | null
  buyerPersona: BuyerPersona | null
  conversionRate: number | null
  avgCheck: number | null
  yandexMetrikaIntegration: YandexMetrikaIntegrationItem | null
}

type Range = "7d" | "30d" | "90d"
type Tab = "overview" | "content" | "audience" | "channels" | "campaigns" | "conversions" | "attribution" | "comparison" | "ai" | "roi"

const RANGES: { label: string; value: Range; days: number }[] = [
  { label: "7 дней", value: "7d", days: 7 },
  { label: "30 дней", value: "30d", days: 30 },
  { label: "90 дней", value: "90d", days: 90 },
]

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "content", label: "Контент" },
  { id: "audience", label: "Аудитория" },
  { id: "channels", label: "Каналы" },
  { id: "campaigns", label: "Кампании" },
  { id: "conversions", label: "Конверсии" },
  { id: "attribution", label: "Атрибуция" },
  { id: "comparison", label: "Сравнение" },
  { id: "ai", label: "AI Insights" },
  { id: "roi", label: "Калькулятор ROI" },
]

function getRangeDates(days: number): { from: Date; to: Date } {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = new Date()
  from.setDate(from.getDate() - days + 1)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

function formatDateRu(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
}

export function AnalyticsView({
  projectId,
  metrics,
  channels,
  budget,
  contentPlan,
  audienceSegments,
  buyerPersona,
  conversionRate,
  avgCheck,
  yandexMetrikaIntegration,
}: AnalyticsViewProps) {
  const [range, setRange] = useState<Range>("30d")
  const [tab, setTab] = useState<Tab>("overview")
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null)
  const [metrikaIntegration, setMetrikaIntegration] = useState(yandexMetrikaIntegration)
  const [isSyncPending, startSyncTransition] = useTransition()

  function handleMetrikaSync() {
    startSyncTransition(async () => {
      const result = await syncNow(projectId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setMetrikaIntegration((prev) =>
        prev ? { ...prev, lastSyncAt: new Date().toISOString(), syncError: null } : prev
      )
      toast.success(`Синхронизировано метрик: ${result.data.synced}`)
    })
  }

  const { current, previous, from, to, prevFrom, prevTo } = useMemo(() => {
    const days = RANGES.find((r) => r.value === range)!.days
    const { from, to } = getRangeDates(days)
    const prev = getPreviousRange(from, to)
    return {
      current: filterByRange(metrics, from, to),
      previous: filterByRange(metrics, prev.from, prev.to),
      from,
      to,
      prevFrom: prev.from,
      prevTo: prev.to,
    }
  }, [metrics, range])

  const summary = useMemo(() => computeSummary(current), [current])
  const prevSummary = useMemo(() => computeSummary(previous), [previous])
  const channelBreakdown = useMemo(() => computeChannelBreakdown(current), [current])
  const timeSeries = useMemo(() => computeTimeSeries(current), [current])
  const funnelSteps = useMemo(() => computeFunnel(summary), [summary])
  const channelTimeSeries = useMemo(() => computeChannelTimeSeries(current), [current])
  const attribution = useMemo(() => computeAttribution(channelBreakdown), [channelBreakdown])
  const healthScore = useMemo(() => computeHealthScore(summary, channelBreakdown), [summary, channelBreakdown])
  const anomalies = useMemo(() => computeAnomalies(metrics), [metrics])
  const monthSpend = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)
    return metrics
      .filter((m) => {
        const d = m.date instanceof Date ? m.date : new Date(m.date)
        return d >= monthStart && d <= monthEnd
      })
      .reduce((s, m) => s + m.spend, 0)
  }, [metrics])

  // ROI-калькулятор всегда считает по фиксированным последним 30 дням,
  // независимо от выбранного диапазона в шапке страницы.
  const last30 = useMemo(() => {
    const rangeTo = new Date()
    rangeTo.setHours(23, 59, 59, 999)
    const rangeFrom = new Date()
    rangeFrom.setDate(rangeFrom.getDate() - 29)
    rangeFrom.setHours(0, 0, 0, 0)
    return filterByRange(metrics, rangeFrom, rangeTo)
  }, [metrics])
  const last30Summary = useMemo(() => computeSummary(last30), [last30])
  const last30ChannelBreakdown = useMemo(() => computeChannelBreakdown(last30), [last30])
  const roiChannelMetrics = useMemo(
    () =>
      last30ChannelBreakdown.map((c) => ({
        channel: c.channel,
        cpl: c.cpl,
        conversion: conversionRate ?? 10,
      })),
    [last30ChannelBreakdown, conversionRate]
  )

  const deltas = useMemo(() => {
    const keys = [
      "totalSpend",
      "totalImpressions",
      "totalClicks",
      "totalLeads",
      "totalRevenue",
      "romi",
      "cpl",
    ] as const
    const result: Record<string, number> = {}
    for (const k of keys) {
      result[k] = computeDelta(
        summary[k as keyof typeof summary] as number,
        prevSummary[k as keyof typeof prevSummary] as number
      )
    }
    const currCtr = summary.totalImpressions > 0
      ? (summary.totalClicks / summary.totalImpressions) * 100
      : 0
    const prevCtr = prevSummary.totalImpressions > 0
      ? (prevSummary.totalClicks / prevSummary.totalImpressions) * 100
      : 0
    result["ctr"] = computeDelta(currCtr, prevCtr)
    const currSales = Math.round(summary.totalLeads * 0.278)
    const prevSales = Math.round(prevSummary.totalLeads * 0.278)
    result["sales"] = computeDelta(currSales, prevSales)
    return result
  }, [summary, prevSummary])

  const totalSales = Math.round(summary.totalLeads * 0.278)
  const convRate =
    summary.totalImpressions > 0
      ? `${((totalSales / summary.totalImpressions) * 100).toFixed(2)}%`
      : "—"
  const avgCheckLabel =
    totalSales > 0
      ? `${Math.round(summary.totalRevenue / totalSales).toLocaleString("ru-RU")} ₽`
      : "—"

  return (
    <div className="relative space-y-5 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Аналитика</h2>
          <p className="text-sm text-muted-foreground">
            {formatDateRu(from)} — {formatDateRu(to)}
            <span className="ml-3 text-muted-foreground/60">
              Сравнить: {formatDateRu(prevFrom)} — {formatDateRu(prevTo)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-border bg-card">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  range === r.value
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm">
            <Download className="size-3.5" />
            Экспорт
          </Button>

          <Button variant="outline" size="sm" className="px-2">
            <Settings2 className="size-3.5" />
          </Button>

          <MetricFormDialog
            projectId={projectId}
            channels={channels}
            editingMetric={editingMetric}
            onEditClose={() => setEditingMetric(null)}
          />
        </div>
      </div>

      {metrikaIntegration?.isActive && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-[#FC3F1D]">
            <span className="text-xs font-bold text-white">Я</span>
          </div>
          <p className="flex-1 text-xs text-muted-foreground">
            Данные автоматически импортируются из Яндекс.Метрики
            {metrikaIntegration.lastSyncAt &&
              ` · Обновлено ${new Date(metrikaIntegration.lastSyncAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
            {" · Расходы и выручка вносятся вручную."}
          </p>
          <button
            onClick={handleMetrikaSync}
            disabled={isSyncPending}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3", isSyncPending && "animate-spin")} />
            Обновить
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-5 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 pb-2.5 text-sm transition-colors",
              tab === t.id
                ? "border-b-2 border-foreground font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        metrics.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center">
            <EmptyState
              icon={BarChart3}
              title="Нет данных"
              description="Нажмите «Добавить источник», чтобы внести метрики по каналам и увидеть дашборд."
            />
          </div>
        ) : (
          <div className="space-y-5">
            <AnalyticsCards summary={summary} deltas={deltas} timeSeries={timeSeries} />
            {budget && budget > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <AnalyticsAnomalies anomalies={anomalies} />
                <AnalyticsBudgetPacing monthlyBudget={budget} monthSpend={monthSpend} />
              </div>
            ) : (
              <AnalyticsAnomalies anomalies={anomalies} />
            )}
            <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
              <div className="space-y-5">
                <AnalyticsChart data={timeSeries} />
                <AnalyticsFunnel steps={funnelSteps} conversionRate={convRate} avgCheck={avgCheckLabel} />
              </div>
              <AnalyticsTable channels={channelBreakdown} />
            </div>
            <AnalyticsDonuts channels={channelBreakdown} />
            <AnalyticsBottom channels={channelBreakdown} summary={summary} />
            <MetricsList metrics={metrics} onEdit={(m) => setEditingMetric(m)} />
          </div>
        )
      )}

      {tab === "content" && (
        <ContentTab channels={channelBreakdown} timeSeries={timeSeries} contentPlan={contentPlan} />
      )}

      {tab === "audience" && (
        <AudienceTab
          summary={summary}
          channels={channelBreakdown}
          timeSeries={timeSeries}
          audienceSegments={audienceSegments}
          buyerPersona={buyerPersona}
        />
      )}

      {tab === "channels" && (
        <ChannelsTab channels={channelBreakdown} channelTimeSeries={channelTimeSeries} />
      )}

      {tab === "campaigns" && (
        <CampaignsTab channels={channelBreakdown} summary={summary} />
      )}

      {tab === "conversions" && (
        <ConversionsTab summary={summary} channels={channelBreakdown} timeSeries={timeSeries} />
      )}

      {tab === "attribution" && (
        <AttributionTab attribution={attribution} channels={channelBreakdown} />
      )}

      {tab === "comparison" && (
        <ComparisonDashboard projectId={projectId} metrics={metrics} />
      )}

      {tab === "ai" && (
        <AiInsightsTab summary={summary} channels={channelBreakdown} healthScore={healthScore} />
      )}

      {tab === "roi" && (
        <RoiCalculator
          avgCpl={last30Summary.cpl}
          conversionRate={conversionRate ?? 10}
          avgCheck={avgCheck ?? 0}
          channelMetrics={roiChannelMetrics}
          hasRealMetrics={last30.length > 0}
        />
      )}

    </div>
  )
}
