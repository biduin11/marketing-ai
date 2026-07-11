import type { CompanyCard } from "@/lib/ai/prompts/companyAnalysis"
import { AUDIT_QUESTIONS } from "@/lib/audit-questions"

export type { CompanyCard }

export const expressAuditSystem = `Ты — старший маркетинговый консультант.
Проанализируй результаты экспресс-аудита и дай оценку.

ЗАДАЧА:
На основе ответов определи:
1. Итоговый балл 0-100 (взвешенная оценка по всем категориям)
2. Уровень: "Сильный маркетинг" (70-100) / "Средний уровень" (40-69) / "Требует серьёзной работы" (0-39)
3. Топ-3 точки роста — самые важные улучшения
4. Быстрые победы — что можно сделать за 1-2 недели
5. Краткий вывод для руководителя (2-3 предложения)

ВАЖНО:
- Точки роста должны быть конкретными, не общими
- Быстрые победы — реально выполнимые за 2 недели
- Учитывай нишу и регион компании
- Пиши на русском языке
- Отвечай ТОЛЬКО через предоставленный инструмент (structured output). Никакого текста вне инструмента.`

export function buildExpressAuditInput(card: CompanyCard, answers: Record<string, number>): string {
  const answersContext = AUDIT_QUESTIONS.map((q) => {
    const value = answers[q.id]
    const option = q.options.find((o) => o.value === value)
    return `- ${q.category}: ${q.question} → ${option?.label ?? "нет ответа"} (${value ?? "?"} из 3)`
  }).join("\n")

  return `ДАННЫЕ КОМПАНИИ:
Название: ${card.name}
Ниша / отрасль: ${card.niche ?? "не указана"}
Продукты / услуги: ${card.products.length ? card.products.join(", ") : "не указаны"}
Регионы работы: ${card.regions.length ? card.regions.join(", ") : "не указаны"}
Цели и задачи: ${card.goals ?? "не указаны"}

ОТВЕТЫ НА АУДИТ:
${answersContext}`
}
