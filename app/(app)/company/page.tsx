import { Building2 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { CompanyView } from "@/components/company/company-view"
import { getProject } from "@/lib/actions/projects"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { companyAnalysisSchema } from "@/lib/ai/schemas/companyAnalysis"
import type { CompanyAnalysis } from "@/lib/ai/schemas/companyAnalysis"

export default async function CompanyPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Building2}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы провести анализ компании."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Building2}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const artifact = await getLatestArtifact(project.id, "COMPANY_ANALYSIS")

  let analysis: CompanyAnalysis | null = null
  if (artifact) {
    const parsed = companyAnalysisSchema.safeParse(artifact.payload)
    if (parsed.success) analysis = parsed.data
  }

  return (
    <CompanyView
      project={project}
      analysis={analysis}
      version={artifact?.version ?? null}
    />
  )
}
