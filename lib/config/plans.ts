export type PlanName = "FREE" | "PRO"

export interface PlanLimits {
  maxProjects: number
  maxGenerationsPerMonth: number
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  FREE: {
    maxProjects: 1,
    maxGenerationsPerMonth: 15,
  },
  PRO: {
    maxProjects: Infinity,
    maxGenerationsPerMonth: Infinity,
  },
}

export const PLAN_LABELS: Record<PlanName, string> = {
  FREE: "Free",
  PRO: "Pro",
}
