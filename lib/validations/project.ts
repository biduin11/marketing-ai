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

const competitorDetailSchema = z.object({
  name: z.string().optional(),
  site: z.string().optional(),
  description: z.string().optional(),
})

export const updateProjectSchema = z.object({
  // Core (existing)
  name: z
    .string()
    .min(1, "Название обязательно")
    .max(100, "Название не более 100 символов"),
  niche:    z.string().optional().or(z.literal("")),
  website:  z.string().url("Введите корректный URL").optional().or(z.literal("")),
  goals:    z.string().optional().or(z.literal("")),
  products: z.preprocess(toStringArray, z.array(z.string()).default([])),
  competitors: z.preprocess(toStringArray, z.array(z.string()).default([])),
  regions:  z.preprocess(toStringArray, z.array(z.string()).default([])),
  budget:   z.coerce.number().min(0).optional(),
  socials:  z.record(z.string(), z.string()).optional(),

  // Extended profile (Iteration 7)
  industry:           z.string().optional(),
  dealCycle:          z.string().optional(),
  brandTone:          z.string().optional(),
  brandWords:         z.string().optional(),
  clientType:         z.string().optional(),
  audienceSegments:   z.string().optional(),
  clientValues:       z.string().optional(),
  objections:         z.string().optional(),
  clientLanguage:     z.string().optional(),
  currentChannels:    z.string().optional(),
  marketingGoal:      z.string().optional(),
  socialLinks:        z.string().optional(),
  proofFacts:         z.string().optional(),
  margin:             z.coerce.number().int().min(0).max(100).optional(),
  conversionRate:     z.coerce.number().int().min(0).max(100).optional(),
  currentCpl:         z.coerce.number().int().min(0).optional(),
  leadsPerMonth:      z.coerce.number().int().min(0).optional(),
  salesPerMonth:      z.coerce.number().int().min(0).optional(),
  avgCheck:           z.coerce.number().int().min(0).optional(),
  competitorsDetailed: z.array(competitorDetailSchema).optional(),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
