import { z } from "zod"
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client"

/**
 * Scans forward from `start` (an opening '{') for its matching '}', tracking
 * string literals so braces inside string values don't throw off the depth
 * count. Returns null if the braces never balance out.
 */
function findBalancedJsonObject(text: string, start: number): string | null {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

/**
 * Extracts a JSON object from raw text. Tries, in order: the whole trimmed
 * text as-is, a ```json fenced block, then a balanced-brace scan from the
 * first '{' — not a greedy first-'{'-to-last-'}' regex, which would swallow
 * trailing prose or stray braces. No longer the primary parse path for
 * generateStructuredWithOpenAI (that now reads structured tool-call
 * arguments directly) — kept as a defense-in-depth fallback for the rare
 * case where the arguments string itself doesn't parse cleanly.
 */
function extractJson(text: string): unknown {
  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    // fall through to more lenient extraction below
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/)
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1])
    } catch {
      // fall through
    }
  }

  const start = trimmed.indexOf("{")
  if (start === -1) throw new Error("OpenAI не вернул JSON")

  const candidate = findBalancedJsonObject(trimmed, start)
  if (candidate) {
    try {
      return JSON.parse(candidate)
    } catch {
      // fall through to final error
    }
  }

  throw new Error(
    "OpenAI вернул невалидный JSON (похоже на обрыв ответа лимитом токенов — увеличьте maxTokens)"
  )
}

interface GenerateStructuredWithOpenAIArgs<T extends z.ZodType> {
  system: string
  user: string
  schema: T
  maxTokens?: number
  /** Overrides OPENAI_MODEL — e.g. a lighter model id for cheaper copywriting tasks. */
  model?: string
}

const SAVE_TOOL_NAME = "save_result"
const SAVE_TOOL_DESCRIPTION = "Сохранить структурированный результат анализа"

/**
 * OpenAI-compatible provider for structured generation via forced function
 * calling (tool_choice), mirroring the Anthropic tool_use pattern in
 * generate-with-anthropic.ts. Previously used response_format: json_object
 * with the JSON Schema embedded as text in the system prompt, but that was
 * unreliable through the router.cheap proxy: the model would finish with
 * finish_reason "stop" while message.content held a syntactically truncated
 * JSON object (the proxy not fully honoring an opaque param — same failure
 * mode seen with Anthropic's web_search tool). Forcing tool_choice removes
 * the free-text JSON layer: the schema goes into the function's `parameters`
 * instead of prose, and the model must return arguments through the API's
 * structured mechanism rather than text it fully controls the shape of.
 * Defaults to OPENAI_MODEL — callers can override with `model` for lighter
 * tasks. Not used as generateStructured()'s automatic AI_PROVIDER fallback
 * path with the caller's Anthropic-shaped `model` (that default would be an
 * invalid OpenAI model id) — services that want OpenAI call this directly
 * instead.
 */
export async function generateStructuredWithOpenAI<T extends z.ZodType>({
  system,
  user,
  schema,
  maxTokens = 8000,
  model = OPENAI_MODEL,
}: GenerateStructuredWithOpenAIArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  const { $schema: _unused, ...jsonSchema } = z.toJSONSchema(schema, {
    target: "draft-7",
  }) as Record<string, unknown>

  const response = await getOpenAIClient().chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.3,
    tools: [
      {
        type: "function",
        function: {
          name: SAVE_TOOL_NAME,
          description: SAVE_TOOL_DESCRIPTION,
          parameters: jsonSchema,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: SAVE_TOOL_NAME } },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  })

  const choice = response.choices[0]

  if (choice?.finish_reason === "length") {
    throw new Error(
      `Ответ OpenAI обрезан лимитом токенов (maxTokens=${maxTokens}) до завершения JSON — увеличьте maxTokens`
    )
  }

  const toolCall = choice?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.type !== "function") {
    throw new Error(
      `OpenAI не вернул структурированный tool call (finish_reason: ${choice?.finish_reason ?? "нет"})`
    )
  }

  const args = toolCall.function.arguments

  console.log("CONTENT_PLAN finish_reason:", choice?.finish_reason)
  console.log("CONTENT_PLAN tool_calls count:", choice?.message?.tool_calls?.length ?? 0)
  console.log("CONTENT_PLAN arguments length:", args.length)
  console.log("CONTENT_PLAN arguments last 200 chars:", args.slice(-200))

  let rawData: unknown
  try {
    rawData = JSON.parse(args)
  } catch {
    // defense-in-depth: arguments should already be a clean JSON string,
    // but fall back to lenient extraction if it isn't
    rawData = extractJson(args)
  }

  const parsed = schema.safeParse(rawData)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue?.path.join(".") || "(root)"
    throw new Error(
      `AI-ответ не прошёл валидацию схемы: ${issue?.message ?? "неизвестная ошибка"} (поле: ${path})`
    )
  }

  return { data: parsed.data, model }
}

interface GenerateTextWithOpenAIArgs {
  system?: string
  messages: { role: "user" | "assistant"; content: string }[]
  maxTokens?: number
  /** Overrides the default model — e.g. a lighter model id for conversational tasks. */
  model?: string
}

/** Plain-text OpenAI-compatible generation (chat replies, post copy) — no JSON/schema involved. */
export async function generateTextWithOpenAI({
  system,
  messages,
  maxTokens = 2048,
  model = "gpt-5.4-mini",
}: GenerateTextWithOpenAIArgs): Promise<string> {
  const response = await getOpenAIClient().chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      ...messages,
    ],
  })

  const choice = response.choices[0]

  if (choice?.finish_reason === "length") {
    throw new Error(
      `Ответ OpenAI обрезан лимитом токенов (maxTokens=${maxTokens}) до завершения текста — увеличьте maxTokens`
    )
  }

  return choice?.message?.content ?? ""
}
