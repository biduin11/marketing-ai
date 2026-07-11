import { z } from "zod"

export const periodComparisonCommentSchema = z.object({
  comment: z
    .string()
    .describe("2-3 предложения по-русски: что изменилось, вероятная причина, рекомендация"),
})

export type PeriodComparisonComment = z.infer<typeof periodComparisonCommentSchema>
