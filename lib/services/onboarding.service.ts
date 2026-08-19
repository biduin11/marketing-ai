import { ArtifactType } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export interface QuickStartStep {
  id: string
  label: string
  href: string
  done: boolean
}

/**
 * Aggregates quick-start checklist progress across ALL of the user's projects
 * (not just the active one) — no dedicated counters, derived from existing data.
 */
export async function getQuickStartProgress(userId: string): Promise<QuickStartStep[]> {
  const projectIds = (
    await prisma.project.findMany({
      where: { userId },
      select: { id: true },
    })
  ).map((p) => p.id)

  const hasProject = projectIds.length > 0

  const [strategyCount, cjmCount, contentPlanCount, clientAccessCount] = hasProject
    ? await Promise.all([
        prisma.aiArtifact.count({
          where: {
            projectId: { in: projectIds },
            type: {
              in: [
                ArtifactType.STRATEGY_30,
                ArtifactType.STRATEGY_90,
                ArtifactType.STRATEGY_180,
                ArtifactType.STRATEGY_365,
              ],
            },
          },
        }),
        prisma.aiArtifact.count({
          where: { projectId: { in: projectIds }, type: ArtifactType.CJM },
        }),
        prisma.aiArtifact.count({
          where: { projectId: { in: projectIds }, type: ArtifactType.CONTENT_PLAN },
        }),
        prisma.clientAccess.count({
          where: { projectId: { in: projectIds } },
        }),
      ])
    : [0, 0, 0, 0]

  return [
    { id: "project", label: "Проект создан", href: "/", done: hasProject },
    { id: "strategy", label: "Стратегия сгенерирована", href: "/strategy", done: strategyCount > 0 },
    { id: "cjm", label: "CJM построена", href: "/journey", done: cjmCount > 0 },
    { id: "content", label: "Контент-план готов", href: "/content", done: contentPlanCount > 0 },
    { id: "client-access", label: "Кабинет клиента создан", href: "/settings", done: clientAccessCount > 0 },
  ]
}
