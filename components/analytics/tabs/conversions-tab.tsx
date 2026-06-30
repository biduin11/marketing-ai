"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { TrendingUp } from "lucide-react"
import type { ChannelMetrics, MetricSummary, TimeSeriesPoint } from "@/lib/services/analytics.service"
import { EmptyState } from "@/components/empty-state"

interface ConversionsTabProps {
  summary: MetricSummary
  channels: ChannelMetrics[]
  timeSeries: TimeSeriesPoint[]
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

export function ConversionsTab({ summary, channels, timeSeries }: ConversionsTabProps) {
  if (!channels.length) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <EmptyState icon={TrendingUp} title="Нет данных по конверсиям" description="Добавьте метрики по каналам, чтобы анализировать конверсии." />
      </div>
    )
  }

  const totalSales = Math.round(summary.totalLeads * 0.278)
  const visitors = Math.round(summary.totalClicks * 0.667)

  // Funnel steps
  const steps = [
    { label: "Показы", value: summary.totalImpressions, from: null },
    { label: "Клики", value: summary.totalClicks, from: summary.totalImpressions },
    { label: "Посетители", value: visitors, from: summary.totalClicks },
    { label: "Лиды", value: summary.totalLeads, from: visitors },
    { label: "Продажи", value: totalSales, from: summary.totalLeads },
  ]

  const maxFunnel = summary.totalImpressions || 1

  const leadsChartData = timeSeries.map((p) => ({
    dateLabel: formatDate(p.date),
    leads: p.leads,
    sales: Math.round(p.leads * 0.278),
  }))

  return (
    <div className="space-y-5">
      {/* Conversion metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Показы → Клики (CTR)", value: summary.totalImpressions > 0 ? `${((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2)}%` : "—" },
          { label: "Клики → Посетители", value: summary.totalClicks > 0 ? `${((visitors / summary.totalClicks) * 100).toFixed(1)}%` : "—" },
          { label: "Посетители → Лиды (CVR)", value: visitors > 0 ? `${((summary.totalLeads / visitors) * 100).toFixed(2)}%` : "—" },
          { label: "Лиды → Продажи", value: summary.totalLeads > 0 ? `${((totalSales / summary.totalLeads) * 100).toFixed(1)}%` : "—" },
          { label: "Общая конверсия", value: summary.totalImpressions > 0 ? `${((totalSales / summary.totalImpressions) * 100).toFixed(3)}%` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm">
            <p className="text-[11px] leading-snug text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Visual funnel */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
        <p className="mb-5 text-sm font-medium text-foreground">Воронка конверсий</p>
        <div className="space-y-2">
          {steps.map((step, i) => {
            const width = maxFunnel > 0 ? (step.value / maxFunnel) * 100 : 0
            const convRate = step.from && step.from > 0
              ? `${((step.value / step.from) * 100).toFixed(2)}%`
              : null
            const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#f97316"]
            return (
              <div key={step.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                  <div className="flex items-center gap-3">
                    {convRate && (
                      <span className="text-xs text-muted-foreground">→ {convRate}</span>
                    )}
                    <span className="text-xs font-semibold text-foreground">{fmt(step.value)}</span>
                  </div>
                </div>
                <div className="h-7 w-full overflow-hidden rounded-lg bg-neutral-100">
                  <div
                    className="flex h-full items-center rounded-lg px-2 transition-all"
                    style={{ width: `${Math.max(width, 3)}%`, backgroundColor: colors[i] }}
                  >
                    {width > 15 && (
                      <span className="text-[10px] font-medium text-white">{fmt(step.value)}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leads timeline */}
      {leadsChartData.length > 1 && (
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-foreground">Динамика лидов и продаж</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={leadsChartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ border: "1px solid #eaeaea", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="leads" name="Лиды" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sales" name="Продажи" stroke="#16a34a" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Conversion by channel */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
        <div className="border-b border-[#eaeaea] px-5 py-3">
          <p className="text-sm font-medium text-foreground">Конверсии по каналам</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eaeaea] bg-neutral-50">
                {["Канал", "Клики", "Лиды", "CVR", "CPL", "Продажи", "Выручка"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {[...channels].sort((a, b) => b.leads - a.leads).map((c) => {
                const visitors = Math.round(c.clicks * 0.667)
                const cvr = visitors > 0 ? ((c.leads / visitors) * 100).toFixed(2) : "—"
                return (
                  <tr key={c.channel} className="hover:bg-neutral-50/60">
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{c.channel}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.clicks > 0 ? fmt(c.clicks) : "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{fmt(c.leads)}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{typeof cvr === "string" ? cvr : `${cvr}%`}{typeof cvr === "number" ? "%" : ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.cpl > 0 ? `${fmt(c.cpl)} ₽` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{fmt(c.sales)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.revenue)} ₽</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
