import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import type { PlanName } from "@/lib/config/plans"
import { cjmSchema } from "@/lib/ai/schemas/cjm"
import {
  cjmSystem,
  buildCjmInput,
  type CompanyCard,
} from "@/lib/ai/prompts/cjm"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"
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

export async function generateCjm(
  project: Project,
  plan: PlanName,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)

  const skillsPrompt = await buildSystemPrompt({
    featureId: "cjm",
    userQuery: `${card.niche}. Цели: ${card.goals}`,
  })

  const inputHash = computeInputHash({ type: "CJM", card, plan, skillsPrompt })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "CJM")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const system = skillsPrompt ? `${cjmSystem}\n\n---\n\n${skillsPrompt}` : cjmSystem

  const { data, model } = await routeAI({
    task: "CJM",
    plan,
    system,
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
