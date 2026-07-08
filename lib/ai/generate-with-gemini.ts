import { z } from "zod"
import { getGeminiClient, GEMINI_MODEL } from "@/lib/ai/gemini-client"

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/)
  const raw = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0]
  if (!raw) throw new Error("Gemini не вернул JSON")
  return JSON.parse(raw)
}

interface GenerateStructuredWithGeminiArgs<T extends z.ZodType> {
  system: string
  user: string
  schema: T
  maxTokens?: number
}

/**
 * Gemini fallback for generateStructured() (lib/ai/generate.ts). Unlike
 * Anthropic's forced tool_choice, the Gemini SDK's responseSchema only
 * supports a strict subset of OpenAPI 3.0 (no `.nullable()`/`.optional()`
 * unions, which most of our zod schemas rely on) — converting every schema
 * losslessly isn't safe for an emergency fallback. Instead this relies on
 * JSON mode (guarantees syntactically valid JSON) plus the existing system
 * prompt's own field-by-field instructions, then validates the result
 * through the same zod schema as the Anthropic path. Less reliable than
 * forced tool-calling — a schema mismatch throws "AI-ответ не прошёл
 * валидацию схемы" the same way the Anthropic path does on bad output.
 */
export async function generateStructuredWithGemini<T extends z.ZodType>({
  system,
  user,
  schema,
  maxTokens = 8000,
}: GenerateStructuredWithGeminiArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  const model = getGeminiClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: `${system}\n\nОтветь СТРОГО валидным JSON-объектом по описанной структуре, без пояснений и без markdown-обрамления вокруг JSON.`,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: maxTokens,
    },
  })

  const result = await model.generateContent(user)
  const text = result.response.text()

  const parsed = schema.safeParse(extractJson(text))
  if (!parsed.success) {
    throw new Error("AI-ответ не прошёл валидацию схемы")
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

  const result = await model.generateContent(user)
  return result.response.text()
}
