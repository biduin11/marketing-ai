import { z } from "zod"
import type { Project, AiArtifact } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { anthropic, AI_MODEL } from "@/lib/ai/client"
import { generateStructured } from "@/lib/ai/generate"
import { marketAnalysisSchema } from "@/lib/ai/schemas/market"
import {
  marketAnalysisSystem,
  buildMarketAnalysisInput,
  type MarketCompanyContext,
} from "@/lib/ai/prompts/market"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"

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

/**
 * Web_search is a server-side tool that Claude can call before producing the
 * final structured output. tool_choice: "auto" lets it search first, then
 * (usually) call save_market_analysis. If it stops without calling the save
 * tool, a second forced-tool call turns its findings into structured JSON.
 */
async function generateWithWebSearch(
  userMessage: string,
  inputSchema: Record<string, unknown>
): Promise<z.infer<typeof marketAnalysisSchema>> {
  const saveToolDef = {
    name: "save_market_analysis",
    description: "Сохранить структурированный анализ рынка",
    input_schema: inputSchema as never,
  }

  const response = await anthropic.beta.messages.create({
    model: AI_MODEL,
    max_tokens: 16000,
    system: marketAnalysisSystem,
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 15 } as never,
      saveToolDef,
    ] as never,
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: userMessage }],
    betas: ["web-search-2025-03-05"] as never,
  })

  for (const block of response.content) {
    if (
      block.type === "tool_use" &&
      (block as { name: string }).name === "save_market_analysis"
    ) {
      const parsed = marketAnalysisSchema.safeParse(
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
    system: marketAnalysisSystem,
    tools: [saveToolDef],
    tool_choice: { type: "tool", name: "save_market_analysis" },
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: textBlocks.length ? textBlocks : [{ type: "text", text: "Анализ рынка завершён." }] },
      { role: "user", content: "Сохрани результаты анализа используя инструмент save_market_analysis." },
    ],
  })

  const forcedBlock = forcedResponse.content.find((b) => b.type === "tool_use")
  if (!forcedBlock || forcedBlock.type !== "tool_use") {
    throw new Error("AI не вернул структурированный ответ")
  }

  const parsed = marketAnalysisSchema.safeParse(forcedBlock.input)
  if (!parsed.success) throw new Error("AI-ответ не прошёл валидацию схемы")
  return parsed.data
}

export async function generateMarketAnalysis(
  project: Project,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const context = toContext(project)
  const inputHash = computeInputHash({ type: "MARKET_ANALYSIS", context })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "MARKET_ANALYSIS")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const { $schema: _unused, ...rawSchema } = z.toJSONSchema(marketAnalysisSchema, {
    target: "draft-7",
  }) as Record<string, unknown>

  const userMessage = buildMarketAnalysisInput(context)

  let data: z.infer<typeof marketAnalysisSchema>

  try {
    data = await generateWithWebSearch(userMessage, rawSchema)
  } catch {
    // Fallback: standard structured output without web search
    const result = await generateStructured({
      system: marketAnalysisSystem,
      user: userMessage,
      schema: marketAnalysisSchema,
      toolName: "save_market_analysis",
      toolDescription: "Сохранить структурированный анализ рынка",
    })
    data = result.data
  }

  const version = await getNextVersion(project.id, "MARKET_ANALYSIS")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "MARKET_ANALYSIS",
      version,
      payload: data,
      model: AI_MODEL,
      inputHash,
    },
  })
}
