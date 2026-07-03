import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { BarChart3 } from "lucide-react"
import type { ChannelMetrics, MetricSummary } from "@/lib/services/analytics.service"
import { EmptyState } from "@/components/empty-state"
import { Progress } from "@/components/ui/progress"

interface CampaignsTabProps {
  channels: ChannelMetrics[]
  summary: MetricSummary
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

function PerfTier({ romi }: { romi: number }) {
  if (romi > 700) return <span className="rounded border border-success/20 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">Отлично</span>
  if (romi > 300) return <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">Хорошо</span>
  if (romi > 0) return <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">Средне</span>
  return <span className="rounded border border-danger/20 bg-danger/10 px-1.5 py-0.5 text-[10px] font-medium text-danger">Убыток</span>
}

export function CampaignsTab({ channels, summary }: CampaignsTabProps) {
  if (!channels.length) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <EmptyState icon={BarChart3} title="Нет данных по кампаниям" description="Добавьте метрики по каналам, чтобы видеть эффективность кампаний." />
      </div>
    )
  }

  const totalSpend = channels.reduce((s, c) => s + c.spend, 0)

  const chartData = [...channels]
    .sort((a, b) => b.romi - a.romi)
    .map((c) => ({ name: c.channel.length > 12 ? c.channel.slice(0, 12) + "…" : c.channel, romi: Math.round(c.romi), spend: Math.round(c.spend) }))

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Всего каналов</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{channels.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Общий бюджет</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{fmt(totalSpend)} ₽</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Средний ROMI</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{fmt(summary.romi)}%</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Выручка</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{fmt(summary.totalRevenue)} ₽</p>
        </div>
      </div>

      {/* ROMI bar chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-medium text-foreground">ROMI по каналам</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={100} />
            <Tooltip formatter={(v: unknown) => [`${v}%`, "ROMI"]} contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="romi" fill="#111111" radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm font-medium text-foreground">Детализация по каналам</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                {["Канал", "Расходы", "Выручка", "Лиды", "CPL", "ROMI", "Оценка"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...channels].sort((a, b) => b.romi - a.romi).map((c) => {
                const budgetShare = totalSpend > 0 ? ((c.spend / totalSpend) * 100).toFixed(1) : "0"
                return (
                  <tr key={c.channel} className="hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground">{c.channel}</p>
                      <p className="text-[10px] text-muted-foreground">{budgetShare}% бюджета</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.spend)} ₽</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.revenue)} ₽</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.leads)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.cpl > 0 ? `${fmt(c.cpl)} ₽` : "—"}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: c.romi > 200 ? "#16a34a" : c.romi > 0 ? "#d97706" : "#dc2626" }}>
                      {fmt(c.romi)}%
                    </td>
                    <td className="px-4 py-3"><PerfTier romi={c.romi} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget allocation */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-medium text-foreground">Распределение бюджета</p>
        <div className="space-y-3">
          {[...channels].sort((a, b) => b.spend - a.spend).map((c) => {
            const pct = totalSpend > 0 ? (c.spend / totalSpend) * 100 : 0
            return (
              <div key={c.channel}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-foreground">{c.channel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{fmt(c.spend)} ₽</span>
                    <span className="w-10 text-right text-xs font-medium text-foreground">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <Progress value={pct} barClassName="bg-foreground" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
