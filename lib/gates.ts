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
      reason: `На плане Free доступен 1 проект с неограниченными AI-генерациями. Перейдите на Pro чтобы вести несколько проектов или клиентов.`,
    }
  }
  return { allowed: true }
}

// FREE = unlimited AI generations within 1 project.
// Upsell trigger = creating a 2nd project (canCreateProject).
export async function canGenerateAi(userId: string): Promise<GateResult> {
  const usage = await getUsageThisMonth(userId)
  if (usage.isUnlimited) return { allowed: true }

  // Only block if a finite limit is explicitly set (future plans)
  if (
    usage.generationsLimit !== Infinity &&
    usage.generationsUsed >= usage.generationsLimit
  ) {
    return {
      allowed: false,
      reason: `Достигнут лимит генераций (${usage.generationsUsed}/${usage.generationsLimit}). Перейдите на Pro.`,
    }
  }
  return { allowed: true }
}
