import type { Project } from "@prisma/client"
import { routeAI } from "@/lib/ai/router"
import {
  objectionResponseSchema,
  type ObjectionResponses,
} from "@/lib/ai/schemas/objections"
import {
  objectionsSystem,
  buildObjectionInput,
  type CompanyCard,
} from "@/lib/ai/prompts/objections"

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

export async function generateObjectionResponses(
  project: Project,
  objectionText: string
): Promise<{ payload: ObjectionResponses; model: string }> {
  const card = toCard(project)

  const { data, model } = await routeAI({
    task: "OBJECTIONS",
    system: objectionsSystem,
    prompt: buildObjectionInput(card, objectionText),
    schema: objectionResponseSchema,
  })

  return { payload: data, model }
}
