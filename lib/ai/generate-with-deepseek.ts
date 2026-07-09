import { z } from "zod"
import { getDeepSeekClient, DEEPSEEK_MODEL } from "@/lib/ai/client"

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/)
  const raw = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0]
  if (!raw) throw new Error("DeepSeek не вернул JSON")
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(
      "DeepSeek вернул невалидный JSON (похоже на обрыв ответа лимитом токенов — увеличьте maxTokens)"
    )
  }
}

interface GenerateStructuredWithDeepseekArgs<T extends z.ZodType> {
  system: string
  user: string
  schema: T
  maxTokens?: number
}

/**
 * DeepSeek fallback for generateStructured() (lib/ai/generate.ts). Uses
 * deepseek-chat (V3), not deepseek-reasoner — reasoner doesn't support
 * response_format: json_object. Unlike Gemini's responseSchema, DeepSeek's
 * JSON mode only guarantees a valid JSON *object* (no shape/field
 * enforcement), so this is less reliable than both the Anthropic and
 * Gemini paths — still re-validated through the same zod schema either way.
 * Carries over the same two protections added for Gemini: explicit
 * truncation detection (finish_reason "length", OpenAI's equivalent of
 * Gemini's MAX_TOKENS) and a clear error instead of a raw JSON.parse crash.
 */
export async function generateStructuredWithDeepseek<T extends z.ZodType>({
  system,
  user,
  schema,
  maxTokens = 8000,
}: GenerateStructuredWithDeepseekArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  const response = await getDeepSeekClient().chat.completions.create({
    model: DEEPSEEK_MODEL,
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  })

  const choice = response.choices[0]

  if (choice?.finish_reason === "length") {
    throw new Error(
      `Ответ DeepSeek обрезан лимитом токенов (maxTokens=${maxTokens}) до завершения JSON — увеличьте maxTokens`
    )
  }

  const text = choice?.message?.content ?? ""

  const parsed = schema.safeParse(extractJson(text))
  if (!parsed.success) {
    throw new Error("AI-ответ не прошёл валидацию схемы")
  }

  return { data: parsed.data, model: DEEPSEEK_MODEL }
}
