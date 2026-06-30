"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Share2 } from "lucide-react"
import type { AttributionData, ChannelMetrics } from "@/lib/services/analytics.service"
import { EmptyState } from "@/components/empty-state"

interface AttributionTabProps {
  attribution: AttributionData[]
  channels: ChannelMetrics[]
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

const COLORS = [
  "#111111", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#6b7280",
]

// Simulate linear attribution: equal credit across all channels
function computeLinearAttribution(channels: ChannelMetrics[]): AttributionData[] {
  const n = channels.length
  if (!n) return []
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0)
  const totalLeads = channels.reduce((s, c) => s + c.leads, 0)
  return channels.map((c) => ({
    channel: c.channel,
    revenueShare: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 100 / n,
    leadsShare: totalLeads > 0 ? (c.leads / totalLeads) * 100 : 100 / n,
    revenue: totalRevenue / n,
    leads: Math.round(totalLeads / n),
  })).sort((a, b) => b.revenueShare - a.revenueShare)
}

export function AttributionTab({ attribution, channels }: AttributionTabProps) {
  if (!channels.length || !attribution.length) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <EmptyState icon={Share2} title="Нет данных для атрибуции" description="Добавьте метрики по нескольким каналам, чтобы видеть атрибуцию." />
      </div>
    )
  }

  const linear = computeLinearAttribution(channels)
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0)

  const pieData = attribution.map((a, i) => ({
    name: a.channel,
    value: parseFloat(a.revenueShare.toFixed(1)),
    color: COLORS[i % COLORS.length],
    revenue: a.revenue,
  }))

  return (
    <div className="space-y-5">
      {/* Model explanation */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Last Touch", desc: "Весь кредит последнему касанию", active: true },
          { label: "First Touch", desc: "Весь кредит первому касанию", active: false },
          { label: "Linear", desc: "Кредит равномерно всем касаниям", active: false },
        ].map(({ label, desc, active }) => (
          <div key={label} className={`rounded-2xl border p-4 shadow-sm ${active ? "border-foreground bg-neutral-50" : "border-[#eaeaea] bg-white opacity-60"}`}>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            {active && <span className="mt-2 inline-block rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-white">Текущая модель</span>}
          </div>
        ))}
      </div>

      {/* Revenue attribution donut + table */}
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Donut */}
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-foreground">Атрибуция выручки (Last Touch)</p>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: unknown) => [`${v}%`, "Доля выручки"]}
                  contentStyle={{ border: "1px solid #eaeaea", borderRadius: 8, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 w-full space-y-1.5">
              {pieData.slice(0, 6).map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 truncate text-xs text-foreground">{d.name}</span>
                  <span className="text-xs font-medium text-foreground">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attribution table */}
        <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
          <div className="border-b border-[#eaeaea] px-5 py-3">
            <p className="text-sm font-medium text-foreground">Сравнение моделей атрибуции</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#eaeaea] bg-neutral-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Канал</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Last Touch</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Linear</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Выручка</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Лиды</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {attribution.map((a, i) => {
                  const lin = linear.find((l) => l.channel === a.channel)
                  const color = COLORS[i % COLORS.length]
                  const diff = lin ? a.revenueShare - lin.revenueShare : 0
                  return (
                    <tr key={a.channel} className="hover:bg-neutral-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-xs font-medium text-foreground">{a.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                            <div className="h-full rounded-full" style={{ width: `${a.revenueShare}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-xs font-medium text-foreground">{a.revenueShare.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{lin?.revenueShare.toFixed(1) ?? "—"}%</span>
                          {diff !== 0 && (
                            <span className={`text-[10px] font-medium ${diff > 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                              {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(a.revenue)} ₽</td>
                      <td className="px-4 py-3 text-xs text-foreground">{fmt(a.leads)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t border-[#eaeaea] bg-neutral-50">
                <tr>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">Итого</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">100%</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">100%</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{fmt(totalRevenue)} ₽</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">
                    {fmt(channels.reduce((s, c) => s + c.leads, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Leads attribution */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-medium text-foreground">Атрибуция лидов</p>
        <div className="space-y-3">
          {attribution.map((a, i) => (
            <div key={a.channel}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-foreground">{a.channel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{fmt(a.leads)} лидов</span>
                  <span className="w-10 text-right text-xs font-medium text-foreground">{a.leadsShare.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full" style={{ width: `${a.leadsShare}%`, backgroundColor: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
