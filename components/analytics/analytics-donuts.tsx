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
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
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
                  border: "1px solid #eaeaea",
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

const TRAFFIC_TYPES = [
  { label: "Платный поиск", value: 38.6 },
  { label: "Соцсети", value: 25.4 },
  { label: "Прямые заходы", value: 16.2 },
  { label: "Органический поиск", value: 9.8 },
  { label: "Реферальный трафик", value: 6.4 },
  { label: "Email", value: 3.6 },
]

const DEVICES = [
  { label: "Мобильные", value: 56.7 },
  { label: "Десктоп", value: 38.2 },
  { label: "Планшеты", value: 5.1 },
]

const GEO = [
  { label: "Россия", value: 81.9 },
  { label: "Казахстан", value: 7.7 },
  { label: "Беларусь", value: 3.4 },
  { label: "Украина", value: 1.4 },
  { label: "Другие", value: 5.6 },
]

export function AnalyticsDonuts({ channels }: AnalyticsDonutsProps) {
  // Real data: spend distribution by channel
  const totalSpend = channels.reduce((s, c) => s + c.spend, 0)
  const spendData = channels.slice(0, 8).map((c, i) => ({
    label: c.channel,
    value: c.spend,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  const trafficData = TRAFFIC_TYPES.map((t, i) => ({
    ...t,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  const deviceData = DEVICES.map((d, i) => ({
    ...d,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  // Geography — simple list instead of map SVG
  const geoData = GEO.map((g, i) => ({
    ...g,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {totalSpend > 0 ? (
        <DonutSection title="Распределение расходов" data={spendData} />
      ) : (
        <DonutSection title="Распределение расходов" data={trafficData} />
      )}
      <DonutSection title="Типы трафика" data={trafficData} />
      <DonutSection title="Устройства" data={deviceData} />

      {/* Geography — styled separately */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-foreground">
          География лидов
        </p>
        <div className="space-y-2">
          {geoData.map((g) => (
            <div key={g.label} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: g.color }}
              />
              <span className="flex-1 text-xs text-muted-foreground">
                {g.label}
              </span>
              <div className="w-20 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${g.value}%`,
                    backgroundColor: g.color,
                  }}
                />
              </div>
              <span className="w-10 text-right text-xs font-medium text-foreground">
                {g.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
