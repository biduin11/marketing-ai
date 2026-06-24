import { z } from "zod"

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Название обязательно")
    .max(100, "Название не более 100 символов"),
  niche: z.string().max(200).optional(),
  website: z
    .string()
    .url("Введите корректный URL")
    .optional()
    .or(z.literal("")),
  goals: z.string().max(1000).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
