import { z } from "zod"

export const marketAnalysisSchema = z.object({
  marketSize: z.object({
    value: z.string().describe("Размер рынка, например '1.8 млрд ₽'"),
    period: z.string().describe("Период, например 'в год'"),
    region: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
  }),
  marketGrowth: z.object({
    value: z.string().describe("Рост рынка, например '+11%'"),
    period: z.string().describe("Период, например 'за последний год'"),
    trend: z.enum(["up", "down", "stable"]),
  }),
  competitorsCount: z.object({
    value: z.number().int().min(0),
    description: z.string().describe("Например 'Активных компаний'"),
  }),
  avgCheck: z.object({
    value: z.string().describe("Например '210 000 ₽'"),
    description: z.string(),
  }),
  avgMargin: z.object({
    value: z.string().describe("Например '27%'"),
    description: z.string(),
  }),
  attractiveness: z.object({
    score: z.number().min(0).max(100),
    level: z.string().describe("Например 'Высокая'"),
  }),

  regions: z.array(
    z.object({
      name: z.string(),
      type: z.string().describe("Например 'Основной рынок'"),
      population: z.string(),
      marketCapacity: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      notes: z.string().nullable(),
    })
  ).default([]),

  threats: z.array(
    z.object({
      title: z.string(),
      score: z.number().min(0).max(100),
      level: z.enum(["critical", "high", "medium", "low"]),
    })
  ).default([]),

  opportunities: z.array(
    z.object({
      title: z.string(),
      score: z.number().min(0).max(100),
    })
  ).default([]),

  insight: z.object({
    headline: z.string(),
    body: z.string(),
    growthProbability: z.number().min(0).max(100),
    recommendations: z.array(z.string()).default([]),
  }),

  demandDynamics: z.array(
    z.object({
      month: z.string(),
      value: z.number().min(0).max(100),
    })
  ).default([]),

  priceDynamics: z.array(
    z.object({
      month: z.string(),
      value: z.number(),
    })
  ).default([]),

  recentEvents: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      impact: z.enum(["high", "medium", "low"]),
      trend: z.enum(["up", "down", "neutral"]),
    })
  ).default([]),
})

export type MarketAnalysis = z.infer<typeof marketAnalysisSchema>
