"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { TimeSeriesPoint } from "@/lib/services/analytics.service"
import { ChevronDown } from "lucide-react"

interface AnalyticsChartProps {
  data: TimeSeriesPoint[]
}

type Grouping = "day" | "week"

const LINES = [
  { key: "impressions", label: "Показы", color: "#8b5cf6", yAxis: "left" },
  { key: "clicks", label: "Клики", color: "#3b82f6", yAxis: "left" },
  { key: "leads", label: "Лиды", color: "#10b981", yAxis: "left" },
  { key: "sales", label: "Продажи", color: "#f97316", yAxis: "left" },
  { key: "spend", label: "Расходы", color: "#111111", yAxis: "right" },
] as const

function weekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const start = new Date(year, 0, 1)
  const week = Math.ceil(
    ((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  )
  return `${year}-W${week.toString().padStart(2, "0")}`
}

function aggregateByWeek(
  data: TimeSeriesPoint[]
): (TimeSeriesPoint & { dateLabel: string; sales: number })[] {
  const map = new Map<
    string,
    { spend: number; revenue: number; clicks: number; leads: number; impressions: number; count: number }
  >()
  for (const p of data) {
    const k = weekKey(p.date)
    const ex = map.get(k) ?? { spend: 0, revenue: 0, clicks: 0, leads: 0, impressions: 0, count: 0 }
    map.set(k, {
      spend: ex.spend + p.spend,
      revenue: ex.revenue + p.revenue,
      clicks: ex.clicks + p.clicks,
      leads: ex.leads + p.leads,
      impressions: ex.impressions + p.impressions,
      count: ex.count + 1,
    })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      date: key,
      dateLabel: key,
      spend: v.spend,
      revenue: v.revenue,
      clicks: v.clicks,
      leads: v.leads,
      impressions: v.impressions,
      sales: Math.round(v.leads * 0.278),
    }))
}

function formatDate(dateStr: string): string {
  if (dateStr.includes("W")) return dateStr
  const d = new Date(dateStr)
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

function fmtTick(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}М`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}К`
  return String(v)
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [grouping, setGrouping] = useState<Grouping>("day")
  const [open, setOpen] = useState(false)

  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">Нет данных для графика</p>
      </div>
    )
  }

  const chartData =
    grouping === "week"
      ? aggregateByWeek(data)
      : data.map((p) => ({
          ...p,
          dateLabel: formatDate(p.date),
          sales: Math.round(p.leads * 0.278),
        }))

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Динамика по всем каналам
        </h3>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            {grouping === "day" ? "По дням" : "По неделям"}
            <ChevronDown className="size-3" />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-border bg-card shadow-md">
              {(["day", "week"] as Grouping[]).map((g) => (
                <button
                  key={g}
                  onClick={() => { setGrouping(g); setOpen(false) }}
                  className="block w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
                >
                  {g === "day" ? "По дням" : "По неделям"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tickFormatter={fmtTick}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={fmtTick}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 11,
              padding: "6px 10px",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            formatter={(value: string) =>
              LINES.find((l) => l.key === value)?.label ?? value
            }
          />
          {LINES.map((line) => (
            <Line
              key={line.key}
              yAxisId={line.yAxis}
              type="monotone"
              dataKey={line.key}
              name={line.key}
              stroke={line.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
