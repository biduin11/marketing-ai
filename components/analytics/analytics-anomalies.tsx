import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react"
import type { AnomalyItem } from "@/lib/services/analytics.service"
import { cn } from "@/lib/utils"

const SEVERITY_CFG = {
  critical: {
    row: "border-red-100 bg-red-50",
    badge: "text-red-600",
    icon: AlertTriangle,
  },
  warning: {
    row: "border-amber-100 bg-amber-50",
    badge: "text-amber-600",
    icon: AlertTriangle,
  },
  positive: {
    row: "border-emerald-100 bg-emerald-50",
    badge: "text-emerald-600",
    icon: CheckCircle2,
  },
}

function fmtValue(v: number, metric: AnomalyItem["metric"]): string {
  if (metric === "Лиды/день") return v.toFixed(1)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} М ₽`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}К ₽`
  return `${v.toFixed(0)} ₽`
}

export function AnalyticsAnomalies({ anomalies }: { anomalies: AnomalyItem[] }) {
  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Отклонения</p>
        <span className="text-xs text-muted-foreground">3 дня vs предыдущие 7</span>
      </div>

      {anomalies.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <CheckCircle2 className="size-7 text-emerald-400" />
          <p className="text-sm font-medium text-foreground">Всё в норме</p>
          <p className="text-xs text-muted-foreground">
            Значимых отклонений не обнаружено
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {anomalies.map((a, i) => {
            const cfg = SEVERITY_CFG[a.severity]
            const TrendIcon = a.direction === "up" ? TrendingUp : TrendingDown
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                  cfg.row
                )}
              >
                <span className="shrink-0 rounded-md bg-white/80 px-2 py-0.5 text-xs font-medium text-foreground">
                  {a.channel}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {a.metric}
                </span>
                <div className={cn("flex shrink-0 items-center gap-1 text-xs font-semibold", cfg.badge)}>
                  <TrendIcon className="size-3.5" />
                  {a.delta > 0 ? "+" : ""}
                  {a.delta.toFixed(0)}%
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {fmtValue(a.current, a.metric)}{" "}
                  <span className="opacity-40">← {fmtValue(a.previous, a.metric)}</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
