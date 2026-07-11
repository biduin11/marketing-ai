import { MessageSquareX } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { ObjectionsView } from "@/components/objections/objections-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getObjections } from "@/lib/actions/objections"

export default async function ObjectionsPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={MessageSquareX}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы вести базу возражений."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={MessageSquareX}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const objections = await getObjections(project.id)

  return <ObjectionsView projectId={project.id} initialObjections={objections} />
}
