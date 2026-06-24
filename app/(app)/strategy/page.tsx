import { ChartLine } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import {
  StrategyView,
  type StrategyEntry,
} from "@/components/strategy/strategy-view"
import { getProject } from "@/lib/actions/projects"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { prisma } from "@/lib/prisma"
import { strategySchema, horizonValues } from "@/lib/ai/schemas/strategy"
import { horizonArtifactType } from "@/lib/services/strategy.service"

export default async function StrategyPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={ChartLine}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы построить стратегию."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={ChartLine}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  // Load the latest artifact + done-task keys for each horizon.
  const entries: Record<number, StrategyEntry | null> = {}
  for (const horizon of horizonValues) {
    const type = horizonArtifactType(horizon)
    const artifact = await prisma.aiArtifact.findFirst({
      where: { projectId: project.id, type },
      orderBy: { version: "desc" },
      include: { tasks: { where: { done: true }, select: { taskKey: true } } },
    })

    if (!artifact) {
      entries[horizon] = null
      continue
    }

    const parsed = strategySchema.safeParse(artifact.payload)
    entries[horizon] = parsed.success
      ? {
          artifactId: artifact.id,
          version: artifact.version,
          data: parsed.data,
          doneKeys: artifact.tasks.map((t) => t.taskKey),
        }
      : null
  }

  return <StrategyView projectId={project.id} entries={entries} />
}
