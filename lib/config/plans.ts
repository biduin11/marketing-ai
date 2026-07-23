export type PlanName = "FREE" | "PRO" | "MAX"

export interface PlanLimits {
  maxProjects: number
  maxGenerationsPerMonth: number
  webSearch: boolean
  price: number
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  FREE: {
    maxProjects: 1,
    maxGenerationsPerMonth: 15,
    webSearch: false,
    price: 0,
  },
  PRO: {
    maxProjects: 10,
    maxGenerationsPerMonth: 100,
    webSearch: true,
    price: 1799,
  },
  MAX: {
    maxProjects: Infinity,
    maxGenerationsPerMonth: Infinity,
    webSearch: true,
    price: 3699,
  },
}

export const PLAN_LABELS: Record<PlanName, string> = {
  FREE: "Free",
  PRO: "Pro",
  MAX: "Max",
}

// planExpiresAt = null means "no expiry set" (manual/never), not "expired" —
// a plan only lapses back to FREE once planExpiresAt is a real past date.
export function getEffectivePlan(plan: PlanName, planExpiresAt: Date | null): PlanName {
  if (planExpiresAt && planExpiresAt < new Date()) return "FREE"
  return plan
}
