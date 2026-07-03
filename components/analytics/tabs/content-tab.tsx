"use client"

import { useMemo } from "react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Eye, MousePointerClick, UserCheck, TrendingUp } from "lucide-react"
import type { ChannelMetrics, TimeSeriesPoint } from "@/lib/services/analytics.service"
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

interface ContentTabProps {
  channels: ChannelMetrics[]
  timeSeries: TimeSeriesPoint[]
  contentPlan: ContentPlan | null
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

const CHANNEL_COLORS = [
  "#111111", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#6b7280",
]

export function ContentTab({ channels, timeSeries, contentPlan }: ContentTabProps) {
  if (!channels.length) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <EmptyState
          icon={TrendingUp}
          title="Нет данных по контенту"
          description="Добавьте метрики по каналам, чтобы видеть аналитику эффективности контента."
        />
      </div>
    )
  }

  const totalImpressions = channels.reduce((s, c) => s + c.impressions, 0)
  const totalClicks = channels.reduce((s, c) => s + c.clicks, 0)
  const totalLeads = channels.reduce((s, c) => s + c.leads, 0)
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const bestChannel = [...channels].sort((a, b) => b.impressions - a.impressions)[0]

  // Planned posts by platform from contentPlan
  const planStats = useMemo(() => {
    if (!contentPlan?.calendar) return null
    const byPlatform: Record<string, number> = {}
    for (const item of contentPlan.calendar) {
      const p = item.platform ?? "other"
      byPlatform[p] = (byPlatform[p] ?? 0) + 1
    }
    return byPlatform
  }, [contentPlan])

  const reachData = [...channels]
    .filter((c) => c.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions)
    .map((c, i) => ({
      name: c.channel.length > 14 ? c.channel.slice(0, 14) + "…" : c.channel,
      impressions: c.impressions,
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))

  const ctrData = [...channels]
    .filter((c) => c.ctr > 0)
    .sort((a, b) => b.ctr - a.ctr)
    .map((c, i) => ({
      name: c.channel.length > 14 ? c.channel.slice(0, 14) + "…" : c.channel,
      ctr: parseFloat(c.ctr.toFixed(2)),
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))

  const leadsData = [...channels]
    .filter((c) => c.leads > 0)
    .sort((a, b) => b.leads - a.leads)
    .map((c, i) => ({
      name: c.channel.length > 14 ? c.channel.slice(0, 14) + "…" : c.channel,
      leads: c.leads,
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))

  const reachTimeSeries = timeSeries.map((p) => ({
    dateLabel: formatDate(p.date),
    impressions: p.impressions,
    clicks: p.clicks,
  }))

  // Content efficiency: leads per 1000 impressions
  const efficiency = channels
    .filter((c) => c.impressions > 0)
    .map((c, i) => ({
      channel: c.channel,
      lpi: (c.leads / c.impressions) * 1000,
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))
    .sort((a, b) => b.lpi - a.lpi)

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Eye, label: "Охват (показы)", value: fmt(totalImpressions) },
          { icon: MousePointerClick, label: "Клики", value: fmt(totalClicks) },
          { icon: TrendingUp, label: "Средний CTR", value: `${avgCtr.toFixed(2)}%` },
          { icon: UserCheck, label: "Лиды с контента", value: fmt(totalLeads) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Icon className="size-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            {label === "Охват (показы)" && bestChannel && (
              <p className="mt-1 text-[10px] text-muted-foreground">Лидер: {bestChannel.channel}</p>
            )}
          </div>
        ))}
      </div>

      {/* Reach over time */}
      {reachTimeSeries.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-foreground">Динамика охвата</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={reachTimeSeries} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={44}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}К` : String(v)} />
              <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="impressions" name="Показы" stroke="#111111" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="clicks" name="Клики" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reach by channel + CTR by channel */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Reach by channel */}
        {reachData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-foreground">Охват по каналам</p>
            <ResponsiveContainer width="100%" height={Math.max(160, reachData.length * 38)}>
              <BarChart data={reachData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}К` : String(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={(v: unknown) => [fmt(v as number), "Показы"]} contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="impressions" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#111111" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CTR by channel */}
        {ctrData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-foreground">CTR по каналам</p>
            <div className="space-y-3">
              {ctrData.map((d) => (
                <div key={d.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-foreground">{d.name}</span>
                    <span className="text-xs font-semibold text-foreground">{d.ctr}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min((d.ctr / Math.max(...ctrData.map((x) => x.ctr), 1)) * 100, 100)}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Leads by channel + Content efficiency */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Leads by channel */}
        {leadsData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-foreground">Лиды по каналам</p>
            <div className="space-y-3">
              {leadsData.map((d) => (
                <div key={d.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-foreground">{d.name}</span>
                    <span className="text-xs font-semibold text-foreground">{fmt(d.leads)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(d.leads / Math.max(...leadsData.map((x) => x.leads), 1)) * 100}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content efficiency */}
        {efficiency.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-1 text-sm font-medium text-foreground">Эффективность контента</p>
            <p className="mb-4 text-xs text-muted-foreground">Лидов на 1 000 показов</p>
            <div className="space-y-3">
              {efficiency.map((d) => {
                const maxLpi = Math.max(...efficiency.map((x) => x.lpi), 0.001)
                return (
                  <div key={d.channel}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-foreground">{d.channel}</span>
                      <span className="text-xs font-semibold text-foreground">{d.lpi.toFixed(2)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(d.lpi / maxLpi) * 100}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content plan volume cross-reference */}
      {planStats && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-1 text-sm font-medium text-foreground">Контент-план vs каналы</p>
          <p className="mb-4 text-xs text-muted-foreground">Запланировано публикаций по платформам из последнего контент-плана</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(planStats).sort((a, b) => b[1] - a[1]).map(([platform, count]) => (
              <div key={platform} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5">
                <span className="text-xs font-medium capitalize text-foreground">{platform}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel performance table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm font-medium text-foreground">Детализация каналов</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                {["Канал", "Показы", "Клики", "CTR", "Лиды", "Эфф. (лид/1К)", "ROMI"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...channels].sort((a, b) => b.impressions - a.impressions).map((c) => {
                const lpi = c.impressions > 0 ? (c.leads / c.impressions) * 1000 : 0
                return (
                  <tr key={c.channel} className="hover:bg-muted/60">
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{c.channel}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.impressions > 0 ? fmt(c.impressions) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.clicks > 0 ? fmt(c.clicks) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{fmt(c.leads)}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{lpi > 0 ? lpi.toFixed(2) : "—"}</td>
                    <td className="px-4 py-3 text-xs font-semibold"
                      style={{ color: c.romi > 200 ? "#16a34a" : c.romi > 0 ? "#d97706" : "#dc2626" }}>
                      {fmt(c.romi)}%
                    </td>
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
