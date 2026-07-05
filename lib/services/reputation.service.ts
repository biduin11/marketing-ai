import type { Project, ReputationSnapshot } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { anthropic, AI_MODEL } from "@/lib/ai/client"
import { reputationSchema, type Reputation } from "@/lib/ai/schemas/reputation"
import { reputationSystem, buildReputationInput } from "@/lib/ai/prompts/reputation"

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/)
  const raw = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0]
  if (!raw) throw new Error("AI не вернул JSON")
  return JSON.parse(raw)
}

/**
 * Web_search is a server-executed tool: Claude can issue multiple searches
 * and reason over the results within this single API call. A forced
 * tool_choice (as used for other structured-output generations) would
 * prevent it from searching first, so the JSON is parsed out of the final
 * text block instead of a tool_use block.
 */
async function analyzeReputation(
  project: Project
): Promise<{ payload: Reputation; model: string }> {
  const city = project.regions[0] ?? ""

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 8000,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
    system: reputationSystem,
    messages: [
      {
        role: "user",
        content: buildReputationInput({
          name: project.name,
          city,
          website: project.website,
        }),
      },
    ],
  })

  const text = response.content
    .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("")

  const parsed = reputationSchema.safeParse(extractJson(text))
  if (!parsed.success) {
    throw new Error("AI-ответ не прошёл валидацию схемы")
  }

  return { payload: parsed.data, model: AI_MODEL }
}

export async function generateReputationSnapshot(
  project: Project
): Promise<ReputationSnapshot> {
  const { payload, model } = await analyzeReputation(project)
  return prisma.reputationSnapshot.create({
    data: { projectId: project.id, payload, model },
  })
}

export async function getLatestReputationSnapshot(
  projectId: string
): Promise<ReputationSnapshot | null> {
  return prisma.reputationSnapshot.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
}
