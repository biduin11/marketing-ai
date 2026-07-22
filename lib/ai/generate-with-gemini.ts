import { z } from "zod"
import { getGeminiClient, GEMINI_MODEL } from "@/lib/ai/gemini-client"
import { zodJsonSchemaToGeminiSchema } from "@/lib/ai/zod-to-gemini-schema"

/**
 * Like Anthropic's SDK, Gemini's has no default request timeout — this is
 * usually the fallback attempt after Anthropic already timed out (see
 * generate-with-anthropic.ts), so without its own cap a hung Gemini call
 * would extend that same indefinite-hang problem to the fallback leg
 * instead of actually fixing it.
 */
const GEMINI_TIMEOUT_MS = 90_000

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
 * Extracts the model's JSON object from raw completion text. Tries, in
 * order: the whole trimmed text as-is (the expected shape given
 * responseSchema), a ```json fenced block, then a balanced-brace scan from
 * the first '{' — not a greedy first-'{'-to-last-'}' regex, which would
 * swallow trailing prose after the object.
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
  if (start === -1) throw new Error("Gemini не вернул JSON")

  const candidate = findBalancedJsonObject(trimmed, start)
  if (candidate) {
    try {
      return JSON.parse(candidate)
    } catch {
      // fall through to final error
    }
  }

  throw new Error(
    "Gemini вернул невалидный JSON (похоже на обрыв ответа лимитом токенов — увеличьте maxTokens)"
  )
}

interface GenerateStructuredWithGeminiArgs<T extends z.ZodType> {
  system: string
  user: string
  schema: T
  maxTokens?: number
}

/**
 * Gemini fallback for generateStructured() (lib/ai/generate.ts). Converts
 * the same zod schema used for Anthropic's forced tool_choice into Gemini's
 * responseSchema (see zod-to-gemini-schema.ts), so Gemini is constrained to
 * the exact shape instead of guessing field names from prose — this is what
 * actually fixes "AI-ответ не прошёл валидацию схемы" failures, not just
 * asking nicely in the prompt. Still re-validated through the same zod
 * schema as the Anthropic path as a final safety net.
 */
export async function generateStructuredWithGemini<T extends z.ZodType>({
  system,
  user,
  schema,
  maxTokens = 8000,
}: GenerateStructuredWithGeminiArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  const { $schema: _unused, ...jsonSchema } = z.toJSONSchema(schema, {
    target: "draft-7",
  }) as Record<string, unknown>
  const responseSchema = zodJsonSchemaToGeminiSchema(jsonSchema)

  const model = getGeminiClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: system,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      maxOutputTokens: maxTokens,
      temperature: 0.3,
    },
  })

  const result = await model.generateContent(user, { timeout: GEMINI_TIMEOUT_MS })

  const finishReason = result.response.candidates?.[0]?.finishReason
  if (finishReason === "MAX_TOKENS") {
    throw new Error(
      `Ответ Gemini обрезан лимитом токенов (maxTokens=${maxTokens}) до завершения JSON — увеличьте maxTokens`
    )
  }

  const text = result.response.text()

  const parsed = schema.safeParse(extractJson(text))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue?.path.join(".") || "(root)"
    throw new Error(
      `AI-ответ не прошёл валидацию схемы: ${issue?.message ?? "неизвестная ошибка"} (поле: ${path})`
    )
  }

  return { data: parsed.data, model: GEMINI_MODEL }
}

interface GenerateTextWithGeminiArgs {
  system?: string
  user: string
  maxTokens?: number
}

/** Gemini fallback for plain-text generations (chat replies, post copy) — no JSON/schema involved. */
export async function generateTextWithGemini({
  system,
  user,
  maxTokens = 1500,
}: GenerateTextWithGeminiArgs): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
    model: GEMINI_MODEL,
    ...(system && { systemInstruction: system }),
    generationConfig: { maxOutputTokens: maxTokens },
  })

  const result = await model.generateContent(user, { timeout: GEMINI_TIMEOUT_MS })

  const finishReason = result.response.candidates?.[0]?.finishReason
  if (finishReason === "MAX_TOKENS") {
    throw new Error(
      `Ответ Gemini обрезан лимитом токенов (maxTokens=${maxTokens}) до завершения текста — увеличьте maxTokens`
    )
  }

  return result.response.text()
}
