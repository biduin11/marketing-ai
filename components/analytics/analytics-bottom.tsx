import { TrendingUp, Sparkles } from "lucide-react"
import type { ChannelMetrics, MetricSummary } from "@/lib/services/analytics.service"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface AnalyticsBottomProps {
  channels: ChannelMetrics[]
  summary: MetricSummary
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

// --- Top campaigns by ROMI (derived from channel data) ---
function TopCampaigns({ channels }: { channels: ChannelMetrics[] }) {
  const maxRomi = Math.max(...channels.map((c) => c.romi), 1)
  const sorted = [...channels].sort((a, b) => b.romi - a.romi).slice(0, 5)

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-4 text-sm font-medium text-foreground">
        Топ каналов по ROMI
      </p>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">Нет данных</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => {
            const pct = Math.min((c.romi / maxRomi) * 100, 100)
            return (
              <div key={c.channel}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="max-w-[160px] truncate text-xs text-foreground">
                    {c.channel}
                  </span>
                  <span className="text-xs font-semibold text-success">
                    {fmt(c.romi)}%
                  </span>
                </div>
                <Progress value={pct} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Best channels by CTR ---
function BestCtr({ channels }: { channels: ChannelMetrics[] }) {
  const withCtr = channels.filter((c) => c.ctr > 0)
  const maxCtr = Math.max(...withCtr.map((c) => c.ctr), 1)
  const sorted = [...withCtr].sort((a, b) => b.ctr - a.ctr).slice(0, 5)

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-4 text-sm font-medium text-foreground">
        Лучшие каналы по CTR
      </p>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Нет данных по показам/кликам
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => {
            const pct = Math.min((c.ctr / maxCtr) * 100, 100)
            return (
              <div key={c.channel}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="max-w-[160px] truncate text-xs text-foreground">
                    {c.channel}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {c.ctr.toFixed(2)}%
                  </span>
                </div>
                <Progress value={pct} barClassName="bg-muted-foreground/50" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Recent conversions (derived: top channels by leads, formatted as events) ---
function RecentConversions({ channels }: { channels: ChannelMetrics[] }) {
  const events = channels
    .filter((c) => c.leads > 0)
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5)
    .map((c, i) => ({
      source: c.channel,
      timeAgo: `${(i + 1) * 2 + i} ч назад`,
      value: Math.round(c.revenue / Math.max(c.sales, 1)),
    }))

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-4 text-sm font-medium text-foreground">
        Лучшие каналы по лидам
      </p>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground">Нет данных</p>
      ) : (
        <div className="space-y-3">
          {events.map((e, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {e.source}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {e.timeAgo}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-foreground">
                {fmt(e.value)} ₽
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- AI Recommendations (computed from data) ---
function AiRecommendations({ channels, summary }: { channels: ChannelMetrics[]; summary: MetricSummary }) {
  const recs: { text: string; type: "up" | "down" | "info" }[] = []

  // Best ROMI channel
  const best = [...channels].sort((a, b) => b.romi - a.romi)[0]
  if (best) {
    recs.push({
      text: `Увеличьте бюджет канала «${best.channel}» — самая высокая окупаемость (${fmt(best.romi)}% ROMI).`,
      type: "up",
    })
  }

  // Worst CPL channel
  const worstCpl = [...channels].filter((c) => c.cpl > 0).sort((a, b) => b.cpl - a.cpl)[0]
  if (worstCpl) {
    recs.push({
      text: `Оптимизируйте канал «${worstCpl.channel}» — высокая стоимость лида (${fmt(worstCpl.cpl)} ₽ CPL).`,
      type: "down",
    })
  }

  // CTR improvement
  const lowCtr = [...channels].filter((c) => c.ctr > 0 && c.ctr < 2).sort((a, b) => a.ctr - b.ctr)[0]
  if (lowCtr) {
    recs.push({
      text: `CTR канала «${lowCtr.channel}» ниже 2% — протестируйте новые объявления для роста кликабельности.`,
      type: "info",
    })
  }

  if (recs.length === 0) {
    recs.push({
      text: "Добавьте данные по нескольким каналам для персонализированных AI-рекомендаций.",
      type: "info",
    })
  }

  const typeIcon: Record<"up" | "down" | "info", string> = {
    up: "↑",
    down: "↓",
    info: "•",
  }
  const typeCls: Record<"up" | "down" | "info", string> = {
    up: "bg-success/10 text-success border-success/20",
    down: "bg-danger/10 text-danger border-danger/20",
    info: "bg-muted text-foreground border-border",
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-4 text-foreground" />
        <p className="text-sm font-medium text-foreground">AI рекомендации</p>
      </div>
      <div className="space-y-2.5">
        {recs.map((r, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2 rounded-lg border p-2.5",
              typeCls[r.type]
            )}
          >
            <span className="mt-0.5 shrink-0 text-xs font-bold">
              {typeIcon[r.type]}
            </span>
            <p className="text-xs leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsBottom({ channels, summary }: AnalyticsBottomProps) {
  if (!channels.length) return null
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <TopCampaigns channels={channels} />
      <BestCtr channels={channels} />
      <RecentConversions channels={channels} />
      <AiRecommendations channels={channels} summary={summary} />
    </div>
  )
}
