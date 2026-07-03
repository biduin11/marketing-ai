import { cn } from "@/lib/utils"

interface AnalyticsBudgetPacingProps {
  monthlyBudget: number
  monthSpend: number
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function fmtMoney(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} М ₽`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}К ₽`
  return `${Math.round(v).toLocaleString("ru-RU")} ₽`
}

export function AnalyticsBudgetPacing({ monthlyBudget, monthSpend }: AnalyticsBudgetPacingProps) {
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth())
  const daysLeft = daysInMonth - dayOfMonth

  const monthProgress = dayOfMonth / daysInMonth
  const expectedSpend = monthlyBudget * monthProgress

  const spentPct = monthlyBudget > 0 ? (monthSpend / monthlyBudget) * 100 : 0
  const expectedPct = monthProgress * 100
  const pacingDelta = spentPct - expectedPct

  type Status = "on_track" | "over" | "under"
  const status: Status =
    Math.abs(pacingDelta) <= 15 ? "on_track" : pacingDelta > 0 ? "over" : "under"

  const STATUS_CFG: Record<Status, { label: string; labelColor: string; barColor: string; deltaColor: string }> = {
    on_track: { label: "По плану",   labelColor: "text-success", barColor: "bg-foreground",      deltaColor: "text-success" },
    over:     { label: "Перерасход", labelColor: "text-warning",   barColor: "bg-warning/100",   deltaColor: "text-warning"  },
    under:    { label: "Недорасход", labelColor: "text-foreground",    barColor: "bg-muted0",    deltaColor: "text-foreground"   },
  }
  const cfg = STATUS_CFG[status]

  const monthName = now.toLocaleDateString("ru-RU", { month: "long" })

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Пейсинг бюджета</p>
        <span className={cn("text-xs font-medium", cfg.labelColor)}>{cfg.label}</span>
      </div>
      <p className="mb-4 text-xs capitalize text-muted-foreground">
        {monthName} · {daysInMonth} дней · день {dayOfMonth}
      </p>

      {/* Progress bar */}
      <div className="relative mb-1 h-2.5 w-full overflow-visible rounded-full bg-muted">
        <div
          className={cn("absolute left-0 top-0 h-full rounded-full", cfg.barColor)}
          style={{ width: `${Math.min(spentPct, 100)}%` }}
        />
        {/* Expected pace marker */}
        <div
          className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-muted-foreground/50"
          style={{ left: `${Math.min(expectedPct, 99)}%` }}
        />
      </div>
      <div className="mb-4 flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="absolute" style={{ left: `calc(${Math.min(expectedPct, 99)}% + 1.25rem)` }}>
          план
        </span>
        <span>{fmtMoney(monthlyBudget)}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[13px] font-semibold text-foreground">{fmtMoney(monthSpend)}</p>
          <p className="text-[11px] text-muted-foreground">потрачено</p>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">{fmtMoney(expectedSpend)}</p>
          <p className="text-[11px] text-muted-foreground">ожидалось</p>
        </div>
        <div>
          <p className={cn("text-[13px] font-semibold", cfg.deltaColor)}>
            {pacingDelta > 0 ? "+" : ""}
            {pacingDelta.toFixed(1)}%
          </p>
          <p className="text-[11px] text-muted-foreground">отклонение</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        Остаток:{" "}
        <span className="font-medium text-foreground">
          {fmtMoney(Math.max(0, monthlyBudget - monthSpend))}
        </span>
        {" · "}осталось{" "}
        <span className="font-medium text-foreground">{daysLeft} дн.</span>
      </div>
    </div>
  )
}
