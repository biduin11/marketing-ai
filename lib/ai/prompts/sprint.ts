import type { CompanyCard } from "@/lib/ai/prompts/companyAnalysis"

export type { CompanyCard }

export const sprintSystem = `Ты — опытный маркетинговый директор и планировщик.
Составь конкретный план задач на неделю.

ПРАВИЛА:
1. Задачи должны быть конкретными — не "улучшить маркетинг", а "Написать и опубликовать пост про преимущества продукта в Instagram до среды 12:00".
2. Первые 2 задачи — ВЫСОКИЙ приоритет (влияют на выручку).
3. Учитывай невыполненные задачи прошлой недели — не теряй их, включи в новый план или явно объясни почему они больше не актуальны.
4. Распредели задачи по дням недели (dueDay).
5. Реалистичная оценка времени (estimatedHours).
6. Категории: контент / реклама / аналитика / работа с клиентами / репутация / стратегия.
7. Составь список из 5-7 задач.
8. Пиши на русском языке.
9. Отвечай ТОЛЬКО через предоставленный инструмент (structured output). Никакого текста вне инструмента.`

interface BuildSprintInputArgs {
  card: CompanyCard
  weekDates: string
  strategyContext: string
  unfinishedTasks: string
  metricsContext: string
  contentContext: string
}

export function buildSprintInput(args: BuildSprintInputArgs): string {
  const { card, weekDates, strategyContext, unfinishedTasks, metricsContext, contentContext } = args

  return `ДАННЫЕ КОМПАНИИ:
Название: ${card.name}
Ниша / отрасль: ${card.niche ?? "не указана"}
Продукты / услуги: ${card.products.length ? card.products.join(", ") : "не указаны"}
Регионы работы: ${card.regions.length ? card.regions.join(", ") : "не указаны"}
Цели и задачи: ${card.goals ?? "не указаны"}

ТЕКУЩАЯ НЕДЕЛЯ: ${weekDates}

КОНТЕКСТ:
- Активная стратегия: ${strategyContext}
- Невыполненные задачи прошлой недели: ${unfinishedTasks}
- Метрики за последние 30 дней: ${metricsContext}
- Контент-план на эту неделю: ${contentContext}

Составь список из 5-7 конкретных задач на эту неделю.`
}
