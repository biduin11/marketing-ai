import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { offerSchema } from "@/lib/ai/schemas/offer"
import {
  offerSystem,
  buildOfferInput,
  type CompanyCard,
} from "@/lib/ai/prompts/offer"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"

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

export async function generateOffer(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const inputHash = computeInputHash({ type: "OFFER", card })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "OFFER")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await routeAI({
    task: "OFFERS",
    system: offerSystem,
    prompt: buildOfferInput(card),
    schema: offerSchema,
  })

  const version = await getNextVersion(project.id, "OFFER")
  return prisma.aiArtifact.create({
    data: { projectId: project.id, type: "OFFER", version, payload: data, model, inputHash },
  })
}
