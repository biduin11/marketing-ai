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
        channels: z.array(z.string()).describe("Основные маркетинговые каналы"),
        yandexRating: z.number().min(0).max(5).optional()
          .describe("Рейтинг на Яндекс Картах (0.0–5.0)"),
        yandexReviewsCount: z.number().int().min(0).optional()
          .describe("Количество отзывов на Яндекс Картах"),
        gisRating: z.number().min(0).max(5).optional()
          .describe("Рейтинг на 2ГИС (0.0–5.0)"),
        gisReviewsCount: z.number().int().min(0).optional()
          .describe("Количество отзывов на 2ГИС"),
        commonComplaints: z.array(z.string()).optional()
          .describe("Частые жалобы клиентов в отзывах (наши возможности роста)"),
        commonPraise: z.array(z.string()).optional()
          .describe("Частые похвалы клиентов в отзывах"),
        yandexPosition: z.number().int().min(1).optional()
          .describe("Позиция в органической выдаче Яндекса по основному запросу"),
        hasContextAds: z.boolean().optional()
          .describe("Есть ли контекстная реклама в Яндекс Директ"),
        hasSite: z.boolean().optional()
          .describe("Есть ли сайт"),
        siteUrl: z.string().optional()
          .describe("URL сайта конкурента"),
        hasPrices: z.boolean().optional()
          .describe("Есть ли цены на сайте"),
        hasCalculator: z.boolean().optional()
          .describe("Есть ли калькулятор стоимости на сайте"),
        hasOnlineForm: z.boolean().optional()
          .describe("Есть ли форма онлайн-заявки на сайте"),
        instagram: z.string().optional()
          .describe("@username или URL Instagram"),
        vk: z.string().optional()
          .describe("@username или URL ВКонтакте"),
        telegram: z.string().optional()
          .describe("@username или URL Telegram"),
        socialActivity: z.enum(["active", "moderate", "low", "none"]).optional()
          .describe("Активность в соцсетях: active=активно, moderate=умеренно, low=редко, none=нет"),
      })
    )
    .describe("Анализ конкурентов из карточки проекта"),
  opportunities: z
    .array(
      z.object({
        title: z.string().describe("Название возможности захвата"),
        description: z.string().describe("Как именно захватить эту возможность"),
        competitor: z.string().describe("На слабости какого конкурента направлено"),
        priority: z.enum(["high", "medium", "low"]).optional()
          .describe("Приоритет: high=срочно, medium=важно, low=желательно"),
      })
    )
    .describe("Возможности захвата рынка у конкурентов"),
  ourAdvantages: z
    .array(z.string())
    .describe("Наши конкурентные преимущества перед всеми конкурентами"),
  ourWeaknesses: z
    .array(z.string())
    .optional()
    .describe("Наши слабости / зоны роста по сравнению с конкурентами"),
})

export type CompetitorAnalysis = z.infer<typeof competitorAnalysisSchema>
