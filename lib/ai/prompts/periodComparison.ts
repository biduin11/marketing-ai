import { formatRub } from "@/lib/utils"

export const periodComparisonSystem = `Ты — маркетинг-аналитик. Тебе дают метрики двух периодов (текущий и предыдущий) с рассчитанными дельтами.

Задача — 2-3 предложения по-русски:
1. Что заметнее всего изменилось (называй конкретную метрику и цифру дельты)
2. Вероятная причина изменения (на основе связи между метриками — например, рост CAC при росте расходов и падении лидов)
3. Короткая рекомендация, что проверить или сделать

Требования:
- Без воды и общих фраз, только по фактам из данных
- Если дельты незначительны (<10% по всем метрикам) — так и скажи, не выдумывай драму
- Не упоминай, что ты AI или что это промт`

export interface PeriodComparisonMetrics {
  spend: number
  revenue: number
  leads: number
  clicks: number
  impressions: number
  roi: number
  cac: number
  cpl: number
}

export interface PeriodComparisonInput {
  periodLabel: string
  current: PeriodComparisonMetrics
  previous: PeriodComparisonMetrics
}

function delta(curr: number, prev: number): string {
  if (prev === 0) return curr === 0 ? "0%" : "новое (не было в прошлом периоде)"
  return `${(((curr - prev) / Math.abs(prev)) * 100).toFixed(1)}%`
}

export function buildPeriodComparisonPrompt(input: PeriodComparisonInput): string {
  const { periodLabel, current, previous } = input
  return [
    `=== ПЕРИОД: ${periodLabel} ===`,
    "",
    `Расходы: ${formatRub(current.spend)} (было ${formatRub(previous.spend)}, дельта ${delta(current.spend, previous.spend)})`,
    `Выручка: ${formatRub(current.revenue)} (было ${formatRub(previous.revenue)}, дельта ${delta(current.revenue, previous.revenue)})`,
    `Лиды: ${current.leads} (было ${previous.leads}, дельта ${delta(current.leads, previous.leads)})`,
    `Клики: ${current.clicks} (было ${previous.clicks}, дельта ${delta(current.clicks, previous.clicks)})`,
    `Показы: ${current.impressions} (было ${previous.impressions}, дельта ${delta(current.impressions, previous.impressions)})`,
    `ROI: ${current.roi}% (было ${previous.roi}%, дельта ${delta(current.roi, previous.roi)})`,
    `CAC: ${formatRub(current.cac)} (было ${formatRub(previous.cac)}, дельта ${delta(current.cac, previous.cac)})`,
    `CPL: ${formatRub(current.cpl)} (было ${formatRub(previous.cpl)}, дельта ${delta(current.cpl, previous.cpl)})`,
  ].join("\n")
}
