import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateStructured } from "@/lib/ai/generate"
import { competitorAnalysisSchema } from "@/lib/ai/schemas/competitorAnalysis"
import {
  competitorAnalysisSystem,
  buildCompetitorAnalysisInput,
  type CompanyCard,
} from "@/lib/ai/prompts/competitorAnalysis"
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

export async function generateCompetitorAnalysis(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const inputHash = computeInputHash({ type: "COMPETITOR_ANALYSIS", card })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "COMPETITOR_ANALYSIS")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await generateStructured({
    system: competitorAnalysisSystem,
    user: buildCompetitorAnalysisInput(card),
    schema: competitorAnalysisSchema,
    toolName: "save_competitor_analysis",
    toolDescription: "Сохранить структурированный анализ конкурентов",
  })

  const version = await getNextVersion(project.id, "COMPETITOR_ANALYSIS")
  return prisma.aiArtifact.create({
    data: { projectId: project.id, type: "COMPETITOR_ANALYSIS", version, payload: data, model, inputHash },
  })
}
