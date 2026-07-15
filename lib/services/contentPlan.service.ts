import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { contentPlanSchema } from "@/lib/ai/schemas/contentPlan"
import {
  contentPlanSystem,
  buildContentPlanInput,
  type CompanyCard,
} from "@/lib/ai/prompts/contentPlan"
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

export async function generateContentPlan(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)

  const platformRows = await prisma.contentPlatform.findMany({
    where: { projectId: project.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { name: true, share: true },
  })
  const platforms = platformRows.map((p) => ({ name: p.name, share: p.share }))
  const context = await loadAiGenerationContext(project, "CONTENT_PLAN")

  const inputHash = computeInputHash({
    type: "CONTENT_PLAN",
    platforms,
    context: context.contextFingerprint,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "CONTENT_PLAN")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await routeAI({
    task: "CONTENT_PLAN",
    system: contentPlanSystem,
    prompt: appendAiContext(buildContentPlanInput(card, platforms), context),
    schema: contentPlanSchema,
    maxTokens: 16000,
  })

  const version = await getNextVersion(project.id, "CONTENT_PLAN")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "CONTENT_PLAN",
      version,
      payload: attachAiContextMetadata(data, context),
      model,
      inputHash,
    },
  })
}
