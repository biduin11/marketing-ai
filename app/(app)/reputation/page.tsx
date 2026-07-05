import { Star } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { ReputationView } from "@/components/reputation/reputation-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getLatestReputationSnapshot } from "@/lib/services/reputation.service"
import { reputationSchema } from "@/lib/ai/schemas/reputation"

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

  const snapshot = await getLatestReputationSnapshot(project.id)
  const parsed = snapshot ? reputationSchema.safeParse(snapshot.payload) : null

  return (
    <ReputationView
      projectId={project.id}
      reputation={parsed?.success ? parsed.data : null}
      searchedAt={snapshot?.createdAt.toISOString() ?? null}
    />
  )
}
