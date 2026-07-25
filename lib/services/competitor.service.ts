import { z } from "zod"
import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import type { PlanName } from "@/lib/config/plans"
import { competitorAnalysisSchema } from "@/lib/ai/schemas/competitorAnalysis"
import {
  competitorAnalysisSystem,
  buildCompetitorAnalysisInput,
  type CompanyCard,
  type CompetitorDetail,
} from "@/lib/ai/prompts/competitorAnalysis"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"
import { tavilyMultiSearch, formatSearchResultsForPrompt } from "@/lib/services/tavily.service"

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

const competitorDetailedRawSchema = z.array(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    site: z.string().optional(),
    vk: z.string().optional(),
    telegram: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
    yandexMaps: z.string().optional(),
    twogis: z.string().optional(),
  })
)

const LINK_KEYS = ["site", "vk", "telegram", "instagram", "youtube", "tiktok", "yandexMaps", "twogis"] as const

/** Parses the questionnaire's per-competitor links (site/socials/maps + description) from Json. */
function parseCompetitorsDetailed(raw: Project["competitorsDetailed"]): CompetitorDetail[] {
  const parsed = competitorDetailedRawSchema.safeParse(raw)
  if (!parsed.success) return []
  return parsed.data
    .filter((c) => c.name?.trim() || LINK_KEYS.some((key) => c[key]?.trim()))
    .map((c) => ({
      name: c.name?.trim() || "Без названия",
      description: c.description?.trim() || null,
      site: c.site?.trim() || null,
      vk: c.vk?.trim() || null,
      telegram: c.telegram?.trim() || null,
      instagram: c.instagram?.trim() || null,
      youtube: c.youtube?.trim() || null,
      tiktok: c.tiktok?.trim() || null,
      yandexMaps: c.yandexMaps?.trim() || null,
      twogis: c.twogis?.trim() || null,
    }))
}

function buildCompetitorQueries(card: CompanyCard, detailed: CompetitorDetail[]): string[] {
  const city = card.regions.length ? card.regions[0] : ""
  const mainProduct = card.products.length ? card.products[0] : card.niche ?? "услуга"

  const queries = [`${mainProduct} ${city}`.trim(), `${mainProduct} ${city} лучшие компании`.trim()]

  if (detailed.length > 0) {
    for (const c of detailed) {
      queries.push(`${c.name} ${city} отзывы`.trim())
      queries.push(`${c.name} авито ${city}`.trim())
      const links = [c.site, c.yandexMaps, c.twogis, c.vk, c.telegram, c.instagram, c.youtube, c.tiktok].filter(
        (v): v is string => Boolean(v)
      )
      if (links.length > 0) {
        queries.push(...links)
      } else {
        queries.push(`${c.name} сайт`, `${c.name} Instagram ВКонтакте Telegram`)
      }
    }
  } else {
    for (const name of card.competitors) {
      queries.push(`${name} ${city} отзывы`.trim())
      queries.push(`${name} сайт`, `${name} Instagram ВКонтакте Telegram`)
    }
  }

  return queries
}

export async function generateCompetitorAnalysis(
  project: Project,
  plan: PlanName,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const detailed = parseCompetitorsDetailed(project.competitorsDetailed)
  const inputHash = computeInputHash({ type: "COMPETITOR_ANALYSIS", card, detailed, plan })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "COMPETITOR_ANALYSIS")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const queries = buildCompetitorQueries(card, detailed)
  const searchResults = await tavilyMultiSearch(queries)
  const searchContext = `

РЕЗУЛЬТАТЫ ПОИСКА В ИНТЕРНЕТЕ:
${formatSearchResultsForPrompt(searchResults)}`

  const { data, model } = await routeAI({
    task: "COMPETITORS",
    plan,
    system: competitorAnalysisSystem,
    prompt: buildCompetitorAnalysisInput(card, detailed) + searchContext,
    schema: competitorAnalysisSchema,
    maxTokens: 16000,
  })

  const version = await getNextVersion(project.id, "COMPETITOR_ANALYSIS")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "COMPETITOR_ANALYSIS",
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
