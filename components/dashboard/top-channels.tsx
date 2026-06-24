import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChannelMetrics } from "@/lib/services/analytics.service"

interface TopChannelsProps {
  channels: ChannelMetrics[]
}

function RoiBadge({ roi }: { roi: number }) {
  const cls =
    roi > 100
      ? "bg-green-50 text-[#16a34a]"
      : roi > 0
      ? "bg-amber-50 text-[#d97706]"
      : "bg-red-50 text-[#dc2626]"
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
      {roi.toFixed(1)}%
    </span>
  )
}

export function TopChannels({ channels }: TopChannelsProps) {
  const top = channels.slice(0, 3)

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3.5">
        <p className="text-sm font-medium text-foreground">Топ каналы</p>
        <Link
          href="/analytics"
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Все каналы <ChevronRight className="size-3" />
        </Link>
      </div>

      {top.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          Нет данных. <Link href="/analytics" className="underline">Добавить метрики →</Link>
        </p>
      ) : (
        <div className="divide-y divide-[#eaeaea]">
          {top.map((c, i) => (
            <div key={c.channel} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground">{c.channel}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {c.revenue.toLocaleString("ru-RU")} ₽
                </span>
                <RoiBadge roi={c.roi} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
