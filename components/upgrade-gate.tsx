import Link from "next/link"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpgradeGateProps {
  reason?: string
  title?: string
  className?: string
  /** @deprecated kept for backward compat */
  used?: number
  /** @deprecated kept for backward compat */
  limit?: number
}

export function UpgradeGate({
  reason,
  title = "Нужен Pro",
  className,
}: UpgradeGateProps) {
  return (
    <div className={`rounded-2xl border border-border bg-warning/10 p-5 ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/10">
          <Zap className="size-4 text-warning" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {reason ?? "На плане Free доступен 1 проект с неограниченными AI-генерациями. Перейдите на Pro чтобы вести несколько проектов."}
          </p>
          <Link href="/settings">
            <Button size="sm" className="mt-3">
              <Zap className="size-3.5" />
              Перейти на Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
