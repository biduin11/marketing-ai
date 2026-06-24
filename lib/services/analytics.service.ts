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
}

export interface TimeSeriesPoint {
  date: string
  spend: number
  revenue: number
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
      }
    })
    .sort((a, b) => b.roi - a.roi)
}

export function computeTimeSeries(metrics: Metric[]): TimeSeriesPoint[] {
  const map = new Map<string, { spend: number; revenue: number }>()
  for (const m of metrics) {
    const key = m.date instanceof Date
      ? m.date.toISOString().slice(0, 10)
      : String(m.date).slice(0, 10)
    const existing = map.get(key) ?? { spend: 0, revenue: 0 }
    map.set(key, {
      spend: existing.spend + m.spend,
      revenue: existing.revenue + m.revenue,
    })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))
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
