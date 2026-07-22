import { z } from "zod"
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client"

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/)
  const raw = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0]
  if (!raw) throw new Error("OpenAI не вернул JSON")
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(
      "OpenAI вернул невалидный JSON (похоже на обрыв ответа лимитом токенов — увеличьте maxTokens)"
    )
  }
}

interface GenerateStructuredWithOpenAIArgs<T extends z.ZodType> {
  system: string
  user: string
  schema: T
  maxTokens?: number
  /** Overrides OPENAI_MODEL (openai/gpt-4o) — e.g. openai/gpt-4o-mini for lighter copywriting tasks. */
  model?: string
}

/**
 * OpenAI provider for structured generation. Defaults to OPENAI_MODEL
 * (openai/gpt-4o) — callers can override with `model` for lighter tasks
 * (e.g. openai/gpt-4o-mini). Not used as generateStructured()'s automatic AI_PROVIDER
 * fallback path with the caller's Anthropic-shaped `model` (that default
 * would be an invalid OpenAI model id) — services that want OpenAI call
 * this directly instead. response_format: json_object only guarantees valid
 * JSON, not a specific shape — unlike Anthropic's forced tool_choice or
 * Gemini's responseSchema, the model never otherwise sees the actual field
 * names/types, only whatever prose happens to be in `system`. So the zod
 * schema is converted to JSON Schema (same z.toJSONSchema() used by the
 * Gemini path) and appended to the system prompt here, giving the model the
 * real shape to fill instead of making it guess. Carries over the same two
 * protections: explicit truncation detection (finish_reason "length") and a
 * clear error instead of a raw JSON.parse crash.
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
  const systemWithSchema = `${system}\n\nВерни ТОЛЬКО валидный JSON-объект без markdown-разметки, строго соответствующий следующей JSON Schema (заполни все поля, которые она требует):\n${JSON.stringify(jsonSchema)}`

  const response = await getOpenAIClient().chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemWithSchema },
      { role: "user", content: user },
    ],
  })

  const choice = response.choices[0]

  if (choice?.finish_reason === "length") {
    throw new Error(
      `Ответ OpenAI обрезан лимитом токенов (maxTokens=${maxTokens}) до завершения JSON — увеличьте maxTokens`
    )
  }

  const text = choice?.message?.content ?? ""
  if (!text) throw new Error("OpenAI вернул пустой ответ")

  const parsed = schema.safeParse(extractJson(text))
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
  /** Overrides OPENAI_MODEL (openai/gpt-4o) — e.g. openai/gpt-4o-mini for lighter conversational tasks. */
  model?: string
}

/** Plain-text OpenAI generation (chat replies, post copy) — no JSON/schema involved. */
export async function generateTextWithOpenAI({
  system,
  messages,
  maxTokens = 2048,
  model = "openai/gpt-4o-mini",
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
