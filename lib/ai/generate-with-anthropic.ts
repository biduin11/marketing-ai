import { z } from "zod"
import { anthropic } from "@/lib/ai/client"

function schemaValidationError(error: z.ZodError): Error {
  const issue = error.issues[0]
  const path = issue?.path.join(".") || "(root)"
  return new Error(
    `AI-ответ не прошёл валидацию схемы: ${issue?.message ?? "неизвестная ошибка"} (поле: ${path})`
  )
}

interface GenerateStructuredWithAnthropicArgs<T extends z.ZodType> {
  system: string
  user: string
  schema: T
  model: string
  maxTokens?: number
}

const SAVE_TOOL_NAME = "save_result"
const SAVE_TOOL_DESCRIPTION = "Сохранить структурированный результат анализа"

/**
 * Anthropic's SDK has no request timeout by default (up to ~10min), so a
 * slow/hanging call just runs until Vercel force-kills the whole function at
 * its maxDuration (300s on the routes that call into this) — routeAI's
 * catch-and-fallback-to-Gemini never gets a chance to run, since the await
 * never resolves or rejects in time. This timeout makes the request fail
 * fast enough for that fallback to actually happen, with margin under 300s.
 */
const REQUEST_TIMEOUT_MS = 90_000

export async function generateStructuredWithAnthropic<T extends z.ZodType>({
  system,
  user,
  schema,
  model,
  maxTokens = 16000,
}: GenerateStructuredWithAnthropicArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  const { $schema: _unused, ...inputSchema } = z.toJSONSchema(schema, {
    target: "draft-7",
  }) as Record<string, unknown>

  const saveToolDef = {
    name: SAVE_TOOL_NAME,
    description: SAVE_TOOL_DESCRIPTION,
    input_schema: inputSchema as never,
  }

  const response = await anthropic.messages.create(
    {
      model,
      max_tokens: maxTokens,
      system,
      tools: [saveToolDef],
      tool_choice: { type: "tool", name: SAVE_TOOL_NAME },
      messages: [{ role: "user", content: user }],
    },
    { timeout: REQUEST_TIMEOUT_MS }
  )

  const toolUse = response.content.find((block) => block.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI не вернул структурированный ответ")
  }

  const parsed = schema.safeParse(toolUse.input)
  if (!parsed.success) {
    throw schemaValidationError(parsed.error)
  }

  return { data: parsed.data, model }
}
