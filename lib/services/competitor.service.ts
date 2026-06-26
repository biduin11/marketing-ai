import { z } from "zod"
import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { anthropic, AI_MODEL } from "@/lib/ai/client"
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

async function generateWithWebSearch(
  userMessage: string,
  inputSchema: Record<string, unknown>
): Promise<z.infer<typeof competitorAnalysisSchema>> {
  const saveToolDef = {
    name: "save_competitor_analysis",
    description: "Сохранить структурированный анализ конкурентов",
    input_schema: inputSchema as never,
  }

  // web_search_20250305 is a server-side tool — Anthropic executes searches inline
  const response = await anthropic.beta.messages.create({
    model: AI_MODEL,
    max_tokens: 16000,
    system: competitorAnalysisSystem,
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 15 } as never,
      saveToolDef,
    ] as never,
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: userMessage }],
    betas: ["web-search-2025-03-05"] as never,
  })

  // Find our structured output tool in the response content
  for (const block of response.content) {
    if (
      block.type === "tool_use" &&
      (block as { name: string }).name === "save_competitor_analysis"
    ) {
      const parsed = competitorAnalysisSchema.safeParse(
        (block as { input: unknown }).input
      )
      if (parsed.success) return parsed.data
      throw new Error("AI-ответ не прошёл валидацию схемы")
    }
  }

  // Claude finished without calling save tool — force structured output
  const textBlocks = response.content
    .filter((b) => b.type === "text")
    .map((b) => ({ type: "text" as const, text: (b as { text: string }).text }))

  const forcedResponse = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 8000,
    system: competitorAnalysisSystem,
    tools: [saveToolDef],
    tool_choice: { type: "tool", name: "save_competitor_analysis" },
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: textBlocks.length ? textBlocks : [{ type: "text", text: "Анализ конкурентов завершён." }] },
      { role: "user", content: "Сохрани результаты анализа используя инструмент save_competitor_analysis." },
    ],
  })

  const forcedBlock = forcedResponse.content.find((b) => b.type === "tool_use")
  if (!forcedBlock || forcedBlock.type !== "tool_use") {
    throw new Error("AI не вернул структурированный ответ")
  }

  const parsed = competitorAnalysisSchema.safeParse(forcedBlock.input)
  if (!parsed.success) throw new Error("AI-ответ не прошёл валидацию схемы")
  return parsed.data
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

  const { $schema: _unused, ...rawSchema } = z.toJSONSchema(competitorAnalysisSchema, {
    target: "draft-7",
  }) as Record<string, unknown>

  const userMessage = buildCompetitorAnalysisInput(card)

  let data: z.infer<typeof competitorAnalysisSchema>

  try {
    data = await generateWithWebSearch(userMessage, rawSchema)
  } catch {
    // Fallback: standard structured output without web search
    const result = await generateStructured({
      system: competitorAnalysisSystem,
      user: userMessage,
      schema: competitorAnalysisSchema,
      toolName: "save_competitor_analysis",
      toolDescription: "Сохранить структурированный анализ конкурентов",
    })
    data = result.data
  }

  const version = await getNextVersion(project.id, "COMPETITOR_ANALYSIS")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "COMPETITOR_ANALYSIS",
      version,
      payload: data,
      model: AI_MODEL,
      inputHash,
    },
  })
}
