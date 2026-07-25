import { prisma } from "@/lib/prisma"
import { PLAN_LIMITS, getEffectivePlan, type PlanName } from "@/lib/config/plans"
import { getUsageThisMonth } from "@/lib/services/usage.service"
import { AI_TASKS, type AITask } from "@/lib/ai/models"

export interface GateResult {
  allowed: boolean
  reason?: string
  plan: PlanName
}

export async function canCreateProject(userId: string): Promise<GateResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  })

  const planName = getEffectivePlan((user?.plan ?? "FREE") as PlanName, user?.planExpiresAt ?? null)
  const limits = PLAN_LIMITS[planName]

  if (limits.maxProjects === Infinity) return { allowed: true, plan: planName }

  const count = await prisma.project.count({ where: { userId } })
  if (count >= limits.maxProjects) {
    return {
      allowed: false,
      reason: `На плане Free доступен 1 проект с неограниченными AI-генерациями. Перейдите на Pro чтобы вести несколько проектов или клиентов.`,
      plan: planName,
    }
  }
  return { allowed: true, plan: planName }
}

// Pass `task` when the caller knows which AI_TASKS entry it's about to run —
// tasks with requiresSearch (COMPETITORS/REPUTATION/MARKET) are gated on the
// plan's webSearch flag before the monthly generation count is checked.
export async function canGenerateAi(userId: string, task?: AITask): Promise<GateResult> {
  const usage = await getUsageThisMonth(userId)

  if (task && AI_TASKS[task].requiresSearch && !PLAN_LIMITS[usage.planName].webSearch) {
    return {
      allowed: false,
      reason: "Анализ рынка, конкурентов и репутации доступен на тарифах Pro и Max. Перейдите на Pro.",
      plan: usage.planName,
    }
  }

  if (usage.isUnlimited) return { allowed: true, plan: usage.planName }

  // Only block if a finite limit is explicitly set (future plans)
  if (
    usage.generationsLimit !== Infinity &&
    usage.generationsUsed >= usage.generationsLimit
  ) {
    return {
      allowed: false,
      reason: `Достигнут лимит генераций (${usage.generationsUsed}/${usage.generationsLimit}). Перейдите на Pro.`,
      plan: usage.planName,
    }
  }
  return { allowed: true, plan: usage.planName }
}
