import { Tag } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { OffersView } from "@/components/offers/offers-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { offerSchema } from "@/lib/ai/schemas/offer"

export default async function OffersPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Tag}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы создавать офферы."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Tag}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const artifact = await getLatestArtifact(project.id, "OFFER")
  const parsed = artifact ? offerSchema.safeParse(artifact.payload) : null

  return (
    <OffersView
      projectId={project.id}
      offer={parsed?.success ? parsed.data : null}
      version={artifact?.version ?? null}
    />
  )
}
