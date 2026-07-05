import { z } from "zod"

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
  dataConfidence: z.enum(["high", "medium", "low"]),
})

export type Reputation = z.infer<typeof reputationSchema>
export type ReputationSource = z.infer<typeof sourceSchema>
export type ReputationReview = z.infer<typeof reviewSchema>
export type ReputationRecommendation = z.infer<typeof recommendationSchema>
