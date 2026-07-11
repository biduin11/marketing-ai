import type { Project } from "@prisma/client"
import { routeAI } from "@/lib/ai/router"
import { expressAuditSchema, type ExpressAuditResult } from "@/lib/ai/schemas/express-audit"
import { expressAuditSystem, buildExpressAuditInput, type CompanyCard } from "@/lib/ai/prompts/express-audit"

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
  answers: Record<string, number>
): Promise<{ payload: ExpressAuditResult; model: string }> {
  const card = toCard(project)

  const { data, model } = await routeAI({
    task: "EXPRESS_AUDIT",
    system: expressAuditSystem,
    prompt: buildExpressAuditInput(card, answers),
    schema: expressAuditSchema,
  })

  return { payload: data, model }
}
