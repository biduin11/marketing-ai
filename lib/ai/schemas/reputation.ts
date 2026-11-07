import { z } from "zod"

export const MAX_REVIEW_TEXT_LENGTH = 30_000

export const reputationInputSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("web") }),
  z.object({
    mode: z.literal("manual"),
    text: z.string().trim().min(1).max(MAX_REVIEW_TEXT_LENGTH),
  }),
])

export type ReputationInput = z.infer<typeof reputationInputSchema>

const growthPointSchema = z.object({
  quote: z.string().trim().min(8).max(500),
  issue: z.string().trim().min(1),
  action: z.string().trim().min(1),
  url: z.httpUrl().nullable().optional(),
})

export function groundGrowthPoints(
  points: z.infer<typeof growthPointSchema>[],
  evidence: { text: string; url: string | null }[]
) {
  const normalize = (text: string) => text.replace(/\s+/g, " ").trim()
  const sources = evidence.map((source) => ({ ...source, text: normalize(source.text) }))
  return points.flatMap((point) => {
    const source = sources.find(({ text }) => text.includes(normalize(point.quote)))
    return source
      ? [{ ...point, url: z.httpUrl().safeParse(source.url).data ?? null }]
      : []
  })
}

const reviewSchema = z.object({
  author: z.string().nullable(),
  rating: z.number().min(1).max(5).nullable(),
  text: z.string(),
  date: z.string().nullable(),
})

const sourceSchema = z.object({
  platform: z.string(),
  found: z.boolean(),
  rating: z.number().min(1).max(5).nullable(),
  reviewsCount: z.number().int().nullable(),
  url: z.string().nullable(),
  recentReviews: z.array(reviewSchema).default([]),
})

const recommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  urgency: z.enum(["high", "medium", "low"]),
  platform: z.string(),
})

const replyTemplateSchema = z.object({
  forType: z.enum(["negative", "neutral", "positive"]),
  template: z.string(),
})

export const reputationSchema = z.object({
  searchedAt: z.string(),
  sources: z.array(sourceSchema).default([]),
  summary: z.object({
    avgRating: z.number().nullable(),
    totalReviewsFound: z.number().int(),
    sentiment: z.object({
      positive: z.number(),
      neutral: z.number(),
      negative: z.number(),
    }),
  }),
  topPraises: z.array(z.string()).default([]),
  topComplaints: z.array(z.string()).default([]),
  recommendations: z.array(recommendationSchema).default([]),
  replyTemplates: z.array(replyTemplateSchema).default([]),
  growthPoints: z.array(growthPointSchema).max(20).default([]),
  reviewMode: z.enum(["web", "manual"]).optional(),
  dataConfidence: z.enum(["high", "medium", "low"]),
})

export type Reputation = z.infer<typeof reputationSchema>
export type ReputationSource = z.infer<typeof sourceSchema>
export type ReputationReview = z.infer<typeof reviewSchema>
export type ReputationRecommendation = z.infer<typeof recommendationSchema>
