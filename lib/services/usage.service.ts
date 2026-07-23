import { prisma } from "@/lib/prisma"
import { PLAN_LIMITS, getEffectivePlan, type PlanName } from "@/lib/config/plans"

export interface UsageInfo {
  generationsUsed: number
  generationsLimit: number
  planName: PlanName
  isUnlimited: boolean
  planExpiresAt: Date | null
}

export async function getUsageThisMonth(userId: string): Promise<UsageInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  })

  const planName = getEffectivePlan((user?.plan ?? "FREE") as PlanName, user?.planExpiresAt ?? null)
  const limits = PLAN_LIMITS[planName]

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const userProjects = await prisma.project.findMany({
    where: { userId },
    select: { id: true },
  })
  const projectIds = userProjects.map((p) => p.id)

  const generationsUsed =
    projectIds.length === 0
      ? 0
      : await prisma.aiArtifact.count({
          where: {
            projectId: { in: projectIds },
            createdAt: { gte: startOfMonth },
          },
        })

  return {
    generationsUsed,
    generationsLimit: limits.maxGenerationsPerMonth,
    planName,
    isUnlimited: limits.maxGenerationsPerMonth === Infinity,
    planExpiresAt: user?.planExpiresAt ?? null,
  }
}
