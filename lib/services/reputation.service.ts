import type { Project, AiArtifact, Platform } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateStructured } from "@/lib/ai/generate"
import { reputationAnalysisSchema } from "@/lib/ai/schemas/reputation"
import {
  reputationSystem,
  buildReputationInput,
  type ReputationContext,
  type ReputationReview,
  type ReputationSocialStat,
} from "@/lib/ai/prompts/reputation"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"

/** Derives sentiment from a star rating when no explicit sentiment is stored. */
export function sentimentFromRating(rating: number | null): string | null {
  if (rating == null) return null
  if (rating >= 4) return "positive"
  if (rating <= 2) return "negative"
  return "neutral"
}

async function buildReputationContext(project: Project): Promise<{
  ctx: ReputationContext
  reviewCount: number
}> {
  const reviews = await prisma.review.findMany({
    where: { integration: { projectId: project.id } },
    include: { integration: { select: { platform: true } } },
    orderBy: { publishedAt: "desc" },
    take: 200,
  })

  const stats = await prisma.socialStat.findMany({
    where: { integration: { projectId: project.id } },
    include: { integration: { select: { platform: true } } },
    orderBy: { date: "asc" },
    take: 400,
  })

  const mapReview = (r: (typeof reviews)[number]): ReputationReview => ({
    platform: r.integration.platform,
    rating: r.rating,
    author: r.author,
    text: r.text,
    hasReply: !!r.reply,
    sentiment: r.sentiment ?? sentimentFromRating(r.rating),
    publishedAt: r.publishedAt.toISOString(),
  })

  const byPlatformReviews = (platform: Platform): ReputationReview[] =>
    reviews.filter((r) => r.integration.platform === platform).map(mapReview)

  const mapStat = (s: (typeof stats)[number]): ReputationSocialStat => ({
    platform: s.integration.platform,
    followers: s.followers,
    reach: s.reach,
    engagement: s.engagement,
    views: s.views,
    clicks: s.clicks,
  })

  const byPlatformStats = (platform: Platform): ReputationSocialStat[] =>
    stats.filter((s) => s.integration.platform === platform).map(mapStat)

  const ctx: ReputationContext = {
    projectName: project.name,
    niche: project.niche ?? "",
    yandexReviews: byPlatformReviews("YANDEX_MAPS"),
    twoGisReviews: byPlatformReviews("TWOGIS"),
    vkStats: byPlatformStats("VK"),
    telegramStats: byPlatformStats("TELEGRAM"),
    avitoStats: byPlatformStats("AVITO"),
  }

  return { ctx, reviewCount: reviews.length }
}

export async function generateReputationAnalysis(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const { ctx, reviewCount } = await buildReputationContext(project)

  const inputHash = computeInputHash({
    type: "REPUTATION_ANALYSIS",
    projectId: project.id,
    reviewCount,
    vk: ctx.vkStats.length,
    tg: ctx.telegramStats.length,
    avito: ctx.avitoStats.length,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "REPUTATION_ANALYSIS")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await generateStructured({
    system: reputationSystem,
    user: buildReputationInput(ctx),
    schema: reputationAnalysisSchema,
    toolName: "save_reputation_analysis",
    toolDescription: "Сохранить анализ репутации компании",
    maxTokens: 3000,
  })

  const version = await getNextVersion(project.id, "REPUTATION_ANALYSIS")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "REPUTATION_ANALYSIS",
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
