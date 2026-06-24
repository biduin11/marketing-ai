import { z } from "zod"

export const horizonValues = [30, 90, 180, 365] as const
export const horizonSchema = z.union([
  z.literal(30),
  z.literal(90),
  z.literal(180),
  z.literal(365),
])
export type Horizon = z.infer<typeof horizonSchema>

export const kpiSchema = z.object({
  name: z.string().describe("Название метрики, например: Выручка, Лиды, Конверсия, CAC"),
  target: z.string().describe("Целевое значение метрики с единицами измерения"),
})

export const weekSchema = z.object({
  n: z.number().int().describe("Порядковый номер недели/этапа"),
  title: z.string().describe("Название недели/этапа"),
  focus: z.string().describe("Фокус и ключевые активности на этой неделе"),
})

export const roadmapItemSchema = z.object({
  task: z.string().describe("Конкретная задача дорожной карты"),
  dueDate: z
    .string()
    .describe("Срок выполнения в формате ISO-даты (YYYY-MM-DD) или относительный, например «Неделя 2»"),
})

export const strategySchema = z.object({
  horizon: horizonSchema.describe("Горизонт планирования в днях"),
  summary: z.string().describe("Краткое резюме стратегии на этот горизонт"),
  kpi: z
    .array(kpiSchema)
    .describe("KPI: обязательно включить Выручка, Лиды, Конверсия, CAC"),
  weeks: z.array(weekSchema).describe("Разбивка по неделям/этапам"),
  roadmap: z
    .array(roadmapItemSchema)
    .describe("Список конкретных задач с датами"),
})

export type Strategy = z.infer<typeof strategySchema>
