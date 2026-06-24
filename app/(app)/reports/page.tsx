import { FileText } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { ReportsView } from "@/components/reports/reports-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { executiveReportSchema } from "@/lib/ai/schemas/executiveReport"

export default async function ReportsPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы генерировать отчёты."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const [weeklyArtifact, monthlyArtifact, quarterlyArtifact] = await Promise.all([
    getLatestArtifact(project.id, "REPORT_WEEKLY"),
    getLatestArtifact(project.id, "REPORT_MONTHLY"),
    getLatestArtifact(project.id, "REPORT_QUARTERLY"),
  ])

  function parseArtifact(artifact: typeof weeklyArtifact) {
    if (!artifact) return null
    const parsed = executiveReportSchema.safeParse(artifact.payload)
    return parsed.success
      ? { report: parsed.data, id: artifact.id, version: artifact.version }
      : null
  }

  return (
    <ReportsView
      projectId={project.id}
      weekly={parseArtifact(weeklyArtifact)}
      monthly={parseArtifact(monthlyArtifact)}
      quarterly={parseArtifact(quarterlyArtifact)}
    />
  )
}
