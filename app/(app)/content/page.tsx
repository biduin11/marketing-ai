import { LayoutList } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { ContentView } from "@/components/content/content-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getContentPlatforms } from "@/lib/actions/content-platforms"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { contentPlanSchema } from "@/lib/ai/schemas/contentPlan"

export default async function ContentPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={LayoutList}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы сгенерировать контент-план."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={LayoutList}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const artifact = await getLatestArtifact(project.id, "CONTENT_PLAN")
  const parsed = artifact ? contentPlanSchema.safeParse(artifact.payload) : null
  const platforms = await getContentPlatforms(project.id)

  return (
    <ContentView
      projectId={project.id}
      plan={parsed?.success ? parsed.data : null}
      version={artifact?.version ?? null}
      platforms={platforms}
    />
  )
}
