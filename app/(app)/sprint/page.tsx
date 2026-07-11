import { CalendarDays } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { SprintView } from "@/components/sprint/sprint-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getCurrentSprint } from "@/lib/actions/sprint"

export default async function SprintPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={CalendarDays}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы планировать спринты."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={CalendarDays}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const sprint = await getCurrentSprint(project.id)

  return <SprintView projectId={project.id} initialSprint={sprint} />
}
