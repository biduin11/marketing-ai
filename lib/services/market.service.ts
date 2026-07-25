import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import type { PlanName } from "@/lib/config/plans"
import { marketAnalysisSchema } from "@/lib/ai/schemas/market"
import {
  marketAnalysisSystem,
  buildMarketAnalysisInput,
  type MarketCompanyContext,
} from "@/lib/ai/prompts/market"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"
import { tavilyMultiSearch, formatSearchResultsForPrompt } from "@/lib/services/tavily.service"

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

function buildMarketQueries(context: MarketCompanyContext): string[] {
  const region = context.regions.length ? context.regions[0] : ""
  const niche = context.niche ?? "рынок"
  const mainProduct = context.products.length ? context.products[0] : niche

  return [
    `${niche} рынок ${region} объём 2024 2025`.trim(),
    `${niche} рынок России рост динамика`.trim(),
    `${niche} ${region} компании список`.trim(),
    `${niche} ${region} конкуренты 2ГИС яндекс карты`.trim(),
    `цены ${mainProduct} 2024 2025 динамика`.trim(),
    `${niche} ${region} новости 2025`.trim(),
  ]
}

export async function generateMarketAnalysis(
  project: Project,
  plan: PlanName,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const context = toContext(project)
  const inputHash = computeInputHash({ type: "MARKET_ANALYSIS", context, plan })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "MARKET_ANALYSIS")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const queries = buildMarketQueries(context)
  const searchResults = await tavilyMultiSearch(queries)
  const searchContext = `

РЕЗУЛЬТАТЫ ПОИСКА В ИНТЕРНЕТЕ:
${formatSearchResultsForPrompt(searchResults)}`

  const { data, model } = await routeAI({
    task: "MARKET",
    plan,
    system: marketAnalysisSystem,
    prompt: buildMarketAnalysisInput(context) + searchContext,
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
