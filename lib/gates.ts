import { prisma } from "@/lib/prisma"
import { PLAN_LIMITS, type PlanName } from "@/lib/config/plans"
import { getUsageThisMonth } from "@/lib/services/usage.service"

export interface GateResult {
  allowed: boolean
  reason?: string
}

export async function canCreateProject(userId: string): Promise<GateResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  const planName = (user?.plan ?? "FREE") as PlanName
  const limits = PLAN_LIMITS[planName]

  if (limits.maxProjects === Infinity) return { allowed: true }

  const count = await prisma.project.count({ where: { userId } })
  if (count >= limits.maxProjects) {
    return {
      allowed: false,
      reason: `Достигнут лимит плана Free (${limits.maxProjects} проект). Перейдите на Pro для неограниченного числа проектов.`,
    }
  }
  return { allowed: true }
}

export async function canGenerateAi(userId: string): Promise<GateResult> {
  const usage = await getUsageThisMonth(userId)
  if (usage.isUnlimited) return { allowed: true }

  if (usage.generationsUsed >= usage.generationsLimit) {
    return {
      allowed: false,
      reason: `Достигнут лимит Free (${usage.generationsUsed}/${usage.generationsLimit} генераций в этом месяце). Перейдите на Pro для неограниченных генераций.`,
    }
  }
  return { allowed: true }
}
