import type { Project } from "@prisma/client"
import { routeAI } from "@/lib/ai/router"
import type { PlanName } from "@/lib/config/plans"
import { expressAuditSchema, type ExpressAuditResult } from "@/lib/ai/schemas/express-audit"
import { expressAuditSystem, buildExpressAuditInput, type CompanyCard } from "@/lib/ai/prompts/express-audit"
import { buildSystemPrompt } from "@/lib/marketing-skills"

function toCard(project: Project): CompanyCard {
  return {
    name: project.name,
    niche: project.niche,
    website: project.website,
    regions: project.regions,
    products: project.products,
    competitors: project.competitors,
    budget: project.budget,
    goals: project.goals,
    socials: project.socials,
  }
}

export async function generateExpressAudit(
  project: Project,
  plan: PlanName,
  answers: Record<string, number>
): Promise<{ payload: ExpressAuditResult; model: string }> {
  const card = toCard(project)

  const skillsPrompt = await buildSystemPrompt({
    featureId: "express-audit",
    userQuery: `${card.niche}. Цели: ${card.goals}`,
  })

  const system = skillsPrompt ? `${expressAuditSystem}\n\n---\n\n${skillsPrompt}` : expressAuditSystem

  const { data, model } = await routeAI({
    task: "EXPRESS_AUDIT",
    plan,
    system,
    prompt: buildExpressAuditInput(card, answers),
    schema: expressAuditSchema,
  })

  return { payload: data, model }
}
