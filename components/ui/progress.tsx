import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<"div"> {
  /** Current value (0–100 if max not set, otherwise 0–max) */
  value: number
  /** Maximum value; defaults to 100 */
  max?: number
  /** Track height, defaults to 1.5 (h-1.5) */
  size?: "sm" | "default"
  /** Override the filled-bar classes (default: bg-foreground) */
  barClassName?: string
}

function Progress({
  value,
  max = 100,
  size = "default",
  className,
  barClassName,
  ...props
}: ProgressProps) {
  const pct = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        size === "sm" ? "h-1" : "h-1.5",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-foreground transition-all", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Progress }
