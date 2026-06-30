"use client"

import { cn } from "@/lib/utils"
import type { MetricSummary, TimeSeriesPoint } from "@/lib/services/analytics.service"

interface AnalyticsCardsProps {
  summary: MetricSummary
  deltas: Partial<Record<string, number>>
  timeSeries: TimeSeriesPoint[]
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 80
  const h = 28
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline
        points={pts}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DeltaBadge({ delta }: { delta?: number }) {
  if (delta === undefined) return null
  const positive = delta >= 0
  return (
    <span
      className={cn(
        "text-xs font-medium",
        positive ? "text-[#16a34a]" : "text-[#dc2626]"
      )}
    >
      {positive ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
    </span>
  )
}

type CardKey =
  | "totalSpend"
  | "totalImpressions"
  | "totalClicks"
  | "ctr"
  | "totalLeads"
  | "cpl"
  | "sales"
  | "totalRevenue"
  | "romi"

interface CardDef {
  label: string
  key: CardKey
  format: (v: number) => string
  sparkKey: keyof TimeSeriesPoint
  color: string
}

const CARDS: CardDef[] = [
  {
    label: "Расходы",
    key: "totalSpend",
    format: (v) => `${v.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`,
    sparkKey: "spend",
    color: "#111111",
  },
  {
    label: "Показы",
    key: "totalImpressions",
    format: (v) => v.toLocaleString("ru-RU"),
    sparkKey: "impressions",
    color: "#8b5cf6",
  },
  {
    label: "Клики",
    key: "totalClicks",
    format: (v) => v.toLocaleString("ru-RU"),
    sparkKey: "clicks",
    color: "#3b82f6",
  },
  {
    label: "CTR",
    key: "ctr",
    format: (v) => `${v.toFixed(2)}%`,
    sparkKey: "clicks",
    color: "#06b6d4",
  },
  {
    label: "Лиды",
    key: "totalLeads",
    format: (v) => v.toLocaleString("ru-RU"),
    sparkKey: "leads",
    color: "#10b981",
  },
  {
    label: "Стоимость лида (CPL)",
    key: "cpl",
    format: (v) => `${v.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`,
    sparkKey: "spend",
    color: "#f59e0b",
  },
  {
    label: "Продажи",
    key: "sales",
    format: (v) => v.toLocaleString("ru-RU"),
    sparkKey: "leads",
    color: "#f97316",
  },
  {
    label: "Выручка",
    key: "totalRevenue",
    format: (v) => `${v.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`,
    sparkKey: "revenue",
    color: "#16a34a",
  },
  {
    label: "ROMI",
    key: "romi",
    format: (v) => `${v.toFixed(0)}%`,
    sparkKey: "revenue",
    color: "#8b5cf6",
  },
]

function getValue(summary: MetricSummary, key: CardKey): number {
  switch (key) {
    case "sales":
      return Math.round(summary.totalLeads * 0.278)
    case "ctr":
      return summary.totalImpressions > 0
        ? (summary.totalClicks / summary.totalImpressions) * 100
        : 0
    default:
      return (summary as unknown as Record<string, number>)[key] ?? 0
  }
}

export function AnalyticsCards({
  summary,
  deltas,
  timeSeries,
}: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
      {CARDS.map((card) => {
        const value = getValue(summary, card.key)
        const sparkValues = timeSeries.map((p) => p[card.sparkKey] as number)
        const delta = deltas[card.key]
        const compLabel = "vs пред. период"
        return (
          <div
            key={card.key}
            className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm"
          >
            <p className="mb-1 text-[11px] leading-snug text-muted-foreground">
              {card.label}
            </p>
            <p className="text-base font-semibold leading-tight text-foreground">
              {card.format(value)}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <DeltaBadge delta={delta} />
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
              {compLabel}
            </p>
            <div className="mt-2">
              <Sparkline values={sparkValues} color={card.color} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
