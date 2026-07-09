import { z } from "zod"
import { getGeminiClient, GEMINI_MODEL } from "@/lib/ai/gemini-client"
import { zodJsonSchemaToGeminiSchema } from "@/lib/ai/zod-to-gemini-schema"

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/)
  const raw = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0]
  if (!raw) throw new Error("Gemini не вернул JSON")
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(
      "Gemini вернул невалидный JSON (похоже на обрыв ответа лимитом токенов — увеличьте maxTokens)"
    )
  }
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

  const result = await model.generateContent(user)

  const finishReason = result.response.candidates?.[0]?.finishReason
  if (finishReason === "MAX_TOKENS") {
    throw new Error(
      `Ответ Gemini обрезан лимитом токенов (maxTokens=${maxTokens}) до завершения JSON — увеличьте maxTokens`
    )
  }

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
