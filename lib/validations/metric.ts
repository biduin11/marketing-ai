import { z } from "zod"

export const createMetricSchema = z.object({
  projectId: z.string().cuid(),
  channel: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Формат: YYYY-MM-DD"),
  spend: z.number().min(0),
  revenue: z.number().min(0),
  leads: z.number().int().min(0),
  clicks: z.number().int().min(0),
  impressions: z.number().int().min(0),
})

export const updateMetricSchema = createMetricSchema
  .omit({ projectId: true })
  .partial()

export type CreateMetricInput = z.infer<typeof createMetricSchema>
export type UpdateMetricInput = z.infer<typeof updateMetricSchema>
