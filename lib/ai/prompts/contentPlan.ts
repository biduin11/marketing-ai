import type { CompanyCard } from "@/lib/ai/prompts/companyAnalysis"
import { formatRub } from "@/lib/utils"

export type { CompanyCard }

export const contentPlanSystem = `Ты — Principal-уровня контент-стратег и SMM-директор.
Твоя задача — разработать полный контент-план на месяц с идеями, сценариями и email-цепочкой.

Правила:
- Весь контент на русском языке, конкретно и по делу для данной ниши.
- ОБЯЗАТЕЛЬНЫЙ сплит: 70% образовательный (educational), 20% вовлечение (engagement), 10% продажи (sales).
- Календарь: 20-30 публикаций, равномерно распределённых по 4 неделям (7 дней в неделе).
- Reels идеи: цепляющие hooks с конкретной темой ниши, не общие слова.
- Посты: разнообразные форматы — карусели, текстовые, инфографика.
- Stories: интерактивный контент — опросы, слайдеры, вопросы, до-после.
- Сценарии Reels: дословный текст, готовый к съёмке, с конкретным hook.
- Email-цепочка: 5 писем, прогрев → ценность → продажа → дожим → реактивация.
- Отвечай ТОЛЬКО через предоставленный инструмент (structured output). Никакого текста вне инструмента.`

export function buildContentPlanInput(card: CompanyCard): string {
  return `Разработай контент-план на месяц для компании по карточке:

Название: ${card.name}
Ниша / отрасль: ${card.niche ?? "не указана"}
Сайт: ${card.website ?? "не указан"}
Регионы работы: ${card.regions.length ? card.regions.join(", ") : "не указаны"}
Продукты / услуги: ${card.products.length ? card.products.join(", ") : "не указаны"}
Конкуренты: ${card.competitors.length ? card.competitors.join(", ") : "не указаны"}
Бюджет: ${formatRub(card.budget)} в месяц
Цели и задачи: ${card.goals ?? "не указаны"}

Создай: публикационный календарь (сплит 70/20/10), 10 идей Reels + 15 постов + 10 Stories, 3 сценария Reels и email-цепочку из 5 писем.`
}
