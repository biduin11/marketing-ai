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

        // Яндекс.Карты / 2ГИС — null если не найдено в поиске. НЕ выдумывать.
        yandexRating: z.number().min(0).max(5).nullable().optional()
          .describe("Рейтинг на Яндекс Картах (0.0–5.0). null если не найден"),
        yandexReviewsCount: z.number().int().min(0).nullable().optional()
          .describe("Количество отзывов на Яндекс Картах. null если не найдено"),
        yandexRatingSource: z.string().nullable().optional()
          .describe("URL источника, откуда взят рейтинг Яндекса. null если нет"),
        gisRating: z.number().min(0).max(5).nullable().optional()
          .describe("Рейтинг на 2ГИС (0.0–5.0). null если не найден"),
        gisReviewsCount: z.number().int().min(0).nullable().optional()
          .describe("Количество отзывов на 2ГИС. null если не найдено"),

        commonComplaints: z.array(z.string()).default([])
          .describe("Частые жалобы клиентов в отзывах (наши возможности роста)"),
        commonPraise: z.array(z.string()).default([])
          .describe("Частые похвалы клиентов в отзывах"),

        // Поиск — null если не проверял или не нашёл
        yandexPosition: z.number().int().min(1).nullable().optional()
          .describe("Позиция в органической выдаче Яндекса по основному запросу. null если не проверено"),
        hasContextAds: z.boolean().nullable().optional()
          .describe("Есть ли контекстная реклама в Яндекс Директ. null если не проверено"),

        // Сайт — null если сайт не найден/не открылся
        hasSite: z.boolean().nullable().optional()
          .describe("Есть ли сайт. null если не найден в поиске"),
        siteUrl: z.string().nullable().optional()
          .describe("URL сайта конкурента. null если нет"),
        hasPrices: z.boolean().nullable().optional()
          .describe("Есть ли цены на сайте. null если сайт не проверен"),
        hasCalculator: z.boolean().nullable().optional()
          .describe("Есть ли калькулятор стоимости. null если сайт не проверен"),
        hasOnlineForm: z.boolean().nullable().optional()
          .describe("Есть ли форма онлайн-заявки. null если сайт не проверен"),
        siteNote: z.string().nullable().optional()
          .describe("Заметка по сайту, если что-то неясно. Например: 'Сайт не найден в поиске'"),

        // Соцсети — null = НЕ найдено (это не то же самое, что 'неактивен')
        instagram: z.string().nullable().optional()
          .describe("@username или URL Instagram. null если не найден"),
        vk: z.string().nullable().optional()
          .describe("@username или URL ВКонтакте. null если не найден"),
        telegram: z.string().nullable().optional()
          .describe("@username или URL Telegram. null если не найден"),
        // Активность указывать ТОЛЬКО если реально нашёл аккаунты
        socialActivity: z.enum(["active", "moderate", "low", "none"]).nullable().optional()
          .describe("Активность в соцсетях (active/moderate/low/none). null если соцсети не найдены — НЕ ставить 'none' по умолчанию"),
        socialNote: z.string().nullable().optional()
          .describe("Заметка по соцсетям. Например: 'Аккаунт найден, последний пост 2022'"),

        // Достоверность данных по конкуренту в целом
        dataConfidence: z.enum(["high", "medium", "low"]).default("medium")
          .describe("Достоверность: high=много реальных данных, medium=частично, low=почти ничего не найдено (данные ненадёжны)"),
        dataFoundVia: z.array(z.string()).default([])
          .describe("Источники, где реально найдены данные: yandex_maps, 2gis, site, vk, telegram, search"),

        threatLevel: z.enum(["high", "medium", "low"]).default("medium")
          .describe("Уровень угрозы конкурента для нас"),
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
