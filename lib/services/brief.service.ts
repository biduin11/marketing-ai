import type { Project, BriefType } from "@prisma/client"
import { routeAI } from "@/lib/ai/router"
import { briefContentSchema, type BriefContent } from "@/lib/ai/schemas/brief"
import { briefsSystem, buildBriefInput, type CompanyCard } from "@/lib/ai/prompts/briefs"
import type { PsychotypeKey } from "@/lib/ai/schemas/objections"

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

export async function generateBriefContent(
  project: Project,
  type: BriefType,
  task: string,
  psychotype: PsychotypeKey
): Promise<{ content: BriefContent; model: string }> {
  const card = toCard(project)

  const { data, model } = await routeAI({
    task: "BRIEFS",
    system: briefsSystem,
    prompt: buildBriefInput(card, type, task, psychotype),
    schema: briefContentSchema,
  })

  return { content: data, model }
}
