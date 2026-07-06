import { z } from "zod"

export const productAnalysisSchema = z.object({
  lineStrength: z.object({
    score: z.number().min(0).max(10),
    maxScore: z.number(),
    level: z.string().describe("Например 'Высокая'"),
  }),
  avgMargin: z.object({
    value: z.number(),
    description: z.string().describe("Например 'По портфелю'"),
  }),
  topProduct: z.object({
    name: z.string(),
    reason: z.string().describe("Например 'По продажам и марже'"),
  }),
  growthPotential: z.object({
    level: z.string().describe("Например 'Высокий'"),
    period: z.string().describe("Например 'На 12 мес.'"),
  }),
  revenueUpside: z.object({
    value: z.string().describe("Например '+18-22%'"),
    period: z.string(),
  }),

  products: z.array(
    z.object({
      name: z.string(),
      tag: z.string().nullable().describe("Флагман / Стабильный / Премиум / Дополнение / Нишевый"),
      tagColor: z.enum(["success", "warning", "danger", "neutral", "muted"]),
      demandLevel: z.string().describe("Например 'Высокий спрос и маржа'"),
      margin: z.number(),
      salesShare: z.number().nullable(),
      stage: z.enum(["new", "growth", "mature", "decline"]),
    })
  ).default([]),

  bcg: z.object({
    stars: z.array(z.string()).default([]),
    questionMarks: z.array(z.string()).default([]),
    cashCows: z.array(z.string()).default([]),
    dogs: z.array(z.string()).default([]),
  }),

  lifecycle: z.object({
    new: z.number().min(0).max(100),
    growth: z.number().min(0).max(100),
    mature: z.number().min(0).max(100),
    decline: z.number().min(0).max(100),
  }),

  developmentOpportunities: z.array(
    z.object({
      title: z.string(),
      score: z.number().min(0).max(100),
    })
  ).default([]),

  productStrengths: z.array(z.string()).default([]),
  growthZones: z.array(z.string()).default([]),

  abc: z.object({
    totalSku: z.number().nullable(),
    categories: z.number().nullable(),
    topSellers: z.number().nullable(),
    nonLiquid: z.number().nullable(),
    aShare: z.number().min(0).max(100),
    bShare: z.number().min(0).max(100),
    cShare: z.number().min(0).max(100),
  }),

  aiRecommendations: z.array(z.string()).default([]),

  productStrategy: z.object({
    summary: z.string(),
    successProbability: z.number().min(0).max(100),
  }),

  insight: z.object({
    headline: z.string(),
    body: z.string(),
    recommendations: z.array(z.string()).default([]),
  }),
})

export type ProductAnalysis = z.infer<typeof productAnalysisSchema>
