"use client"

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

interface AnalyticsChartProps {
  data: TimeSeriesPoint[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

function formatRub(value: number): string {
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-[#eaeaea] bg-white">
        <p className="text-sm text-muted-foreground">Нет данных для графика</p>
      </div>
    )
  }

  const chartData = data.map((p) => ({
    ...p,
    dateLabel: formatDate(p.date),
  }))

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-foreground">Динамика расходов и выручки</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}к` : String(v)
            }
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value, name) => [
              formatRub((value as number) ?? 0),
              (name as string) === "revenue" ? "Выручка" : "Расходы",
            ]}
            labelFormatter={(label) => String(label ?? "")}
            contentStyle={{
              border: "1px solid #eaeaea",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value: string) =>
              value === "revenue" ? "Выручка" : "Расходы"
            }
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#111111"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="spend"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
