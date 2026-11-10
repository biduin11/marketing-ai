import { z } from "zod"
import type Anthropic from "@anthropic-ai/sdk"
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
  /** Overrides the router.cheap client — e.g. the ClaudeHub client in generate-with-claudehub.ts. */
  client?: Anthropic
}

const SAVE_TOOL_NAME = "save_result"
const SAVE_TOOL_DESCRIPTION = "Сохранить структурированный результат анализа"

// Leave time for the router to try the fallback provider within the function limit.
const REQUEST_TIMEOUT_MS = 90_000

export async function generateStructuredWithAnthropic<T extends z.ZodType>({
  system,
  user,
  schema,
  model,
  maxTokens = 16000,
  client = anthropic,
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

  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const response = await client.messages.create(
    {
      model,
      max_tokens: maxTokens,
      system,
      tools: [saveToolDef],
      tool_choice: { type: "tool", name: SAVE_TOOL_NAME },
      messages: [{ role: "user", content: user }],
    },
    { timeout: REQUEST_TIMEOUT_MS, signal, maxRetries: 0 }
  ).catch((error: unknown) => {
    if (signal.aborted) throw new Error("Anthropic request timed out", { cause: error })
    throw error
  })

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
