import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import {
  audienceSegmentsSchema,
  buyerPersonaSchema,
  jtbdSchema,
} from "@/lib/ai/schemas/audience"
import {
  audienceSegmentsSystem,
  buyerPersonaSystem,
  jtbdSystem,
  buildAudienceSegmentsInput,
  buildBuyerPersonaInput,
  buildJtbdInput,
  type CompanyCard,
} from "@/lib/ai/prompts/audience"
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

export async function generateAudienceSegments(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const context = await loadAiGenerationContext(project, "AUDIENCE_SEGMENTS")
  const inputHash = computeInputHash({
    type: "AUDIENCE_SEGMENTS",
    context: context.contextFingerprint,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "AUDIENCE_SEGMENTS")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await routeAI({
    task: "AUDIENCE",
    system: audienceSegmentsSystem,
    prompt: appendAiContext(buildAudienceSegmentsInput(card), context),
    schema: audienceSegmentsSchema,
  })

  const version = await getNextVersion(project.id, "AUDIENCE_SEGMENTS")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "AUDIENCE_SEGMENTS",
      version,
      payload: attachAiContextMetadata(data, context),
      model,
      inputHash,
    },
  })
}

export async function generateBuyerPersona(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const context = await loadAiGenerationContext(project, "BUYER_PERSONA")
  const inputHash = computeInputHash({
    type: "BUYER_PERSONA",
    context: context.contextFingerprint,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "BUYER_PERSONA")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await routeAI({
    task: "AUDIENCE",
    system: buyerPersonaSystem,
    prompt: appendAiContext(buildBuyerPersonaInput(card), context),
    schema: buyerPersonaSchema,
  })

  const version = await getNextVersion(project.id, "BUYER_PERSONA")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "BUYER_PERSONA",
      version,
      payload: attachAiContextMetadata(data, context),
      model,
      inputHash,
    },
  })
}

export async function generateJtbd(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const card = toCard(project)
  const context = await loadAiGenerationContext(project, "JTBD")
  const inputHash = computeInputHash({
    type: "JTBD",
    context: context.contextFingerprint,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "JTBD")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await routeAI({
    task: "AUDIENCE",
    system: jtbdSystem,
    prompt: appendAiContext(buildJtbdInput(card), context),
    schema: jtbdSchema,
  })

  const version = await getNextVersion(project.id, "JTBD")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "JTBD",
      version,
      payload: attachAiContextMetadata(data, context),
      model,
      inputHash,
    },
  })
}
