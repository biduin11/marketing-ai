import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { marketAnalysisSchema } from "@/lib/ai/schemas/market"
import {
  marketAnalysisSystem,
  buildMarketAnalysisInput,
  type MarketCompanyContext,
} from "@/lib/ai/prompts/market"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"

function toContext(project: Project): MarketCompanyContext {
  return {
    name: project.name,
    niche: project.niche,
    products: project.products,
    regions: project.regions,
    competitors: project.competitors,
    avgCheck: project.avgCheck,
    margin: project.margin,
  }
}

export async function generateMarketAnalysis(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const context = toContext(project)
  const inputHash = computeInputHash({ type: "MARKET_ANALYSIS", context })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "MARKET_ANALYSIS")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await routeAI({
    task: "MARKET",
    system: marketAnalysisSystem,
    prompt: buildMarketAnalysisInput(context),
    schema: marketAnalysisSchema,
    maxTokens: 16000,
  })

  const version = await getNextVersion(project.id, "MARKET_ANALYSIS")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "MARKET_ANALYSIS",
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
