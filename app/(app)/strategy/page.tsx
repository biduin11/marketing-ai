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
import { listArtifactVersions } from "@/lib/services/artifacts"

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

  // Load all versions + done-task keys for each horizon.
  const entries: Record<number, StrategyEntry | null> = {}
  const allVersionEntries: Record<number, StrategyEntry[]> = {}

  for (const horizon of horizonValues) {
    const type = horizonArtifactType(horizon)
    const [latestWithTasks, versions] = await Promise.all([
      prisma.aiArtifact.findFirst({
        where: { projectId: project.id, type },
        orderBy: { version: "desc" },
        include: { tasks: { where: { done: true }, select: { taskKey: true } } },
      }),
      listArtifactVersions(project.id, type),
    ])

    const doneKeys = latestWithTasks?.tasks.map((t) => t.taskKey) ?? []

    allVersionEntries[horizon] = versions.flatMap((v) => {
      const parsed = strategySchema.safeParse(v.payload)
      if (!parsed.success) return []
      return [{
        artifactId: v.id,
        version: v.version,
        createdAt: v.createdAt.toISOString(),
        data: parsed.data,
        doneKeys: v.id === latestWithTasks?.id ? doneKeys : [],
      }]
    })

    entries[horizon] = allVersionEntries[horizon][0] ?? null
  }

  return (
    <StrategyView
      projectId={project.id}
      entries={entries}
      allVersionEntries={allVersionEntries}
    />
  )
}
