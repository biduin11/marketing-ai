import type { Metric } from "@prisma/client"

export interface MetricSummary {
  totalSpend: number
  totalRevenue: number
  totalLeads: number
  totalClicks: number
  totalImpressions: number
  roi: number
  romi: number
  cac: number
  cpl: number
  cpc: number
  cpm: number
  ltv: number
}

export interface ChannelMetrics {
  channel: string
  spend: number
  revenue: number
  leads: number
  clicks: number
  impressions: number
  roi: number
  romi: number
  cpl: number
  cpc: number
  cpm: number
  ctr: number
  sales: number
}

export interface TimeSeriesPoint {
  date: string
  spend: number
  revenue: number
  clicks: number
  leads: number
  impressions: number
}

export interface FunnelStep {
  label: string
  value: number
  rate?: string
  isCurrency?: boolean
}

function safeDiv(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

function calcRoi(spend: number, revenue: number): number {
  return spend === 0 ? 0 : ((revenue - spend) / spend) * 100
}

export function computeSummary(metrics: Metric[]): MetricSummary {
  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0)
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0)
  const totalLeads = metrics.reduce((s, m) => s + m.leads, 0)
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0)
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0)

  return {
    totalSpend,
    totalRevenue,
    totalLeads,
    totalClicks,
    totalImpressions,
    roi: calcRoi(totalSpend, totalRevenue),
    romi: calcRoi(totalSpend, totalRevenue),
    cac: safeDiv(totalSpend, totalLeads),
    cpl: safeDiv(totalSpend, totalLeads),
    cpc: safeDiv(totalSpend, totalClicks),
    cpm: safeDiv(totalSpend, totalImpressions) * 1000,
    ltv: safeDiv(totalRevenue, totalLeads),
  }
}

export function computeChannelBreakdown(metrics: Metric[]): ChannelMetrics[] {
  const map = new Map<string, Metric[]>()
  for (const m of metrics) {
    const arr = map.get(m.channel) ?? []
    arr.push(m)
    map.set(m.channel, arr)
  }

  return Array.from(map.entries())
    .map(([channel, rows]) => {
      const spend = rows.reduce((s, r) => s + r.spend, 0)
      const revenue = rows.reduce((s, r) => s + r.revenue, 0)
      const leads = rows.reduce((s, r) => s + r.leads, 0)
      const clicks = rows.reduce((s, r) => s + r.clicks, 0)
      const impressions = rows.reduce((s, r) => s + r.impressions, 0)
      return {
        channel,
        spend,
        revenue,
        leads,
        clicks,
        impressions,
        roi: calcRoi(spend, revenue),
        romi: calcRoi(spend, revenue),
        cpl: safeDiv(spend, leads),
        cpc: safeDiv(spend, clicks),
        cpm: safeDiv(spend, impressions) * 1000,
        ctr: impressions > 0 ? safeDiv(clicks, impressions) * 100 : 0,
        sales: Math.round(leads * 0.278),
      }
    })
    .sort((a, b) => b.roi - a.roi)
}

export function computeTimeSeries(metrics: Metric[]): TimeSeriesPoint[] {
  const map = new Map<string, { spend: number; revenue: number; clicks: number; leads: number; impressions: number }>()
  for (const m of metrics) {
    const key = m.date instanceof Date
      ? m.date.toISOString().slice(0, 10)
      : String(m.date).slice(0, 10)
    const existing = map.get(key) ?? { spend: 0, revenue: 0, clicks: 0, leads: 0, impressions: 0 }
    map.set(key, {
      spend: existing.spend + m.spend,
      revenue: existing.revenue + m.revenue,
      clicks: existing.clicks + m.clicks,
      leads: existing.leads + m.leads,
      impressions: existing.impressions + m.impressions,
    })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))
}

export function computeFunnel(summary: MetricSummary): FunnelStep[] {
  const visitors = Math.round(summary.totalClicks * 0.667)
  const sales = Math.round(summary.totalLeads * 0.278)
  const imp = summary.totalImpressions
  return [
    { label: "Показы", value: imp },
    {
      label: "Клики",
      value: summary.totalClicks,
      rate: imp > 0 ? `${((summary.totalClicks / imp) * 100).toFixed(2)}%` : undefined,
    },
    {
      label: "Посетители",
      value: visitors,
      rate: summary.totalClicks > 0 ? `${((visitors / summary.totalClicks) * 100).toFixed(2)}%` : undefined,
    },
    {
      label: "Лиды",
      value: summary.totalLeads,
      rate: visitors > 0 ? `${((summary.totalLeads / visitors) * 100).toFixed(2)}%` : undefined,
    },
    {
      label: "Продажи",
      value: sales,
      rate: summary.totalLeads > 0 ? `${((sales / summary.totalLeads) * 100).toFixed(2)}%` : undefined,
    },
    {
      label: "Выручка",
      value: summary.totalRevenue,
      isCurrency: true,
      rate: sales > 0 ? `${Math.round(summary.totalRevenue / sales).toLocaleString("ru-RU")} ₽` : undefined,
    },
  ]
}

export interface AttributionData {
  channel: string
  revenueShare: number
  leadsShare: number
  revenue: number
  leads: number
}

export function computeChannelTimeSeries(metrics: Metric[]): Record<string, TimeSeriesPoint[]> {
  const byChannel = new Map<string, Metric[]>()
  for (const m of metrics) {
    const arr = byChannel.get(m.channel) ?? []
    arr.push(m)
    byChannel.set(m.channel, arr)
  }
  const result: Record<string, TimeSeriesPoint[]> = {}
  for (const [channel, rows] of byChannel) {
    result[channel] = computeTimeSeries(rows)
  }
  return result
}

export function computeAttribution(channels: ChannelMetrics[]): AttributionData[] {
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0)
  const totalLeads = channels.reduce((s, c) => s + c.leads, 0)
  return channels
    .map((c) => ({
      channel: c.channel,
      revenueShare: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0,
      leadsShare: totalLeads > 0 ? (c.leads / totalLeads) * 100 : 0,
      revenue: c.revenue,
      leads: c.leads,
    }))
    .sort((a, b) => b.revenueShare - a.revenueShare)
}

export function computeHealthScore(summary: MetricSummary, channels: ChannelMetrics[]): number {
  let score = 40
  if (summary.romi > 500) score += 25
  else if (summary.romi > 200) score += 15
  else if (summary.romi > 0) score += 5
  else score -= 10
  if (summary.cpl > 0 && summary.cpl < 500) score += 15
  else if (summary.cpl > 0 && summary.cpl < 2000) score += 7
  if (channels.length >= 4) score += 10
  else if (channels.length >= 2) score += 5
  if (summary.totalLeads > 200) score += 10
  else if (summary.totalLeads > 50) score += 5
  return Math.min(100, Math.max(0, score))
}

export interface AnomalyItem {
  channel: string
  metric: "CPL" | "Лиды/день" | "Расходы/день"
  delta: number
  current: number
  previous: number
  direction: "up" | "down"
  severity: "critical" | "warning" | "positive"
}

export function computeAnomalies(metrics: Metric[]): AnomalyItem[] {
  const now = new Date()

  const recentFrom = new Date(now)
  recentFrom.setDate(now.getDate() - 3)
  recentFrom.setHours(0, 0, 0, 0)

  const baselineFrom = new Date(now)
  baselineFrom.setDate(now.getDate() - 10)
  baselineFrom.setHours(0, 0, 0, 0)

  const recent = metrics.filter((m) => {
    const d = m.date instanceof Date ? m.date : new Date(m.date)
    return d >= recentFrom
  })
  const baseline = metrics.filter((m) => {
    const d = m.date instanceof Date ? m.date : new Date(m.date)
    return d >= baselineFrom && d < recentFrom
  })

  if (recent.length === 0 || baseline.length === 0) return []

  const channels = [...new Set(metrics.map((m) => m.channel))]
  const anomalies: AnomalyItem[] = []
  const THRESHOLD = 25

  for (const channel of channels) {
    const r = recent.filter((m) => m.channel === channel)
    const b = baseline.filter((m) => m.channel === channel)
    if (r.length === 0 || b.length === 0) continue

    const rSpend = r.reduce((s, m) => s + m.spend, 0)
    const bSpend = b.reduce((s, m) => s + m.spend, 0)
    const rLeads = r.reduce((s, m) => s + m.leads, 0)
    const bLeads = b.reduce((s, m) => s + m.leads, 0)

    const rCpl = rLeads > 0 ? rSpend / rLeads : 0
    const bCpl = bLeads > 0 ? bSpend / bLeads : 0
    if (bCpl > 0 && rCpl > 0) {
      const delta = ((rCpl - bCpl) / bCpl) * 100
      if (Math.abs(delta) >= THRESHOLD) {
        anomalies.push({
          channel, metric: "CPL", delta,
          current: rCpl, previous: bCpl,
          direction: delta > 0 ? "up" : "down",
          severity: delta > 0 ? (delta > 50 ? "critical" : "warning") : "positive",
        })
      }
    }

    const rLeadsDay = rLeads / 3
    const bLeadsDay = bLeads / 7
    if (bLeadsDay > 0) {
      const delta = ((rLeadsDay - bLeadsDay) / bLeadsDay) * 100
      if (Math.abs(delta) >= THRESHOLD) {
        anomalies.push({
          channel, metric: "Лиды/день", delta,
          current: rLeadsDay, previous: bLeadsDay,
          direction: delta > 0 ? "up" : "down",
          severity: delta > 0 ? "positive" : (delta < -50 ? "critical" : "warning"),
        })
      }
    }

    const rSpendDay = rSpend / 3
    const bSpendDay = bSpend / 7
    if (bSpendDay > 0) {
      const delta = ((rSpendDay - bSpendDay) / bSpendDay) * 100
      if (Math.abs(delta) >= 40) {
        anomalies.push({
          channel, metric: "Расходы/день", delta,
          current: rSpendDay, previous: bSpendDay,
          direction: delta > 0 ? "up" : "down",
          severity: "warning",
        })
      }
    }
  }

  const severityOrder: Record<AnomalyItem["severity"], number> = { critical: 0, warning: 1, positive: 2 }
  return anomalies
    .sort((a, b) => {
      const sd = severityOrder[a.severity] - severityOrder[b.severity]
      return sd !== 0 ? sd : Math.abs(b.delta) - Math.abs(a.delta)
    })
    .slice(0, 4)
}

export function computeDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / Math.abs(previous)) * 100
}

export function filterByRange(metrics: Metric[], from: Date, to: Date): Metric[] {
  return metrics.filter((m) => {
    const d = m.date instanceof Date ? m.date : new Date(m.date)
    return d >= from && d <= to
  })
}

export function getPreviousRange(from: Date, to: Date): { from: Date; to: Date } {
  const duration = to.getTime() - from.getTime()
  return {
    from: new Date(from.getTime() - duration),
    to: new Date(from.getTime()),
  }
}

export type ComparisonPeriod = "month" | "week" | "quarter" | "year"

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay()
  const diff = (day + 6) % 7
  const result = new Date(d)
  result.setDate(d.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDay(d: Date): Date {
  const result = new Date(d)
  result.setHours(23, 59, 59, 999)
  return result
}

function monthRange(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(year, month, 1),
    to: endOfDay(new Date(year, month + 1, 0)),
  }
}

/** Returns the [from, to] range for `period` anchored on `now`, plus the equivalent immediately-preceding period. */
export function getComparisonRanges(
  period: ComparisonPeriod,
  now: Date = new Date()
): { current: { from: Date; to: Date }; previous: { from: Date; to: Date } } {
  switch (period) {
    case "week": {
      const from = startOfWeekMonday(now)
      const to = endOfDay(new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6))
      const prevFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 7)
      const prevTo = endOfDay(new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1))
      return { current: { from, to }, previous: { from: prevFrom, to: prevTo } }
    }
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3)
      const from = new Date(now.getFullYear(), q * 3, 1)
      const to = endOfDay(new Date(now.getFullYear(), q * 3 + 3, 0))
      const prevFrom = new Date(now.getFullYear(), q * 3 - 3, 1)
      const prevTo = endOfDay(new Date(from.getTime() - 1))
      return { current: { from, to }, previous: { from: prevFrom, to: prevTo } }
    }
    case "year": {
      const from = new Date(now.getFullYear(), 0, 1)
      const to = endOfDay(new Date(now.getFullYear(), 11, 31))
      const prevFrom = new Date(now.getFullYear() - 1, 0, 1)
      const prevTo = endOfDay(new Date(now.getFullYear() - 1, 11, 31))
      return { current: { from, to }, previous: { from: prevFrom, to: prevTo } }
    }
    case "month":
    default: {
      const current = monthRange(now.getFullYear(), now.getMonth())
      const previous = monthRange(now.getFullYear(), now.getMonth() - 1)
      return { current, previous }
    }
  }
}

export interface ChannelComparisonItem {
  channel: string
  currRoi: number
  prevRoi: number
}

export function computeChannelComparison(
  current: ChannelMetrics[],
  previous: ChannelMetrics[]
): ChannelComparisonItem[] {
  const prevMap = new Map(previous.map((c) => [c.channel, c.roi]))
  return current
    .map((c) => ({
      channel: c.channel,
      currRoi: Math.round(c.roi),
      prevRoi: Math.round(prevMap.get(c.channel) ?? 0),
    }))
    .sort((a, b) => b.currRoi - a.currRoi)
}
