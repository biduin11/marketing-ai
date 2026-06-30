import { Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Zap } from "lucide-react"
import type { ChannelMetrics, MetricSummary } from "@/lib/services/analytics.service"
import { cn } from "@/lib/utils"

interface AiInsightsTabProps {
  summary: MetricSummary
  channels: ChannelMetrics[]
  healthScore: number
}

function fmt(v: number, dec = 0): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: dec })
}

interface Insight {
  type: "success" | "warning" | "danger" | "info"
  title: string
  body: string
  metric?: string
}

function generateInsights(summary: MetricSummary, channels: ChannelMetrics[]): Insight[] {
  const insights: Insight[] = []

  // ROMI analysis
  if (summary.romi > 500) {
    insights.push({ type: "success", title: "Отличная окупаемость рекламы", body: `ROMI ${fmt(summary.romi)}% значительно превышает среднерыночный показатель. Масштабируйте успешные каналы.`, metric: `ROMI ${fmt(summary.romi)}%` })
  } else if (summary.romi > 100) {
    insights.push({ type: "info", title: "ROMI выше среднего", body: `ROMI ${fmt(summary.romi)}% — реклама прибыльна. Есть возможности для оптимизации и роста.`, metric: `ROMI ${fmt(summary.romi)}%` })
  } else if (summary.romi > 0) {
    insights.push({ type: "warning", title: "Низкий ROMI — требует внимания", body: `ROMI ${fmt(summary.romi)}% указывает на недостаточную эффективность. Проверьте конверсию посадочных страниц и офферы.`, metric: `ROMI ${fmt(summary.romi)}%` })
  } else {
    insights.push({ type: "danger", title: "Рекламные расходы убыточны", body: "Текущие затраты превышают полученную выручку. Необходима срочная оптимизация или пауза убыточных каналов.", metric: `ROMI ${fmt(summary.romi)}%` })
  }

  // CPL analysis
  if (summary.cpl > 0) {
    const cplStatus = summary.cpl < 300 ? "success" : summary.cpl < 1000 ? "info" : "warning"
    insights.push({
      type: cplStatus,
      title: cplStatus === "success" ? "Низкая стоимость лида" : cplStatus === "info" ? "Стоимость лида в норме" : "Высокая стоимость лида",
      body: `CPL ${fmt(summary.cpl)} ₽. ${cplStatus === "success" ? "Отличный результат — масштабируйте генерацию лидов." : cplStatus === "info" ? "Ищите возможности снизить CPL через улучшение таргетинга." : "Оптимизируйте воронку — улучшите качество трафика и конверсию на сайте."}`,
      metric: `CPL ${fmt(summary.cpl)} ₽`,
    })
  }

  // Best channel
  const best = [...channels].sort((a, b) => b.romi - a.romi)[0]
  if (best) {
    insights.push({ type: "success", title: `«${best.channel}» — лучший канал`, body: `ROMI ${fmt(best.romi)}% — самая высокая окупаемость среди всех каналов. Рекомендуем увеличить бюджет на 20-30%.`, metric: `ROMI ${fmt(best.romi)}%` })
  }

  // Worst channel
  const worst = channels.filter((c) => c.romi < 0)[0]
  if (worst) {
    insights.push({ type: "danger", title: `«${worst.channel}» убыточен`, body: `ROMI ${fmt(worst.romi)}% — канал приносит убытки. Рассмотрите паузу или полный пересмотр стратегии по этому каналу.`, metric: `ROMI ${fmt(worst.romi)}%` })
  }

  // Channel diversification
  if (channels.length === 1) {
    insights.push({ type: "warning", title: "Монозависимость — риск", body: "Все бюджеты в одном канале — высокий риск. Добавьте 2-3 дополнительных канала для стабильности.", metric: "1 канал" })
  } else if (channels.length >= 5) {
    insights.push({ type: "success", title: "Хорошая диверсификация каналов", body: `${channels.length} активных каналов снижают зависимость от единственного источника трафика.`, metric: `${channels.length} каналов` })
  }

  // Leads volume
  if (summary.totalLeads > 500) {
    insights.push({ type: "success", title: "Высокий объём лидогенерации", body: `${fmt(summary.totalLeads)} лидов — хороший поток. Сосредоточьтесь на качестве квалификации и скорости обработки.`, metric: `${fmt(summary.totalLeads)} лидов` })
  } else if (summary.totalLeads < 20 && summary.totalLeads > 0) {
    insights.push({ type: "warning", title: "Мало лидов", body: `Только ${summary.totalLeads} лидов — недостаточно для стабильного потока продаж. Рекомендуется усиление лидогенерации.`, metric: `${summary.totalLeads} лидов` })
  }

  return insights.slice(0, 6)
}

interface Recommendation {
  priority: "high" | "medium" | "low"
  action: string
  expected: string
  effort: string
}

function generateRecommendations(summary: MetricSummary, channels: ChannelMetrics[]): Recommendation[] {
  const recs: Recommendation[] = []
  const best = [...channels].sort((a, b) => b.romi - a.romi)[0]
  const worst = [...channels].filter((c) => c.leads > 0).sort((a, b) => b.cpl - a.cpl)[0]
  const lowCtr = channels.find((c) => c.ctr > 0 && c.ctr < 1.5)

  if (best) recs.push({ priority: "high", action: `Увеличить бюджет канала «${best.channel}» на 25%`, expected: `+${Math.round(best.leads * 0.25)} лидов/мес`, effort: "Низкие" })
  if (worst && worst.cpl > 0) recs.push({ priority: "high", action: `Снизить CPL в «${worst.channel}» через A/B-тест объявлений`, expected: `-${Math.round(worst.cpl * 0.2)} ₽ CPL`, effort: "Средние" })
  if (lowCtr) recs.push({ priority: "medium", action: `Обновить креативы в «${lowCtr.channel}» — CTR ${lowCtr.ctr.toFixed(2)}%`, expected: "CTR +0.5–1%", effort: "Средние" })
  if (channels.length < 4) recs.push({ priority: "medium", action: "Добавить новый канал для диверсификации", expected: "+15–20% охвата", effort: "Высокие" })
  recs.push({ priority: "low", action: "Настроить автоматические отчёты по недельным метрикам", expected: "Экономия 2ч/нед", effort: "Низкие" })
  return recs.slice(0, 4)
}

const INSIGHT_CFG = {
  success: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50", iconCls: "text-emerald-600", titleCls: "text-emerald-800" },
  info: { icon: Zap, cls: "border-blue-200 bg-blue-50", iconCls: "text-blue-600", titleCls: "text-blue-800" },
  warning: { icon: AlertCircle, cls: "border-orange-200 bg-orange-50", iconCls: "text-orange-600", titleCls: "text-orange-800" },
  danger: { icon: TrendingDown, cls: "border-red-200 bg-red-50", iconCls: "text-[#dc2626]", titleCls: "text-[#dc2626]" },
} as const

const PRIORITY_CFG = {
  high: { label: "Высокий", cls: "bg-red-50 text-[#dc2626] border-red-200" },
  medium: { label: "Средний", cls: "bg-orange-50 text-[#d97706] border-orange-200" },
  low: { label: "Низкий", cls: "bg-neutral-100 text-muted-foreground border-neutral-200" },
} as const

export function AiInsightsTab({ summary, channels, healthScore }: AiInsightsTabProps) {
  const insights = generateInsights(summary, channels)
  const recommendations = generateRecommendations(summary, channels)

  const scoreColor = healthScore >= 70 ? "#16a34a" : healthScore >= 40 ? "#d97706" : "#dc2626"
  const scoreLabel = healthScore >= 70 ? "Отлично" : healthScore >= 40 ? "Требует внимания" : "Критично"

  // SVG arc for health gauge
  const r = 52, cx = 64, cy = 64
  const startAngle = -Math.PI * 0.75
  const endAngle = startAngle + (Math.PI * 1.5 * healthScore) / 100
  const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
  const largeArc = healthScore > 66 ? 1 : 0
  const totalX1 = cx + r * Math.cos(startAngle), totalY1 = cy + r * Math.sin(startAngle)
  const totalEndAngle = startAngle + Math.PI * 1.5
  const totalX2 = cx + r * Math.cos(totalEndAngle), totalY2 = cy + r * Math.sin(totalEndAngle)

  return (
    <div className="space-y-5">
      {/* Health score + insights grid */}
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Health gauge */}
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="size-4 text-foreground" />
            <p className="text-sm font-medium text-foreground">Здоровье маркетинга</p>
          </div>
          <p className="mb-5 text-xs text-muted-foreground">Интегральная оценка эффективности</p>

          <div className="flex flex-col items-center">
            <svg width={128} height={90} viewBox="0 0 128 90">
              {/* Background arc */}
              <path d={`M ${totalX1} ${totalY1} A ${r} ${r} 0 1 1 ${totalX2} ${totalY2}`} fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
              {/* Colored arc */}
              {healthScore > 0 && (
                <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round" />
              )}
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="700" fill={scoreColor}>{healthScore}</text>
              <text x={cx} y={cy + 22} textAnchor="middle" fontSize="10" fill="#6b7280">{scoreLabel}</text>
            </svg>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { label: "ROMI", ok: summary.romi > 200 },
              { label: "Диверсификация", ok: channels.length >= 3 },
              { label: "Объём лидов", ok: summary.totalLeads >= 50 },
              { label: "Стоимость лида", ok: summary.cpl > 0 && summary.cpl < 1000 },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={cn("size-2 shrink-0 rounded-full", ok ? "bg-[#16a34a]" : "bg-[#dc2626]")} />
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={cn("ml-auto text-xs font-medium", ok ? "text-[#16a34a]" : "text-[#dc2626]")}>{ok ? "OK" : "Внимание"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key insights */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Ключевые наблюдения</p>
          {insights.map((ins, i) => {
            const cfg = INSIGHT_CFG[ins.type]
            const Icon = cfg.icon
            return (
              <div key={i} className={cn("flex gap-3 rounded-xl border p-4", cfg.cls)}>
                <Icon className={cn("mt-0.5 size-4 shrink-0", cfg.iconCls)} />
                <div className="min-w-0">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm font-medium", cfg.titleCls)}>{ins.title}</p>
                    {ins.metric && (
                      <span className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground">{ins.metric}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{ins.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Priority recommendations */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-foreground" />
          <p className="text-sm font-medium text-foreground">Приоритетные рекомендации</p>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const cfg = PRIORITY_CFG[rec.priority]
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-[#eaeaea] p-4">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{rec.action}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium", cfg.cls)}>{cfg.label} приоритет</span>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">Ожидаемый эффект: {rec.expected}</span>
                    <span className="rounded border border-[#eaeaea] bg-neutral-50 px-1.5 py-0.5 text-[10px] text-muted-foreground">Усилия: {rec.effort}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
