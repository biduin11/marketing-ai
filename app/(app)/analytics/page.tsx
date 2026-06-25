import { BarChart3 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { listMetrics } from "@/lib/actions/metrics"
import { getChannels } from "@/lib/actions/channels"

export default async function AnalyticsPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы видеть аналитику."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const [metrics, channelItems] = await Promise.all([
    listMetrics(projectId),
    getChannels(projectId),
  ])

  const channels = channelItems.map((c) => c.name)

  return <AnalyticsView projectId={project.id} metrics={metrics} channels={channels} />
}
