import { z } from "zod"

export const reputationAnalysisSchema = z.object({
  summary: z.string().describe("Краткое резюме состояния репутации (2-3 предложения)"),
  avgRating: z.number().describe("Средний рейтинг по всем площадкам, 0-5"),
  sentimentBreakdown: z
    .object({
      positive: z.number().int().describe("Количество позитивных отзывов"),
      neutral: z.number().int().describe("Количество нейтральных отзывов"),
      negative: z.number().int().describe("Количество негативных отзывов"),
    })
    .describe("Распределение тональности отзывов"),
  topComplaints: z
    .array(z.string())
    .describe("Топ-паттерны в негативных отзывах — на что чаще всего жалуются"),
  topPraises: z
    .array(z.string())
    .describe("Топ-паттерны в позитивных отзывах — что хвалят (это УТП)"),
  actions: z
    .array(
      z.object({
        title: z.string().describe("Короткое название действия"),
        description: z.string().describe("Что конкретно сделать"),
        urgency: z.enum(["high", "medium", "low"]).describe("Срочность"),
        platform: z.string().describe("К какой площадке относится (или 'Все')"),
      })
    )
    .describe("Приоритизированный список конкретных действий"),
  reviewReplyTemplates: z
    .array(
      z.object({
        forSentiment: z.enum(["negative", "neutral"]).describe("Для какой тональности"),
        template: z.string().describe("Готовый шаблон ответа на отзыв"),
      })
    )
    .describe("Шаблоны ответов на отзывы"),
})

export type ReputationAnalysis = z.infer<typeof reputationAnalysisSchema>
