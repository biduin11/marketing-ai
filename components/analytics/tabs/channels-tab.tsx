"use client"

import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { BarChart3 } from "lucide-react"
import type { ChannelMetrics, TimeSeriesPoint } from "@/lib/services/analytics.service"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

interface ChannelsTabProps {
  channels: ChannelMetrics[]
  channelTimeSeries: Record<string, TimeSeriesPoint[]>
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <span className="text-xs text-muted-foreground">—</span>
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 64, h = 24
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const CHANNEL_COLORS = [
  "#111111", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#6b7280",
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

export function ChannelsTab({ channels, channelTimeSeries }: ChannelsTabProps) {
  const [selected, setSelected] = useState<string | null>(null)

  if (!channels.length) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <EmptyState icon={BarChart3} title="Нет данных по каналам" description="Добавьте метрики, чтобы видеть аналитику каналов." />
      </div>
    )
  }

  const selectedChannel = selected ? channels.find((c) => c.channel === selected) : null
  const selectedSeries = selected ? (channelTimeSeries[selected] ?? []) : []

  return (
    <div className="space-y-5">
      {/* Channel cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((c, i) => {
          const color = CHANNEL_COLORS[i % CHANNEL_COLORS.length]
          const series = channelTimeSeries[c.channel] ?? []
          const spendValues = series.map((p) => p.spend)
          const isSelected = selected === c.channel
          return (
            <button
              key={c.channel}
              onClick={() => setSelected(isSelected ? null : c.channel)}
              className={cn(
                "rounded-2xl border p-4 text-left shadow-sm transition-all",
                isSelected ? "border-foreground bg-neutral-50" : "border-[#eaeaea] bg-white hover:border-neutral-300"
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-foreground">{c.channel}</span>
                </div>
                <Sparkline values={spendValues} color={color} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Расходы</p>
                  <p className="text-sm font-medium text-foreground">{fmt(c.spend)} ₽</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">ROMI</p>
                  <p className="text-sm font-medium" style={{ color: c.romi > 200 ? "#16a34a" : c.romi > 0 ? "#d97706" : "#dc2626" }}>
                    {fmt(c.romi)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Лиды</p>
                  <p className="text-sm font-medium text-foreground">{fmt(c.leads)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">CPL</p>
                  <p className="text-sm font-medium text-foreground">{c.cpl > 0 ? `${fmt(c.cpl)} ₽` : "—"}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected channel detail */}
      {selectedChannel && (
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-foreground">
            {selectedChannel.channel} · детальная аналитика
          </p>

          {/* Metrics row */}
          <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              { label: "Расходы", value: `${fmt(selectedChannel.spend)} ₽` },
              { label: "Выручка", value: `${fmt(selectedChannel.revenue)} ₽` },
              { label: "ROMI", value: `${fmt(selectedChannel.romi)}%` },
              { label: "Лиды", value: fmt(selectedChannel.leads) },
              { label: "CPL", value: selectedChannel.cpl > 0 ? `${fmt(selectedChannel.cpl)} ₽` : "—" },
              { label: "CTR", value: selectedChannel.ctr > 0 ? `${selectedChannel.ctr.toFixed(2)}%` : "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Time series */}
          {selectedSeries.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={selectedSeries.map((p) => ({ ...p, dateLabel: formatDate(p.date) }))} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}К` : String(v)} />
                <Tooltip contentStyle={{ border: "1px solid #eaeaea", borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="spend" name="Расходы" stroke="#111111" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="revenue" name="Выручка" stroke="#16a34a" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="leads" name="Лиды" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Недостаточно данных для графика</p>
          )}
        </div>
      )}

      {/* ROMI comparison bar */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-medium text-foreground">Сравнение ROMI по каналам</p>
        {(() => {
          const maxRomi = Math.max(...channels.map((c) => c.romi), 1)
          return (
            <div className="space-y-3">
              {[...channels].sort((a, b) => b.romi - a.romi).map((c, i) => {
                const pct = (c.romi / maxRomi) * 100
                const color = CHANNEL_COLORS[channels.indexOf(c) % CHANNEL_COLORS.length]
                return (
                  <div key={c.channel}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-foreground">{c.channel}</span>
                      <span className="text-xs font-semibold" style={{ color: c.romi > 200 ? "#16a34a" : "#6b7280" }}>{fmt(c.romi)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
