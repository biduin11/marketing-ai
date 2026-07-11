import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { platformUtpSchema } from "@/lib/ai/schemas/platform-utp"
import type { PlatformKey } from "@/lib/ai/schemas/platform-utp"
import {
  platformUtpSystem,
  buildPlatformUtpInput,
  type CompanyCard,
} from "@/lib/ai/prompts/platform-utp"
import { getNextVersion } from "@/lib/services/artifacts"

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

/** Latest PLATFORM_UTP artifact for a specific platform, or null if never generated. */
export async function getLatestPlatformUtp(
  projectId: string,
  platform: PlatformKey
): Promise<AiArtifact | null> {
  return prisma.aiArtifact.findFirst({
    where: {
      projectId,
      type: "PLATFORM_UTP",
      payload: { path: ["platform"], equals: platform },
    },
    orderBy: { version: "desc" },
  })
}

/** Always generates a new version — no inputHash caching, generation is manual-only. */
export async function generatePlatformUtp(
  project: Project,
  platform: PlatformKey
): Promise<AiArtifact> {
  const card = toCard(project)

  const { data, model } = await routeAI({
    task: "PLATFORM_UTP",
    system: platformUtpSystem,
    prompt: buildPlatformUtpInput(card, platform),
    schema: platformUtpSchema,
  })

  // Overwrite the AI's free-text platform name with our canonical key —
  // getLatestPlatformUtp() filters on this exact value.
  const payload = { ...data, platform }
  const version = await getNextVersion(project.id, "PLATFORM_UTP")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "PLATFORM_UTP",
      version,
      payload,
      model,
      inputHash: "manual",
    },
  })
}
