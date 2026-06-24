import { z } from "zod"

export const executiveReportSchema = z.object({
  headline: z.string().describe("Одна строка — главный вывод для руководителя"),
  summary: z.string().describe("2-3 абзаца исполнительного резюме с анализом периода"),
  wins: z
    .array(z.string())
    .describe("3-5 ключевых достижений и побед за период"),
  risks: z
    .array(z.string())
    .describe("3-5 рисков и проблем, требующих внимания"),
  recommendations: z
    .array(z.string())
    .describe("5-7 конкретных рекомендаций по улучшению результатов"),
  nextPeriodFocus: z
    .array(z.string())
    .describe("3-5 приоритетов на следующий период"),
})

export type ExecutiveReport = z.infer<typeof executiveReportSchema>
