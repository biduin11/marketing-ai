import { Route } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { JourneyView } from "@/components/journey/journey-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { cjmSchema } from "@/lib/ai/schemas/cjm"

export default async function JourneyPage(): Promise<React.JSX.Element> {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Route}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы построить карту пути клиента."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Route}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const artifact = await getLatestArtifact(project.id, "CJM")
  const parsed = artifact ? cjmSchema.safeParse(artifact.payload) : null

  return (
    <JourneyView
      projectId={project.id}
      cjm={parsed?.success ? parsed.data : null}
      version={artifact?.version ?? null}
      cjmCreatedAt={artifact?.createdAt.toISOString() ?? null}
    />
  )
}
