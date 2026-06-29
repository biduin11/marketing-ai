import { z } from "zod"

const weightedItemSchema = z.object({
  label: z.string(),
  percent: z.number().min(0).max(100),
})

export const audienceSegmentsSchema = z.object({
  summary: z.string().describe("Краткий обзор целевой аудитории компании"),
  totalAudience: z
    .number()
    .optional()
    .describe("Общий объём целевой аудитории (целое число человек)"),
  potentialReach: z
    .string()
    .optional()
    .describe("Потенциальный охват, например '250 000 чел.' или '18% рынка'"),
  icpMatch: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Уровень соответствия ICP в % (0-100)"),
  icpLevel: z
    .string()
    .optional()
    .describe("Словесное описание уровня ICP: 'высокий', 'средний', 'низкий'"),
  needs: z
    .array(weightedItemSchema)
    .optional()
    .describe("Топ-5 основных потребностей аудитории с относительным весом в %"),
  pains: z
    .array(weightedItemSchema)
    .optional()
    .describe("Топ-5 главных болей аудитории с относительным весом в %"),
  triggers: z
    .array(weightedItemSchema)
    .optional()
    .describe("Топ-5 триггеров принятия решения с относительным весом в %"),
  segments: z
    .array(
      z.object({
        name: z.string().describe("Название сегмента"),
        share: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe("Доля сегмента в % от целевой аудитории (сумма по всем сегментам ~100)"),
        size: z
          .string()
          .describe("Размер (% от рынка или примерная ёмкость)"),
        description: z.string().describe("Описание сегмента"),
        demographics: z.string().describe("Возраст, пол, доход, гео"),
        characteristics: z
          .array(z.string())
          .describe("Ключевые характеристики сегмента"),
        channels: z
          .array(z.string())
          .describe("Лучшие каналы для охвата этого сегмента"),
      })
    )
    .describe("Ключевые сегменты аудитории (3-5 сегментов)"),
})
export type AudienceSegments = z.infer<typeof audienceSegmentsSchema>

export const buyerPersonaSchema = z.object({
  personas: z
    .array(
      z.object({
        name: z
          .string()
          .describe("Имя-архетип персонажа, например «Менеджер Алексей»"),
        gender: z.string().optional().describe("Пол персонажа"),
        age: z
          .string()
          .describe("Возраст или диапазон, например «28-35 лет»"),
        occupation: z.string().describe("Должность / профессия"),
        income: z
          .string()
          .optional()
          .describe("Доход, например '60 000–100 000 руб./мес.'"),
        share: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe("Доля этой персоны в аудитории в % (сумма по всем персонам ~100)"),
        goals: z.array(z.string()).describe("Цели и желания"),
        pains: z.array(z.string()).describe("Боли и проблемы"),
        fears: z.array(z.string()).describe("Страхи"),
        desires: z.array(z.string()).describe("Глубинные желания"),
        triggers: z
          .array(z.string())
          .describe("Триггеры принятия решения о покупке"),
        objections: z.array(z.string()).describe("Типичные возражения"),
        quote: z
          .string()
          .describe(
            "Характерная цитата от лица персонажа в первом лице"
          ),
        psychotype: z
          .enum(["traditionalist", "independent", "aesthete", "hedonist"])
          .optional()
          .describe(
            "Доминирующий психотип персонажа: traditionalist (Традиционалист), independent (Независимый), aesthete (Эстет), hedonist (Гедонист)"
          ),
        psychotypeReason: z
          .string()
          .optional()
          .describe(
            "Почему именно этот психотип доминирует у персонажа"
          ),
      })
    )
    .describe("2-4 Buyer Persona для этой компании"),
})
export type BuyerPersona = z.infer<typeof buyerPersonaSchema>

export const jtbdSchema = z.object({
  jobs: z
    .array(
      z.object({
        job: z
          .string()
          .describe(
            "Работа (задача), которую нанимают продукт/услугу выполнить"
          ),
        context: z
          .string()
          .describe(
            "Контекст и ситуация, в которой возникает эта задача"
          ),
        functional: z
          .string()
          .describe("Функциональный аспект — что нужно сделать"),
        emotional: z
          .string()
          .describe("Эмоциональный аспект — как хочет себя чувствовать"),
        social: z
          .string()
          .describe("Социальный аспект — что хочет показать другим"),
        outcome: z
          .string()
          .describe("Желаемый результат после выполнения работы"),
      })
    )
    .describe("Jobs To Be Done — 4-6 ключевых работ"),
})
export type Jtbd = z.infer<typeof jtbdSchema>
