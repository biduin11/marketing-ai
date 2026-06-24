import type { MetricSummary } from "@/lib/services/analytics.service"

interface MetricsSummaryProps {
  summary: MetricSummary | null
}

function fmt(value: number, suffix = ""): string {
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}${suffix}`
}

const METRICS = [
  {
    key: "roi" as const,
    label: "ROI",
    format: (v: number) => `${fmt(v)}%`,
    hint: "за 30 дней",
  },
  {
    key: "romi" as const,
    label: "ROMI",
    format: (v: number) => `${fmt(v)}%`,
    hint: "за 30 дней",
  },
  {
    key: "cac" as const,
    label: "CAC",
    format: (v: number) => `${fmt(v)} ₽`,
    hint: "стоимость клиента",
  },
  {
    key: "ltv" as const,
    label: "LTV",
    format: (v: number) => `${fmt(v)} ₽`,
    hint: "ценность клиента",
  },
]

export function MetricsSummary({ summary }: MetricsSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {METRICS.map(({ key, label, format, hint }) => (
        <div
          key={key}
          className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm"
        >
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {summary ? format(summary[key]) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      ))}
    </div>
  )
}
