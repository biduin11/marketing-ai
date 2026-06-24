import { z } from "zod"

export const contentTypeEnum = z.enum(["reels", "post", "stories", "email"])
export type ContentType = z.infer<typeof contentTypeEnum>

export const contentCategoryEnum = z.enum([
  "educational",
  "engagement",
  "sales",
])
export type ContentCategory = z.infer<typeof contentCategoryEnum>

export const contentPlanSchema = z.object({
  summary: z.string().describe("Краткое резюме контент-стратегии на месяц"),
  calendar: z
    .array(
      z.object({
        week: z
          .number()
          .int()
          .min(1)
          .max(4)
          .describe("Номер недели (1-4)"),
        day: z
          .number()
          .int()
          .min(1)
          .max(28)
          .describe("День месяца (1-28, равномерно по 4 неделям)"),
        type: contentTypeEnum.describe(
          "Тип контента: reels, post, stories, email"
        ),
        category: contentCategoryEnum.describe(
          "Категория: educational=образовательный, engagement=вовлечение, sales=продажи"
        ),
        title: z.string().describe("Тема публикации"),
        hook: z
          .string()
          .describe("Цепляющее начало / hook (1-2 предложения)"),
      })
    )
    .describe(
      "Публикационный календарь на месяц (20-30 позиций). СТРОГО соблюдай сплит: 70% educational, 20% engagement, 10% sales. Дни распределяй равномерно по 4 неделям (по 7 дней)."
    ),
  ideas: z.object({
    reels: z
      .array(
        z.object({
          title: z.string().describe("Тема Reels"),
          hook: z.string().describe("Первые 3 секунды — что зацепит зрителя"),
          angle: z.string().describe("Угол подачи / формат съёмки"),
        })
      )
      .describe("Ровно 10 идей для Reels"),
    posts: z
      .array(
        z.object({
          title: z.string().describe("Тема поста"),
          format: z
            .string()
            .describe("Формат: карусель / текст / инфографика / список"),
          angle: z.string().describe("Угол подачи"),
        })
      )
      .describe("Ровно 15 идей для постов"),
    stories: z
      .array(
        z.object({
          title: z.string().describe("Тема Stories"),
          format: z
            .string()
            .describe(
              "Формат: опрос / слайдер / вопрос / до-после / факт / реакция"
            ),
        })
      )
      .describe("Ровно 10 идей для Stories"),
  }).describe("Банк идей контента"),
  reelsScripts: z
    .array(
      z.object({
        title: z.string().describe("Название Reels"),
        hook: z
          .string()
          .describe("Первые 3 секунды — что зрителя зацепит (дословный текст)"),
        body: z
          .string()
          .describe("Основной контент 15-25 секунд (дословный сценарий)"),
        cta: z.string().describe("Призыв к действию в конце"),
        hashtags: z
          .array(z.string())
          .describe("5-8 релевантных хэштегов без #"),
      })
    )
    .describe("Ровно 3 готовых сценария Reels"),
  emailSequence: z
    .array(
      z.object({
        number: z
          .number()
          .int()
          .describe("Порядковый номер письма в цепочке"),
        subject: z.string().describe("Тема письма"),
        goal: z
          .string()
          .describe("Цель письма: прогрев / ценность / продажа / дожим"),
        preview: z
          .string()
          .describe(
            "Превью-текст (то, что видно до открытия письма), 80-120 символов"
          ),
        sendDay: z
          .string()
          .describe(
            "Когда отправить, например «День 0», «День 2», «День 5», «День 7», «День 14»"
          ),
      })
    )
    .describe("Email-цепочка из ровно 5 писем"),
})
export type ContentPlan = z.infer<typeof contentPlanSchema>
