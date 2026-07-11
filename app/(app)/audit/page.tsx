import { ClipboardCheck } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { AuditView } from "@/components/audit/audit-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getAudits } from "@/lib/actions/audit"

export default async function AuditPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={ClipboardCheck}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы пройти экспресс-аудит."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={ClipboardCheck}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const audits = await getAudits(project.id)

  return <AuditView projectId={project.id} initialAudits={audits} />
}
