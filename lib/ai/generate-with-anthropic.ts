import { z } from "zod"
import { anthropic } from "@/lib/ai/client"

interface GenerateStructuredWithAnthropicArgs<T extends z.ZodType> {
  system: string
  user: string
  schema: T
  model: string
  maxTokens?: number
  /**
   * COMPETITORS/REPUTATION/MARKET only. web_search is a server-side tool —
   * Claude can search before answering. A forced tool_choice would prevent
   * that, so this runs a two-phase call: tool_choice "auto" (search, then
   * usually call the save tool); if Claude stops after searching without
   * calling it, a second forced-tool call turns the search findings into
   * structured JSON. Consolidates what used to be duplicated across
   * competitor.service.ts and market.service.ts (reputation.service.ts used
   * a third, less reliable text-regex variant — now unified on this one).
   */
  useWebSearch?: boolean
}

const SAVE_TOOL_NAME = "save_result"
const SAVE_TOOL_DESCRIPTION = "Сохранить структурированный результат анализа"

export async function generateStructuredWithAnthropic<T extends z.ZodType>({
  system,
  user,
  schema,
  model,
  maxTokens = 16000,
  useWebSearch = false,
}: GenerateStructuredWithAnthropicArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  const inputSchema = z.toJSONSchema(schema, {
    target: "draft-7",
  }) as Record<string, unknown>
  delete inputSchema.$schema

  const saveToolDef = {
    name: SAVE_TOOL_NAME,
    description: SAVE_TOOL_DESCRIPTION,
    input_schema: inputSchema as never,
  }

  if (!useWebSearch) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      tools: [saveToolDef],
      tool_choice: { type: "tool", name: SAVE_TOOL_NAME },
      messages: [{ role: "user", content: user }],
    })

    const toolUse = response.content.find((block) => block.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("AI не вернул структурированный ответ")
    }

    const parsed = schema.safeParse(toolUse.input)
    if (!parsed.success) {
      throw new Error("AI-ответ не прошёл валидацию схемы")
    }

    return { data: parsed.data, model }
  }

  // web_search_20250305 is a server-side tool — Anthropic executes searches inline
  const response = await anthropic.beta.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 15 } as never,
      saveToolDef,
    ] as never,
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: user }],
    betas: ["web-search-2025-03-05"] as never,
  })

  for (const block of response.content) {
    if (
      block.type === "tool_use" &&
      (block as { name: string }).name === SAVE_TOOL_NAME
    ) {
      const parsed = schema.safeParse((block as { input: unknown }).input)
      if (parsed.success) return { data: parsed.data, model }
      throw new Error("AI-ответ не прошёл валидацию схемы")
    }
  }

  // Claude finished searching without calling the save tool — force structured output
  const textBlocks = response.content
    .filter((b) => b.type === "text")
    .map((b) => ({ type: "text" as const, text: (b as { text: string }).text }))

  const forcedResponse = await anthropic.messages.create({
    model,
    max_tokens: Math.min(maxTokens, 8000),
    system,
    tools: [saveToolDef],
    tool_choice: { type: "tool", name: SAVE_TOOL_NAME },
    messages: [
      { role: "user", content: user },
      {
        role: "assistant",
        content: textBlocks.length ? textBlocks : [{ type: "text", text: "Анализ завершён." }],
      },
      { role: "user", content: `Сохрани результаты анализа используя инструмент ${SAVE_TOOL_NAME}.` },
    ],
  })

  const forcedBlock = forcedResponse.content.find((b) => b.type === "tool_use")
  if (!forcedBlock || forcedBlock.type !== "tool_use") {
    throw new Error("AI не вернул структурированный ответ")
  }

  const parsed = schema.safeParse(forcedBlock.input)
  if (!parsed.success) {
    throw new Error("AI-ответ не прошёл валидацию схемы")
  }

  return { data: parsed.data, model }
}
