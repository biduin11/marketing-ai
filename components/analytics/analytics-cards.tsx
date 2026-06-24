import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MetricSummary } from "@/lib/services/analytics.service"

interface AnalyticsCardsProps {
  summary: MetricSummary
  deltas: Partial<Record<keyof MetricSummary, number>>
}

interface CardDef {
  label: string
  key: keyof MetricSummary
  format: (v: number) => string
}

const CARDS: CardDef[] = [
  {
    label: "Расходы",
    key: "totalSpend",
    format: (v) => `${v.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`,
  },
  {
    label: "Выручка",
    key: "totalRevenue",
    format: (v) => `${v.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`,
  },
  {
    label: "ROI",
    key: "roi",
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    label: "ROMI",
    key: "romi",
    format: (v) => `${v.toFixed(1)}%`,
  },
]

function DeltaBadge({ delta }: { delta: number | undefined }) {
  if (delta === undefined || delta === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3" />
        —
      </span>
    )
  }
  const positive = delta > 0
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        positive ? "text-[#16a34a]" : "text-[#dc2626]"
      )}
    >
      {positive ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {positive ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  )
}

export function AnalyticsCards({ summary, deltas }: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm"
        >
          <p className="mb-1 text-xs text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-semibold text-foreground">
            {card.format(summary[card.key] as number)}
          </p>
          <div className="mt-2">
            <DeltaBadge delta={deltas[card.key]} />
          </div>
        </div>
      ))}
    </div>
  )
}
