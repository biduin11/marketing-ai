import { ClipboardList } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { BriefsView } from "@/components/briefs/briefs-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getBriefs } from "@/lib/actions/briefs"

export default async function BriefsPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={ClipboardList}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы создавать брифы."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={ClipboardList}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const briefs = await getBriefs(project.id)

  return <BriefsView projectId={project.id} initialBriefs={briefs} />
}
