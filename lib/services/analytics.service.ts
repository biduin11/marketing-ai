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
