import type { CompanyCard } from "@/lib/ai/prompts/companyAnalysis"
import type { Horizon } from "@/lib/ai/schemas/strategy"

export const strategySystem = `Ты — Principal-уровня маркетинговый директор.
Твоя задача — построить чёткую маркетинговую стратегию на заданный горизонт планирования.

Правила:
- Всё на русском языке, конкретно и измеримо.
- Обязательно включи KPI: Выручка, Лиды, Конверсия, CAC — с реалистичными целевыми значениями для горизонта.
- Разбей период на недели/этапы с понятным фокусом на каждый.
- Дорожная карта (roadmap) — конкретные задачи с датами/сроками.
- Учитывай бюджет и нишу компании. Стратегия должна быть выполнимой.
- Отвечай ТОЛЬКО через предоставленный инструмент (structured output). Никакого текста вне инструмента.`

const horizonLabel: Record<Horizon, string> = {
  30: "30 дней",
  90: "90 дней",
  180: "180 дней (полгода)",
  365: "1 год",
}

export function buildStrategyInput(
  card: CompanyCard,
  horizon: Horizon
): string {
  return `Построй маркетинговую стратегию на горизонт ${horizonLabel[horizon]} для компании:

Название: ${card.name}
Ниша / отрасль: ${card.niche ?? "не указана"}
Сайт: ${card.website ?? "не указан"}
Регионы работы: ${card.regions.length ? card.regions.join(", ") : "не указаны"}
Продукты / услуги: ${card.products.length ? card.products.join(", ") : "не указаны"}
Конкуренты: ${card.competitors.length ? card.competitors.join(", ") : "не указаны"}
Маркетинговый бюджет (в месяц, USD): ${card.budget ?? "не указан"}
Цели и задачи: ${card.goals ?? "не указаны"}

Горизонт планирования: ${horizonLabel[horizon]}. Установи horizon = ${horizon}.`
}
