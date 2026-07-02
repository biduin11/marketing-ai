import { Star } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { ReputationView } from "@/components/reputation/reputation-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { listIntegrations } from "@/lib/actions/integrations"
import { prisma } from "@/lib/prisma"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { sentimentFromRating } from "@/lib/services/reputation.service"
import { reputationAnalysisSchema } from "@/lib/ai/schemas/reputation"

export default async function ReputationPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Star}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы отслеживать репутацию."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Star}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const [integrations, reviews, socialStats, artifact] = await Promise.all([
    listIntegrations(projectId),
    prisma.review.findMany({
      where: { integration: { projectId } },
      include: { integration: { select: { platform: true } } },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
    prisma.socialStat.findMany({
      where: { integration: { projectId } },
      include: { integration: { select: { platform: true } } },
      orderBy: { date: "asc" },
      take: 400,
    }),
    getLatestArtifact(projectId, "REPUTATION_ANALYSIS"),
  ])

  const reviewItems = reviews.map((r) => ({
    id: r.id,
    platform: r.integration.platform,
    author: r.author,
    rating: r.rating,
    text: r.text,
    reply: r.reply,
    sentiment: r.sentiment ?? sentimentFromRating(r.rating),
    publishedAt: r.publishedAt.toISOString(),
  }))

  const statItems = socialStats.map((s) => ({
    platform: s.integration.platform,
    date: s.date.toISOString(),
    followers: s.followers,
    reach: s.reach,
    engagement: s.engagement,
    views: s.views,
    clicks: s.clicks,
  }))

  const parsed = artifact ? reputationAnalysisSchema.safeParse(artifact.payload) : null
  const analysis = parsed?.success ? parsed.data : null

  return (
    <ReputationView
      projectId={projectId}
      hasIntegrations={integrations.length > 0}
      reviews={reviewItems}
      socialStats={statItems}
      analysis={analysis}
      analysisVersion={artifact?.version ?? null}
    />
  )
}
