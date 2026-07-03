"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ChannelMetrics } from "@/lib/services/analytics.service"

interface AnalyticsDonutsProps {
  channels: ChannelMetrics[]
}

const DONUT_COLORS = [
  "#111111",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#6b7280",
]

function DonutSection({
  title,
  data,
}: {
  title: string
  data: { label: string; value: number; color: string }[]
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-3 text-sm font-medium text-foreground">{title}</p>
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <ResponsiveContainer width={88} height={88}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={26}
                outerRadius={40}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: unknown) => [
                  `${(((v as number) / total) * 100).toFixed(1)}%`,
                ]}
                contentStyle={{
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {data.slice(0, 5).map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0"
            return (
              <div key={d.label} className="flex items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                  {d.label}
                </span>
                <span className="shrink-0 text-[11px] font-medium text-foreground">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AnalyticsDonuts({ channels }: AnalyticsDonutsProps) {
  const totalSpend = channels.reduce((s, c) => s + c.spend, 0)
  if (totalSpend === 0) return null

  const spendData = channels.slice(0, 8).map((c, i) => ({
    label: c.channel,
    value: c.spend,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  return (
    <DonutSection title="Распределение расходов по каналам" data={spendData} />
  )
}
