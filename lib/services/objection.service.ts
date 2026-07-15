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
import {
  appendAiContext,
  loadAiGenerationContext,
} from "@/lib/services/ai-context.service"

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
  const context = await loadAiGenerationContext(project, "PLATFORM_UTP")

  const { data, model } = await routeAI({
    task: "OBJECTIONS",
    system: objectionsSystem,
    prompt: appendAiContext(buildObjectionInput(card, objectionText), context),
    schema: objectionResponseSchema,
  })

  return { payload: data, model }
}
