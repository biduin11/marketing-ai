import { z } from "zod"

export const cjmSchema = z.object({
  summary: z.string().describe("Краткое резюме пути клиента"),
  stages: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Название этапа (Осведомлённость, Интерес, Рассмотрение, Решение, Покупка, Удержание, Лояльность)"
          ),
        description: z.string().describe("Что происходит на этом этапе"),
        touchpoints: z
          .array(z.string())
          .describe("Точки контакта с брендом на этом этапе"),
        customerActions: z
          .array(z.string())
          .describe("Типичные действия клиента на этом этапе"),
        emotion: z
          .enum(["positive", "neutral", "negative"])
          .describe("Доминирующее эмоциональное состояние клиента"),
        painPoints: z
          .array(z.string())
          .describe("Боли и проблемы клиента на этом этапе"),
        opportunities: z
          .array(z.string())
          .describe("Конкретные возможности улучшить опыт клиента"),
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
