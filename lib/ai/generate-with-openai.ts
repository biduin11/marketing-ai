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
}

/**
 * OpenAI fallback for generateStructured() (lib/ai/generate.ts). Uses a
 * fixed OPENAI_MODEL (gpt-4o) rather than the caller-supplied `model` —
 * generateStructured()'s `model` param defaults to an Anthropic model id
 * (AI_MODEL), which would be an invalid model name if passed straight
 * through to OpenAI's API. Same pattern as the Gemini/DeepSeek branches:
 * ignore the Anthropic-shaped model argument, use this provider's own
 * constant. response_format: json_object guarantees a valid JSON object
 * (not an exact shape, same caveat as DeepSeek — no schema enforcement
 * like Gemini's responseSchema). Carries over the same two protections:
 * explicit truncation detection (finish_reason "length") and a clear
 * error instead of a raw JSON.parse crash.
 */
export async function generateStructuredWithOpenAI<T extends z.ZodType>({
  system,
  user,
  schema,
  maxTokens = 8000,
}: GenerateStructuredWithOpenAIArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  const response = await getOpenAIClient().chat.completions.create({
    model: OPENAI_MODEL,
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
      `Ответ OpenAI обрезан лимитом токенов (maxTokens=${maxTokens}) до завершения JSON — увеличьте maxTokens`
    )
  }

  const text = choice?.message?.content ?? ""
  if (!text) throw new Error("OpenAI вернул пустой ответ")

  const parsed = schema.safeParse(extractJson(text))
  if (!parsed.success) {
    throw new Error("AI-ответ не прошёл валидацию схемы")
  }

  return { data: parsed.data, model: OPENAI_MODEL }
}
