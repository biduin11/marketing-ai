import { z } from "zod"
import { anthropic, AI_MODEL } from "@/lib/ai/client"
import { generateStructuredWithGemini } from "@/lib/ai/generate-with-gemini"

interface GenerateStructuredArgs<T extends z.ZodType> {
  system: string
  user: string
  schema: T
  toolName: string
  toolDescription: string
  maxTokens?: number
  /** Task-specific model override — defaults to AI_MODEL (see lib/ai/client.ts AI_MODELS). */
  model?: string
}

/**
 * Calls Claude with a single forced tool (structured output) and validates
 * the tool input against the provided zod schema. Returns the parsed result
 * plus the model id used (for persisting on the artifact).
 */
export async function generateStructured<T extends z.ZodType>({
  system,
  user,
  schema,
  toolName,
  toolDescription,
  maxTokens = 8000,
  model = AI_MODEL,
}: GenerateStructuredArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  // Temporary switch while the Anthropic balance is topped up (see AI_PROVIDER
  // in CLAUDE.md) — every caller of generateStructured() gets this for free.
  if (process.env.AI_PROVIDER === "gemini") {
    return generateStructuredWithGemini({ system, user, schema, maxTokens })
  }

  // Zod 4 native JSON Schema — strip $schema meta-field; Anthropic rejects it.
  const { $schema: _unused, ...inputSchema } = z.toJSONSchema(schema, {
    target: "draft-7",
  }) as Record<string, unknown>

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    tools: [
      {
        name: toolName,
        description: toolDescription,
        input_schema: inputSchema as never,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
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
