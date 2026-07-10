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

  const inputHash = computeInputHash({ type: "CONTENT_PLAN", card, platforms })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "CONTENT_PLAN")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await routeAI({
    task: "CONTENT_PLAN",
    system: contentPlanSystem,
    prompt: buildContentPlanInput(card, platforms),
    schema: contentPlanSchema,
    maxTokens: 16000,
  })

  const version = await getNextVersion(project.id, "CONTENT_PLAN")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "CONTENT_PLAN",
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
