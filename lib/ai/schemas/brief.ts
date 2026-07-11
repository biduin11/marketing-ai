import { z } from "zod"

// Гибкая схема — набор полей зависит от типа брифа (см. lib/ai/prompts/briefs.ts).
// title/objective обязательны для всех типов, остальное — passthrough.
export const briefContentSchema = z
  .object({
    title: z.string(),
    objective: z.string(),
  })
  .passthrough()
export type BriefContent = z.infer<typeof briefContentSchema>
