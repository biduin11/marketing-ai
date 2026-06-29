import { z } from "zod"

export const cjmSchema = z.object({
  summary: z.string().describe("Краткое резюме пути клиента"),
  cesScore: z
    .number()
    .min(0)
    .max(10)
    .optional()
    .describe("Customer Experience Score (0-10, общая оценка опыта клиента)"),
  cesLevel: z
    .string()
    .optional()
    .describe("Словесная оценка уровня: 'отличный уровень', 'хороший уровень', 'требует улучшений'"),
  keyInsights: z
    .array(z.string())
    .optional()
    .describe("4 ключевых инсайта — самые важные выводы из всего CJM (краткие, конкретные)"),
  stages: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Название этапа (Осведомлённость, Интерес, Рассмотрение, Решение, Покупка, Удержание, Лояльность)"
          ),
        description: z.string().describe("Что происходит на этом этапе"),
        customerGoal: z
          .string()
          .optional()
          .describe("Цель клиента на этом этапе — одно конкретное предложение"),
        customerActions: z
          .array(z.string())
          .describe("Типичные действия клиента на этом этапе"),
        touchpoints: z
          .array(z.string())
          .describe("Точки контакта с брендом на этом этапе"),
        emotion: z
          .enum(["positive", "neutral", "negative"])
          .describe("Доминирующее эмоциональное состояние клиента"),
        emotionScore: z
          .number()
          .min(1)
          .max(5)
          .optional()
          .describe("Эмоциональный балл (1=очень негативно, 2=негативно, 3=нейтрально, 4=позитивно, 5=восторг)"),
        emotionLabel: z
          .string()
          .optional()
          .describe("Словесная метка эмоции: 'Нейтрально', 'Заинтересован', 'Немного сомневается', 'Доволен', 'Восторг' и т.д."),
        painPoints: z
          .array(z.string())
          .describe("Боли и проблемы клиента на этом этапе"),
        opportunities: z
          .array(z.string())
          .describe("Конкретные возможности улучшить опыт клиента"),
        recommendation: z
          .string()
          .optional()
          .describe("Одна главная рекомендация для этого этапа — конкретное действие"),
        churnRisk: z
          .enum(["low", "medium", "high"])
          .describe("Риск потери клиента на этом этапе"),
        churnReasons: z
          .array(z.string())
          .describe("Причины, по которым клиент уходит именно здесь"),
      })
    )
    .describe("5-7 последовательных этапов пути клиента"),
  funnelMetrics: z
    .array(
      z.object({
        stage: z.string().describe("Название этапа воронки"),
        conversion: z
          .string()
          .describe(
            "Конверсия на этом этапе, например «45%» или «из 1000 → 450»"
          ),
      })
    )
    .describe("Метрики воронки — конверсии между этапами"),
  recommendations: z
    .array(z.string())
    .describe("Ключевые рекомендации по улучшению CJM (5-7 пунктов)"),
})
export type Cjm = z.infer<typeof cjmSchema>
