import type { Project, AiArtifact, ArtifactType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { strategySchema, type Horizon } from "@/lib/ai/schemas/strategy"
import {
  strategySystem,
  buildStrategyInput,
} from "@/lib/ai/prompts/strategy"
import { type CompanyCard } from "@/lib/ai/prompts/companyAnalysis"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"

const horizonToType: Record<Horizon, ArtifactType> = {
  30: "STRATEGY_30",
  90: "STRATEGY_90",
  180: "STRATEGY_180",
  365: "STRATEGY_365",
}

export function horizonArtifactType(horizon: Horizon): ArtifactType {
  return horizonToType[horizon]
}

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

/**
 * Generates (or returns cached) strategy for a project + horizon.
 * Cache key includes the horizon, so each horizon is tracked independently.
 */
export async function generateStrategy(
  project: Project,
  horizon: Horizon,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const type = horizonToType[horizon]
  const inputHash = computeInputHash({ type, horizon, card })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, type)
    if (latest && latest.inputHash === inputHash) {
      return latest
    }
  }

  const { data, model } = await routeAI({
    task: "STRATEGY",
    system: strategySystem,
    prompt: buildStrategyInput(card, horizon),
    schema: strategySchema,
  })

  const version = await getNextVersion(project.id, type)

  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type,
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
