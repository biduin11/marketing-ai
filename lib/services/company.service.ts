import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { companyAnalysisSchema } from "@/lib/ai/schemas/companyAnalysis"
import {
  companyAnalysisSystem,
  buildCompanyAnalysisInput,
  type CompanyCard,
} from "@/lib/ai/prompts/companyAnalysis"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"
import {
  appendAiContext,
  attachAiContextMetadata,
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

/**
 * Generates (or returns cached) company analysis for a project.
 * - If a COMPANY_ANALYSIS artifact with the same input hash exists and
 *   `force` is false, it is returned without calling the AI.
 * - Otherwise a new version is generated and persisted.
 */
export async function generateCompanyAnalysis(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const context = await loadAiGenerationContext(project, "COMPANY_ANALYSIS")
  const inputHash = computeInputHash({
    type: "COMPANY_ANALYSIS",
    context: context.contextFingerprint,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "COMPANY_ANALYSIS")
    if (latest && latest.inputHash === inputHash) {
      return latest
    }
  }

  const { data, model } = await routeAI({
    task: "COMPANY_ANALYSIS",
    system: companyAnalysisSystem,
    prompt: appendAiContext(buildCompanyAnalysisInput(card), context),
    schema: companyAnalysisSchema,
  })

  const version = await getNextVersion(project.id, "COMPANY_ANALYSIS")

  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "COMPANY_ANALYSIS",
      version,
      payload: attachAiContextMetadata(data, context),
      model,
      inputHash,
    },
  })
}
