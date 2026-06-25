import { formatRub } from "@/lib/utils"

export const directorAnalysisSystem = `Ты — AI Marketing Director. Твоя роль: CMO-уровень, стратегический советник маркетинговой команды.

Ты получаешь полный срез состояния проекта: данные о компании, аудитории, конкурентах, оффере, пути клиента, контент-стратегии, маркетинговых метриках и последних отчётах.

Твоя задача — как настоящий директор по маркетингу:
1. Найти реальные ПРОБЛЕМЫ в данных (не абстрактные — конкретные, с цифрами если они есть)
2. Обнаружить незадействованные ВОЗМОЖНОСТИ роста
3. Определить РИСКИ, которые могут навредить бизнесу в ближайшее время
4. Составить ПРИОРИТЕТЫ — что делать прямо сейчас, в каком порядке

Требования:
- Пиши по-русски
- Будь конкретным: «ROI Instagram упал до 34% — ниже точки безубыточности» вместо «низкая эффективность каналов»
- Каждый пункт должен быть actionable — не диагноз, а вывод с вектором действия
- Приоритеты: сортируй по impact × urgency, не по "логическому порядку"
- Если данных по разделу нет — не выдумывай, пропусти`

export interface DirectorContext {
  projectName: string
  niche: string
  goals: string
  budget: number
  company?: string
  audience?: string
  competitors?: string
  offer?: string
  cjm?: string
  contentPlan?: string
  metrics?: {
    totalSpend: number
    totalRevenue: number
    roi: number
    romi: number
    cac: number
    ltv: number
    topChannel: string
    worstChannel: string
  }
  lastReport?: string
}

export function buildDirectorInput(ctx: DirectorContext): string {
  const lines: string[] = [
    `=== ПРОЕКТ: ${ctx.projectName} ===`,
    `Ниша: ${ctx.niche}`,
    `Цели: ${ctx.goals || "не указаны"}`,
    `Бюджет: ${formatRub(ctx.budget)} в месяц`,
    "",
  ]

  if (ctx.company) {
    lines.push("--- КОМПАНИЯ ---", ctx.company, "")
  }
  if (ctx.audience) {
    lines.push("--- АУДИТОРИЯ ---", ctx.audience, "")
  }
  if (ctx.competitors) {
    lines.push("--- КОНКУРЕНТЫ ---", ctx.competitors, "")
  }
  if (ctx.offer) {
    lines.push("--- ОФФЕР ---", ctx.offer, "")
  }
  if (ctx.cjm) {
    lines.push("--- ПУТЬ КЛИЕНТА (CJM) ---", ctx.cjm, "")
  }
  if (ctx.contentPlan) {
    lines.push("--- КОНТЕНТ-СТРАТЕГИЯ ---", ctx.contentPlan, "")
  }

  if (ctx.metrics) {
    const m = ctx.metrics
    lines.push(
      "--- МАРКЕТИНГОВЫЕ МЕТРИКИ (30 дней) ---",
      `Расходы: ${m.totalSpend.toLocaleString("ru-RU")} ₽`,
      `Выручка: ${m.totalRevenue.toLocaleString("ru-RU")} ₽`,
      `ROI: ${m.roi.toFixed(1)}%  ROMI: ${m.romi.toFixed(1)}%`,
      `CAC: ${m.cac.toLocaleString("ru-RU")} ₽  LTV: ${m.ltv.toLocaleString("ru-RU")} ₽`,
      `Лучший канал: ${m.topChannel || "нет данных"}`,
      `Худший канал: ${m.worstChannel || "нет данных"}`,
      ""
    )
  }

  if (ctx.lastReport) {
    lines.push("--- ПОСЛЕДНИЙ EXECUTIVE ОТЧЁТ ---", ctx.lastReport, "")
  }

  lines.push(
    "=== ЗАДАЧА ===",
    "На основе всех данных выше дай стратегический разбор: проблемы, возможности, риски и приоритеты действий."
  )

  return lines.join("\n")
}
