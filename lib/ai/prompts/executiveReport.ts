import type { MetricSummary, ChannelMetrics } from "@/lib/services/analytics.service"

export const executiveReportSystem = `Ты — опытный CMO-аналитик. Пишешь исполнительный отчёт для руководителя компании на основе маркетинговых данных.

Требования:
- Язык: русский, деловой стиль
- Headline: 1 предложение — самый важный вывод
- Summary: 2-3 абзаца, конкретные цифры, причинно-следственный анализ
- Wins: конкретные достижения с цифрами
- Risks: реальные проблемы, не абстрактные
- Recommendations: действия, а не советы — «Увеличить бюджет X на Y%», «Остановить кампанию Z»
- NextPeriodFocus: топ-приоритеты с обоснованием
- Используй только предоставленные данные, не придумывай метрики
- Отвечай исключительно через инструмент save_executive_report`

export interface ReportInput {
  period: string
  periodType: "weekly" | "monthly" | "quarterly"
  summary: MetricSummary
  channels: ChannelMetrics[]
  projectName: string
  niche: string | null
}

export function buildExecutiveReportInput(input: ReportInput): string {
  const { period, periodType, summary, channels, projectName, niche } = input

  const periodLabel = {
    weekly: "неделю",
    monthly: "месяц",
    quarterly: "квартал",
  }[periodType]

  const fmt = (n: number, decimals = 0) =>
    n.toLocaleString("ru-RU", { maximumFractionDigits: decimals })

  const channelRows = channels
    .map(
      (c) =>
        `  • ${c.channel}: расходы ${fmt(c.spend)} ₽, выручка ${fmt(c.revenue)} ₽, ROI ${fmt(c.roi, 1)}%, CPL ${fmt(c.cpl, 0)} ₽, CPC ${fmt(c.cpc, 2)} ₽`
    )
    .join("\n")

  return `
Компания: ${projectName}
Ниша: ${niche ?? "не указана"}
Период: ${period} (${periodLabel})

СВОДНЫЕ МЕТРИКИ:
- Расходы: ${fmt(summary.totalSpend)} ₽
- Выручка: ${fmt(summary.totalRevenue)} ₽
- ROI: ${fmt(summary.roi, 1)}%
- ROMI: ${fmt(summary.romi, 1)}%
- CAC / CPL: ${fmt(summary.cpl, 0)} ₽
- CPC: ${fmt(summary.cpc, 2)} ₽
- CPM: ${fmt(summary.cpm, 2)} ₽
- LTV (средний): ${fmt(summary.ltv, 0)} ₽
- Лидов: ${fmt(summary.totalLeads)}
- Кликов: ${fmt(summary.totalClicks)}
- Показов: ${fmt(summary.totalImpressions)}

ЭФФЕКТИВНОСТЬ ПО КАНАЛАМ:
${channelRows || "  Данные по каналам отсутствуют"}

Составь исполнительный отчёт за ${periodLabel}.
`.trim()
}
