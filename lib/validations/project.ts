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
  budget: z.coerce.number().min(0).optional(),
  competitors: z.array(z.string()).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

const toStringArray = (val: unknown) =>
  typeof val === "string"
    ? val.split(",").map((s) => s.trim()).filter(Boolean)
    : val

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Название обязательно")
    .max(100, "Название не более 100 символов"),
  niche: z.string().optional().or(z.literal("")),
  website: z
    .string()
    .url("Введите корректный URL")
    .optional()
    .or(z.literal("")),
  goals: z.string().optional().or(z.literal("")),
  products: z.preprocess(toStringArray, z.array(z.string()).default([])),
  competitors: z.preprocess(toStringArray, z.array(z.string()).default([])),
  regions: z.preprocess(toStringArray, z.array(z.string()).default([])),
  budget: z.coerce.number().min(0).optional(),
  socials: z.record(z.string(), z.string()).optional(),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
