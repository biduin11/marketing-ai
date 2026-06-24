import { cn } from "@/lib/utils"
import type { ChannelMetrics } from "@/lib/services/analytics.service"

interface AnalyticsTableProps {
  channels: ChannelMetrics[]
}

function fmt(v: number, decimals = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: decimals })
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

export function AnalyticsTable({ channels }: AnalyticsTableProps) {
  if (!channels.length) {
    return (
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Нет данных по каналам. Добавьте метрики.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
      <div className="border-b border-[#eaeaea] px-6 py-4">
        <h3 className="text-sm font-medium text-foreground">Эффективность каналов</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#eaeaea] bg-neutral-50">
              {["Канал", "Расходы", "Выручка", "ROI", "CPL", "CPC", "CPM"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {channels.map((c) => (
              <tr key={c.channel} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-foreground">{c.channel}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmt(c.spend)} ₽</td>
                <td className="px-4 py-3 text-muted-foreground">{fmt(c.revenue)} ₽</td>
                <td className="px-4 py-3">
                  <RoiBadge roi={c.roi} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.cpl > 0 ? `${fmt(c.cpl, 0)} ₽` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.cpc > 0 ? `${fmt(c.cpc, 2)} ₽` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.cpm > 0 ? `${fmt(c.cpm, 2)} ₽` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
