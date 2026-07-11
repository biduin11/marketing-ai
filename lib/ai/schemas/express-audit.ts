import { z } from "zod"

export const growthPointSchema = z.object({
  title: z.string().describe("Конкретная точка роста, не общая формулировка"),
  impact: z.enum(["высокий", "средний", "низкий"]).describe("Влияние на бизнес"),
  description: z.string().describe("Развёрнутое объяснение"),
})

export const quickWinSchema = z.object({
  title: z.string().describe("Конкретное действие, выполнимое за 1-2 недели"),
  timeframe: z.string().describe("Срок выполнения, например «1 день»"),
  description: z.string().describe("Как именно это сделать"),
})

export const expressAuditSchema = z.object({
  score: z.number().min(0).max(100).describe("Итоговый взвешенный балл 0-100"),
  level: z
    .string()
    .describe('Уровень: "Сильный маркетинг" (70-100) / "Средний уровень" (40-69) / "Требует серьёзной работы" (0-39)'),
  summary: z.string().describe("Краткий вывод для руководителя, 2-3 предложения"),
  growthPoints: z.array(growthPointSchema).describe("Топ-3 точки роста"),
  quickWins: z.array(quickWinSchema).describe("Быстрые победы, выполнимые за 1-2 недели"),
  categoryScores: z
    .record(z.string(), z.number())
    .describe("Оценка по каждой категории вопросов, 0-100"),
})

export type ExpressAuditResult = z.infer<typeof expressAuditSchema>
export type GrowthPoint = z.infer<typeof growthPointSchema>
export type QuickWin = z.infer<typeof quickWinSchema>
