import { cn } from "@/lib/utils"
import type { UsageInfo } from "@/lib/services/usage.service"

interface UsageBarProps {
  usage: UsageInfo
}

export function UsageBar({ usage }: UsageBarProps) {
  if (usage.isUnlimited) {
    return (
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Расход AI
        </p>
        <p className="text-sm text-foreground">
          <span className="font-semibold">{usage.generationsUsed}</span> генераций в этом месяце
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Без ограничений (план Pro)</p>
      </div>
    )
  }

  const pct = Math.min((usage.generationsUsed / usage.generationsLimit) * 100, 100)
  const barColor =
    pct >= 90
      ? "bg-[#dc2626]"
      : pct >= 70
      ? "bg-[#d97706]"
      : "bg-[#16a34a]"

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Расход AI
        </p>
        <span className="text-xs text-muted-foreground">
          {usage.generationsUsed} / {usage.generationsLimit}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Генераций использовано в этом месяце (план Free)
      </p>
    </div>
  )
}
