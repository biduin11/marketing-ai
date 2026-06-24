import { FolderOpen, Plus } from "lucide-react"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { listProjects } from "@/lib/actions/projects"
import { listMetrics } from "@/lib/actions/metrics"
import { prisma } from "@/lib/prisma"
import { getLatestArtifact } from "@/lib/services/artifacts"
import {
  computeSummary,
  computeChannelBreakdown,
  filterByRange,
} from "@/lib/services/analytics.service"
import { directorAnalysisSchema } from "@/lib/ai/schemas/directorAnalysis"
import { EmptyState } from "@/components/empty-state"
import { NewProjectDialog } from "@/components/new-project-dialog"
import { ProjectCard } from "@/components/project-card"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export default async function HomePage() {
  const [projectId, projects] = await Promise.all([
    getActiveProjectId(),
    listProjects(),
  ])

  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={FolderOpen}
          title="Нет проектов"
          description="Создайте первый проект, чтобы начать работу с AI Marketing OS"
          action={
            <NewProjectDialog
              trigger={
                <div className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
                  <Plus className="size-3.5" />
                  Создать первый проект
                </div>
              }
            />
          }
        />
      </div>
    )
  }

  if (!projectId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Проекты</h2>
          <p className="text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "проект" : "проектов"}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    )
  }

  const [project, metrics, directorArtifact] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    listMetrics(projectId),
    getLatestArtifact(projectId, "DIRECTOR_DAILY"),
  ])

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={FolderOpen}
          title="Проект не найден"
          description="Выберите проект в боковой панели"
        />
      </div>
    )
  }

  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const recentMetrics = filterByRange(metrics, from, to)

  const summary = recentMetrics.length > 0 ? computeSummary(recentMetrics) : null
  const channels = recentMetrics.length > 0
    ? computeChannelBreakdown(recentMetrics).sort((a, b) => b.roi - a.roi)
    : []

  const parseResult = directorArtifact
    ? directorAnalysisSchema.safeParse(directorArtifact.payload)
    : null
  const analysis = parseResult?.success ? parseResult.data : null

  return (
    <DashboardView
      projectId={projectId}
      projectName={project.name}
      analysis={analysis}
      summary={summary}
      channels={channels}
    />
  )
}
