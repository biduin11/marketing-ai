import { z } from "zod"
import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateStructured } from "@/lib/ai/generate"
import { AI_MODELS } from "@/lib/ai/client"
import { productAnalysisSchema } from "@/lib/ai/schemas/product"
import {
  productAnalysisSystem,
  buildProductAnalysisInput,
  type ProductCompanyContext,
} from "@/lib/ai/prompts/product"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"

const productDetailedRawSchema = z.array(
  z.object({
    name: z.string().optional(),
    margin: z.number().optional(),
    salesShare: z.number().optional(),
    stage: z.string().optional(),
  })
)

function parseProductsDetailed(
  raw: Project["productsDetailed"]
): ProductCompanyContext["productsDetailed"] {
  const parsed = productDetailedRawSchema.safeParse(raw)
  if (!parsed.success) return []
  return parsed.data
    .filter((p) => p.name?.trim())
    .map((p) => ({
      name: p.name?.trim() || "Без названия",
      margin: p.margin ?? null,
      salesShare: p.salesShare ?? null,
      stage: p.stage?.trim() || null,
    }))
}

function toContext(project: Project): ProductCompanyContext {
  return {
    name: project.name,
    niche: project.niche,
    products: project.products,
    regions: project.regions,
    avgCheck: project.avgCheck,
    margin: project.margin,
    productsDetailed: parseProductsDetailed(project.productsDetailed),
  }
}

export async function generateProductAnalysis(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const context = toContext(project)
  const inputHash = computeInputHash({ type: "PRODUCT_ANALYSIS", context })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "PRODUCT_ANALYSIS")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { data, model } = await generateStructured({
    system: productAnalysisSystem,
    user: buildProductAnalysisInput(context),
    schema: productAnalysisSchema,
    toolName: "save_product_analysis",
    toolDescription: "Сохранить структурированный анализ продуктового портфеля",
    model: AI_MODELS.ANALYSIS,
    maxTokens: 16000,
  })

  const version = await getNextVersion(project.id, "PRODUCT_ANALYSIS")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "PRODUCT_ANALYSIS",
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
