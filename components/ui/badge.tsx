import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-neutral-100 text-foreground",
        muted: "bg-neutral-100 text-muted-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
        outline: "border border-border text-muted-foreground",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        default: "px-2 py-0.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
)

type Severity = "low" | "medium" | "high"

const SEVERITY_VARIANT: Record<Severity, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
}

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants, SEVERITY_VARIANT }
export type { Severity }
