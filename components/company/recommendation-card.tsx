import Link from "next/link"
import { AlertTriangle, ArrowRight, Info, Flame } from "lucide-react"
import type { Severity } from "@/lib/ai/schemas/companyAnalysis"
import { cn } from "@/lib/utils"

const severityConfig: Record<
  Severity,
  { label: string; color: string; icon: typeof Info }
> = {
  high: { label: "Критично", color: "text-danger bg-danger/10", icon: Flame },
  medium: {
    label: "Важно",
    color: "text-warning bg-warning/10",
    icon: AlertTriangle,
  },
  low: { label: "Желательно", color: "text-muted-foreground bg-muted", icon: Info },
}

interface RecommendationCardProps {
  title: string
  body: string
  severity: Severity
}

export function RecommendationCard({
  title,
  body,
  severity,
}: RecommendationCardProps) {
  const cfg = severityConfig[severity]
  const Icon = cfg.icon

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          cfg.color
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              cfg.color
            )}
          >
            {cfg.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        <Link
          href="/sprint"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-muted-foreground"
        >
          Открыть спринт для планирования
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  )
}
