import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { cjmSchema } from "@/lib/ai/schemas/cjm"
import {
  cjmSystem,
  buildCjmInput,
  type CompanyCard,
} from "@/lib/ai/prompts/cjm"
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

export async function generateCjm(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const inputHash = computeInputHash({ type: "CJM", card })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "CJM")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await routeAI({
    task: "CJM",
    system: cjmSystem,
    prompt: buildCjmInput(card),
    schema: cjmSchema,
    maxTokens: 8000,
  })

  const version = await getNextVersion(project.id, "CJM")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "CJM",
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
