import { BarChart3 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { listMetrics } from "@/lib/actions/metrics"
import { getChannels } from "@/lib/actions/channels"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { contentPlanSchema } from "@/lib/ai/schemas/contentPlan"
import { audienceSegmentsSchema, buyerPersonaSchema } from "@/lib/ai/schemas/audience"

export default async function AnalyticsPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы видеть аналитику."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const [metrics, channelItems, contentArtifact, audienceArtifact, personaArtifact] =
    await Promise.all([
      listMetrics(projectId),
      getChannels(projectId),
      getLatestArtifact(projectId, "CONTENT_PLAN"),
      getLatestArtifact(projectId, "AUDIENCE_SEGMENTS"),
      getLatestArtifact(projectId, "BUYER_PERSONA"),
    ])

  const channels = channelItems.map((c) => c.name)

  const contentPlanResult = contentArtifact
    ? contentPlanSchema.safeParse(contentArtifact.payload)
    : null
  const audienceResult = audienceArtifact
    ? audienceSegmentsSchema.safeParse(audienceArtifact.payload)
    : null
  const personaResult = personaArtifact
    ? buyerPersonaSchema.safeParse(personaArtifact.payload)
    : null

  return (
    <AnalyticsView
      projectId={project.id}
      metrics={metrics}
      channels={channels}
      budget={project.budget ?? null}
      contentPlan={contentPlanResult?.success ? contentPlanResult.data : null}
      audienceSegments={audienceResult?.success ? audienceResult.data : null}
      buyerPersona={personaResult?.success ? personaResult.data : null}
    />
  )
}
