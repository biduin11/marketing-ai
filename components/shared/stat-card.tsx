import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * StatCard — единый «фирменный» стат-тайл продукта.
 * Источник паттерна: метрик-строки CJM (journey-view) и контент-плана (content-view),
 * вынесенные в один переиспользуемый компонент.
 *
 * Анатомия: компактная карточка (rounded-2xl border bg-card p-4 shadow-sm),
 * label сверху, крупное tabular-nums значение, sub снизу, приглушённая иконка справа.
 */
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  /** Тон значения — по умолчанию foreground. Используется для семантической подсветки. */
  tone?: "default" | "success" | "warning" | "danger"
  className?: string
}

const TONE_TEXT: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs leading-snug text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground/50" />}
      </div>
      <p className={cn("text-xl font-semibold tabular-nums", TONE_TEXT[tone])}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

/**
 * StatRow — адаптивная лента стат-тайлов.
 * cols задаёт максимальное число колонок на широких экранах (по умолчанию 4).
 */
export function StatRow({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode
  cols?: 3 | 4 | 5 | 6
  className?: string
}) {
  const colClass: Record<3 | 4 | 5 | 6, string> = {
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  }
  return (
    <div className={cn("grid gap-3", colClass[cols], className)}>
      {children}
    </div>
  )
}
