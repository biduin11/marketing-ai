import type { Project } from "@prisma/client"

export const companyAnalysisSystem = `Ты — Principal-уровня маркетинговый стратег и бизнес-аналитик.
Твоя задача — провести глубокий маркетинговый анализ компании по её карточке.

Правила:
- Анализируй на русском языке, конкретно и по делу, без воды.
- Оценка (score) от 0 до 100 — реалистичная, основанная на полноте данных и потенциале.
- SWOT должен быть конкретным для этой компании, а не общими фразами.
- Рекомендации — приоритизированы по severity (high — критично для роста, medium — важно, low — желательно).
- Точки роста — конкретные действия, которые дадут измеримый эффект.
- Если данных мало — отметь это в слабых сторонах и снизь оценку, но всё равно дай полезный анализ.
- Отвечай ТОЛЬКО через предоставленный инструмент (structured output). Никакого текста вне инструмента.`

export function buildCompanyAnalysisInput(card: CompanyCard): string {
  return `Проведи маркетинговый анализ компании по следующей карточке:

Название: ${card.name}
Ниша / отрасль: ${card.niche ?? "не указана"}
Сайт: ${card.website ?? "не указан"}
Регионы работы: ${card.regions.length ? card.regions.join(", ") : "не указаны"}
Продукты / услуги: ${card.products.length ? card.products.join(", ") : "не указаны"}
Конкуренты: ${card.competitors.length ? card.competitors.join(", ") : "не указаны"}
Маркетинговый бюджет (в месяц, USD): ${card.budget ?? "не указан"}
Цели и задачи: ${card.goals ?? "не указаны"}
Соцсети: ${formatSocials(card.socials)}`
}

export interface CompanyCard {
  name: string
  niche: string | null
  website: string | null
  regions: string[]
  products: string[]
  competitors: string[]
  budget: number | null
  goals: string | null
  socials: Project["socials"]
}

function formatSocials(socials: Project["socials"]): string {
  if (
    socials &&
    typeof socials === "object" &&
    !Array.isArray(socials)
  ) {
    const entries = Object.entries(socials as Record<string, unknown>).filter(
      ([, v]) => typeof v === "string" && v.length > 0
    )
    if (entries.length === 0) return "не указаны"
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ")
  }
  return "не указаны"
}
