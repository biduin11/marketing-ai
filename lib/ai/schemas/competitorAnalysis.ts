import { z } from "zod"

export const competitorAnalysisSchema = z.object({
  summary: z.string().describe("Общая оценка конкурентной среды"),
  competitors: z
    .array(
      z.object({
        name: z.string().describe("Название конкурента"),
        strengths: z.array(z.string()).describe("Сильные стороны конкурента"),
        weaknesses: z.array(z.string()).describe("Слабые стороны конкурента"),
        positioning: z.string().describe("Ключевое позиционирование"),
        audience: z.string().describe("Целевая аудитория конкурента"),
        channels: z
          .array(z.string())
          .describe("Основные маркетинговые каналы"),
      })
    )
    .describe("Анализ конкурентов из карточки проекта"),
  opportunities: z
    .array(
      z.object({
        title: z.string().describe("Название возможности захвата"),
        description: z
          .string()
          .describe("Как именно захватить эту возможность"),
        competitor: z
          .string()
          .describe("На слабости какого конкурента направлено"),
      })
    )
    .describe("Возможности захвата рынка у конкурентов"),
  ourAdvantages: z
    .array(z.string())
    .describe("Наши конкурентные преимущества перед всеми конкурентами"),
})
export type CompetitorAnalysis = z.infer<typeof competitorAnalysisSchema>
