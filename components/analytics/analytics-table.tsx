import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { romiTone, TONE_CSS_VAR, TONE_CLASSES } from "@/lib/status-variants"
import type { ChannelMetrics } from "@/lib/services/analytics.service"

interface AnalyticsTableProps {
  channels: ChannelMetrics[]
}

// Map channel name → color badge
function getChannelBadge(name: string): { bg: string; text: string; abbr: string } {
  const n = name.toLowerCase()
  if (n.includes("яндекс директ") || n.includes("yandex direct"))
    return { bg: "#ff6c00", text: "#fff", abbr: "Я" }
  if (n.includes("google"))
    return { bg: "#4285f4", text: "#fff", abbr: "G" }
  if (n.includes("instagram") || n.includes("инстаграм"))
    return { bg: "#e1306c", text: "#fff", abbr: "IG" }
  if (n.includes("telegram") || n.includes("телеграм"))
    return { bg: "#0088cc", text: "#fff", abbr: "TG" }
  if (n.includes("vk") || n.includes("вк"))
    return { bg: "#0077ff", text: "#fff", abbr: "VK" }
  if (n.includes("youtube") || n.includes("ютуб"))
    return { bg: "#ff0000", text: "#fff", abbr: "YT" }
  if (n.includes("email") || n.includes("почта") || n.includes("рассылк"))
    return { bg: "#16a34a", text: "#fff", abbr: "✉" }
  if (n.includes("seo") || n.includes("органик"))
    return { bg: "#6b7280", text: "#fff", abbr: "S" }
  if (n.includes("яндекс карт") || n.includes("2гис"))
    return { bg: "#dc2626", text: "#fff", abbr: "ЯК" }
  return { bg: "#e5e7eb", text: "#374151", abbr: name.slice(0, 2).toUpperCase() }
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

function RomiBadge({ romi, maxRomi }: { romi: number; maxRomi: number }) {
  const pct = maxRomi > 0 ? Math.min((romi / maxRomi) * 100, 100) : 0
  const tone = romiTone(romi)
  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-xs font-semibold", TONE_CLASSES[tone].text)}>
        {fmt(romi)}%
      </span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: TONE_CSS_VAR[tone] }}
        />
      </div>
    </div>
  )
}

export function AnalyticsTable({ channels }: AnalyticsTableProps) {
  if (!channels.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted">
          <Inbox className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Нет данных по каналам</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Добавьте метрики, чтобы увидеть эффективность каждого канала.
        </p>
      </div>
    )
  }

  const maxRomi = Math.max(...channels.map((c) => c.romi), 1)

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-medium text-foreground">
          Эффективность по каналам
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-neutral-50">
              {["Канал", "Расходы", "Клики", "CTR", "Лиды", "CPL", "Продажи", "ROMI"].map(
                (h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-4 py-2.5 text-left text-xs font-medium text-muted-foreground",
                      h === "ROMI" && "min-w-[140px]"
                    )}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {channels.map((c) => {
              const badge = getChannelBadge(c.channel)
              return (
                <tr key={c.channel} className="hover:bg-neutral-50/60">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.abbr}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {c.channel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {fmt(c.spend)} ₽
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {c.clicks > 0 ? fmt(c.clicks) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {c.impressions > 0 ? `${c.ctr.toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {fmt(c.leads)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {c.cpl > 0 ? `${fmt(c.cpl)} ₽` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {fmt(c.sales)}
                  </td>
                  <td className="px-4 py-2.5">
                    <RomiBadge romi={c.romi} maxRomi={maxRomi} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
