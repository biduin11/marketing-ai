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

// Comma/newline separated string → trimmed string array (drops empties).
const stringList = z
  .string()
  .optional()
  .transform((val) =>
    (val ?? "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  )

export const updateProjectSchema = z.object({
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
  goals: z.string().max(2000).optional(),
  products: stringList,
  competitors: stringList,
  regions: stringList,
  budget: z
    .union([z.number().int().min(0), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  socials: z.record(z.string(), z.string()).optional(),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
