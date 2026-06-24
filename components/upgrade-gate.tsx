import Link from "next/link"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpgradeGateProps {
  used: number
  limit: number
  className?: string
}

export function UpgradeGate({ used, limit, className }: UpgradeGateProps) {
  return (
    <div className={`rounded-2xl border border-[#eaeaea] bg-amber-50 p-5 ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d97706]/10">
          <Zap className="size-4 text-[#d97706]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Лимит исчерпан</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Использовано {used} из {limit} генераций в этом месяце (план Free).
            Перейдите на Pro для неограниченных генераций.
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
