import { z } from "zod"

export const offerTypeEnum = z.enum([
  "utp",
  "promotion",
  "special",
  "lead_magnet",
])
export type OfferType = z.infer<typeof offerTypeEnum>

export const offerSchema = z.object({
  usp: z
    .string()
    .describe("Главное УТП компании — одно ёмкое предложение, выделяющее среди конкурентов"),
  tagline: z.string().describe("Короткий слоган 5-10 слов"),
  offers: z
    .array(
      z.object({
        type: offerTypeEnum.describe(
          "utp=УТП, promotion=акция, special=спецпредложение, lead_magnet=лид-магнит"
        ),
        title: z.string().describe("Заголовок оффера"),
        description: z.string().describe("Описание и механика оффера"),
        target: z.string().describe("Для какого сегмента аудитории"),
        cta: z.string().describe("Призыв к действию"),
      })
    )
    .describe("Список офферов (3-6 штук разных типов)"),
  leadMagnets: z
    .array(
      z.object({
        title: z.string().describe("Название лид-магнита"),
        format: z
          .string()
          .describe("Формат: PDF, вебинар, гайд, чеклист, шаблон, мини-курс..."),
        description: z.string().describe("Что получает пользователь и какую проблему решает"),
      })
    )
    .describe("Лид-магниты для привлечения аудитории (2-4 штуки)"),
})
export type Offer = z.infer<typeof offerSchema>
