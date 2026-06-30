import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Users, UserCheck, DollarSign, Target } from "lucide-react"
import type { ChannelMetrics, MetricSummary, TimeSeriesPoint } from "@/lib/services/analytics.service"
import type { AudienceSegments, BuyerPersona } from "@/lib/ai/schemas/audience"
import { EmptyState } from "@/components/empty-state"

interface AudienceTabProps {
  summary: MetricSummary
  channels: ChannelMetrics[]
  timeSeries: TimeSeriesPoint[]
  audienceSegments: AudienceSegments | null
  buyerPersona: BuyerPersona | null
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

const CHANNEL_COLORS = [
  "#111111", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#6b7280",
]

export function AudienceTab({ summary, channels, timeSeries, audienceSegments, buyerPersona }: AudienceTabProps) {
  if (!channels.length) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <EmptyState
          icon={Users}
          title="Нет данных по аудитории"
          description="Добавьте метрики по каналам, чтобы видеть аналитику аудитории."
        />
      </div>
    )
  }

  const totalReach = channels.reduce((s, c) => s + c.impressions, 0)
  const estimatedVisitors = Math.round(summary.totalClicks * 0.667)
  const leadRate = estimatedVisitors > 0 ? (summary.totalLeads / estimatedVisitors) * 100 : 0

  // Audience acquisition cost by channel
  const cplData = [...channels]
    .filter((c) => c.cpl > 0)
    .sort((a, b) => a.cpl - b.cpl)
    .map((c, i) => ({
      name: c.channel.length > 14 ? c.channel.slice(0, 14) + "…" : c.channel,
      cpl: Math.round(c.cpl),
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))

  // Audience reach by channel
  const reachByChannel = [...channels]
    .filter((c) => c.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions)
    .map((c, i) => ({
      name: c.channel.length > 14 ? c.channel.slice(0, 14) + "…" : c.channel,
      reach: c.impressions,
      leads: c.leads,
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))

  // Audience quality: leads / impressions ratio
  const qualityData = channels
    .filter((c) => c.impressions > 0)
    .map((c, i) => ({
      channel: c.channel,
      quality: parseFloat(((c.leads / c.impressions) * 1000).toFixed(2)),
      leads: c.leads,
      reach: c.impressions,
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    }))
    .sort((a, b) => b.quality - a.quality)

  const reachTimeSeries = timeSeries.map((p) => ({
    dateLabel: formatDate(p.date),
    impressions: p.impressions,
    leads: p.leads,
  }))

  // Segment names for context (from audienceSegments)
  const segmentNames = audienceSegments?.segments?.map((s) => s.name) ?? []
  const personaName = buyerPersona?.personas?.[0]?.name

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users, label: "Охват аудитории", value: fmt(totalReach), sub: "показов за период" },
          { icon: Target, label: "Уникальных визитов", value: fmt(estimatedVisitors), sub: "оценка" },
          { icon: UserCheck, label: "Lead Rate", value: `${leadRate.toFixed(2)}%`, sub: "визит → лид" },
          { icon: DollarSign, label: "Средний CPL", value: summary.cpl > 0 ? `${fmt(summary.cpl)} ₽` : "—", sub: "стоимость лида" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Icon className="size-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Audience reach over time */}
      {reachTimeSeries.length > 1 && (
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-foreground">Динамика охвата аудитории</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={reachTimeSeries} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={44}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}К` : String(v)} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ border: "1px solid #eaeaea", borderRadius: 8, fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="impressions" name="Охват" stroke="#111111" strokeWidth={1.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="leads" name="Лиды" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reach by channel + CPL comparison */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Reach by channel */}
        {reachByChannel.length > 0 && (
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-foreground">Охват по каналам</p>
            <ResponsiveContainer width="100%" height={Math.max(160, reachByChannel.length * 38)}>
              <BarChart data={reachByChannel} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}К` : String(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={(v: unknown) => [fmt(v as number), "Показы"]} contentStyle={{ border: "1px solid #eaeaea", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="reach" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#111111" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CPL by channel */}
        {cplData.length > 0 && (
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
            <p className="mb-1 text-sm font-medium text-foreground">Стоимость привлечения (CPL)</p>
            <p className="mb-4 text-xs text-muted-foreground">Ниже — лучше</p>
            <div className="space-y-3">
              {cplData.map((d) => {
                const maxCpl = Math.max(...cplData.map((x) => x.cpl), 1)
                const pct = (d.cpl / maxCpl) * 100
                return (
                  <div key={d.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-foreground">{d.name}</span>
                      <span className="text-xs font-semibold text-foreground">{fmt(d.cpl)} ₽</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Audience quality by channel */}
      {qualityData.length > 0 && (
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-1 text-sm font-medium text-foreground">Качество аудитории по каналам</p>
          <p className="mb-4 text-xs text-muted-foreground">Лидов на 1 000 показов — чем выше, тем качественнее аудитория канала</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {qualityData.map((d) => {
              const maxQ = Math.max(...qualityData.map((x) => x.quality), 0.001)
              const pct = (d.quality / maxQ) * 100
              const tier = d.quality > maxQ * 0.66 ? "Высокое" : d.quality > maxQ * 0.33 ? "Среднее" : "Низкое"
              const tierCls = tier === "Высокое" ? "text-[#16a34a] bg-emerald-50 border-emerald-200" : tier === "Среднее" ? "text-[#d97706] bg-orange-50 border-orange-200" : "text-[#dc2626] bg-red-50 border-red-200"
              return (
                <div key={d.channel} className="rounded-xl border border-[#eaeaea] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{d.channel}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${tierCls}`}>{tier}</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{d.quality}</p>
                  <p className="mb-2 text-[10px] text-muted-foreground">лидов/1К показов</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{fmt(d.leads)} лид · {fmt(d.reach)} показов</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Audience context from artifacts */}
      {(segmentNames.length > 0 || personaName) && (
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-1 text-sm font-medium text-foreground">Контекст аудитории</p>
          <p className="mb-3 text-xs text-muted-foreground">Из последнего анализа аудитории — для сопоставления с метриками</p>
          <div className="flex flex-wrap gap-2">
            {personaName && (
              <span className="rounded-lg border border-[#eaeaea] bg-neutral-50 px-3 py-1.5 text-xs font-medium text-foreground">
                Персона: {personaName}
              </span>
            )}
            {segmentNames.map((name) => (
              <span key={name} className="rounded-lg border border-[#eaeaea] bg-neutral-50 px-3 py-1.5 text-xs text-foreground">
                {name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Для детальной информации по сегментам и персонам перейдите в раздел{" "}
            <a href="/audience" className="underline hover:text-foreground">Аудитория</a>.
          </p>
        </div>
      )}
    </div>
  )
}
