import { FlaskConical } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { HypothesesView } from "@/components/hypotheses/hypotheses-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getHypotheses } from "@/lib/actions/hypotheses"
import { getChannels } from "@/lib/actions/channels"

export default async function HypothesesPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={FlaskConical}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы вести гипотезы."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={FlaskConical}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const [hypotheses, channelItems] = await Promise.all([
    getHypotheses(project.id),
    getChannels(project.id),
  ])
  const channels = channelItems.map((c) => c.name)

  return (
    <HypothesesView
      projectId={project.id}
      initialHypotheses={hypotheses}
      channels={channels}
    />
  )
}
