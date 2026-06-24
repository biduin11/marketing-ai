import { z } from "zod"

export const directorAnalysisSchema = z.object({
  problems: z.array(
    z.object({
      title: z.string().describe("Название проблемы (1-2 предложения)"),
      impact: z.string().describe("Влияние на бизнес"),
    })
  ).describe("3-5 ключевых проблем, обнаруженных в данных проекта"),

  opportunities: z.array(
    z.object({
      title: z.string().describe("Название возможности"),
      potential: z.string().describe("Потенциал роста или выгода"),
    })
  ).describe("3-5 конкретных возможностей для роста"),

  risks: z.array(
    z.object({
      title: z.string().describe("Название риска"),
      severity: z.enum(["low", "medium", "high"]).describe("Уровень серьёзности"),
    })
  ).describe("3-5 рисков, требующих внимания"),

  priorities: z.array(
    z.object({
      action: z.string().describe("Конкретное действие для выполнения"),
      reason: z.string().describe("Обоснование приоритета"),
      order: z.number().int().describe("Порядок выполнения (1 = самый важный)"),
    })
  ).describe("5-7 приоритетных действий, отсортированных по важности"),
})

export type DirectorAnalysis = z.infer<typeof directorAnalysisSchema>
