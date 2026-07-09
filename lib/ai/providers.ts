import { z } from "zod"
import { anthropic, getDeepSeekClient } from "@/lib/ai/client"
import { getGeminiClient } from "@/lib/ai/gemini-client"
import { zodJsonSchemaToGeminiSchema } from "@/lib/ai/zod-to-gemini-schema"

type Provider = "anthropic" | "deepseek" | "gemini"

interface GenerateOptions {
  provider: Provider
  model: string
  system: string
  prompt: string
  maxTokens?: number
  /** Only meaningful for provider: "anthropic" — other providers don't support it. */
  useWebSearch?: boolean
  /**
   * When provided, constrains JSON output where the provider supports it:
   * Gemini gets a real responseSchema (see zod-to-gemini-schema.ts — this is
   * what fixed "AI-ответ не прошёл валидацию схемы" truncation/drift issues
   * for the Gemini fallback). DeepSeek gets response_format: json_object
   * (object-mode only, no schema shape enforcement — deepseek-reasoner
   * doesn't support this mode at all, so it's skipped for that model).
   * Without a schema, all three providers still work — parseAIJson() below
   * validates whatever comes back either way.
   */
  schema?: z.ZodType
}

/**
 * Single entry point for all three providers. Returns raw text — callers
 * pass it to parseAIJson() with their zod schema, same as the Anthropic
 * tool-calling path validates through the schema at the end.
 */
export async function generateAI(options: GenerateOptions): Promise<string> {
  const {
    provider,
    model,
    system,
    prompt,
    maxTokens = 4000,
    useWebSearch = false,
    schema,
  } = options

  switch (provider) {
    case "anthropic": {
      const tools = useWebSearch
        ? [{ type: "web_search_20250305" as const, name: "web_search" as const }]
        : undefined

      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        tools,
        messages: [{ role: "user", content: prompt }],
      })

      return response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
    }

    case "deepseek": {
      const supportsJsonMode = schema && !model.includes("reasoner")

      const response = await getDeepSeekClient().chat.completions.create({
        model,
        max_tokens: maxTokens,
        ...(supportsJsonMode ? { response_format: { type: "json_object" as const } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      })
      return response.choices[0]?.message?.content ?? ""
    }

    case "gemini": {
      const { $schema: _unused, ...jsonSchema } = schema
        ? (z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>)
        : { $schema: undefined }

      const geminiModel = getGeminiClient().getGenerativeModel({
        model,
        systemInstruction: system,
        generationConfig: {
          maxOutputTokens: maxTokens,
          ...(schema && {
            responseMimeType: "application/json",
            responseSchema: zodJsonSchemaToGeminiSchema(jsonSchema),
          }),
        },
      })
      const result = await geminiModel.generateContent(prompt)

      const finishReason = result.response.candidates?.[0]?.finishReason
      if (finishReason === "MAX_TOKENS") {
        throw new Error(
          `Ответ Gemini обрезан лимитом токенов (maxTokens=${maxTokens}) — увеличьте maxTokens`
        )
      }

      return result.response.text()
    }

    default:
      throw new Error(`Unknown provider: ${provider satisfies never}`)
  }
}

/** Fallback wrapper — if the primary provider throws, retries with a second set of options. */
export async function generateAIWithFallback(
  options: GenerateOptions,
  fallback?: GenerateOptions
): Promise<string> {
  try {
    return await generateAI(options)
  } catch (error) {
    console.error(`AI provider ${options.provider} failed:`, error)
    if (fallback) {
      console.log(`Falling back to ${fallback.provider}`)
      return await generateAI(fallback)
    }
    throw error
  }
}

/** Parses and validates JSON from any provider's raw text response through a zod schema. */
export function parseAIJson<T>(text: string, schema: z.ZodType<T>): T {
  const clean = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("AI response does not contain valid JSON")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error("AI JSON parse error:", e)
    console.error("Raw response:", clean.slice(0, 500))
    throw new Error(`Не удалось распарсить ответ AI: ${e instanceof Error ? e.message : e}`)
  }

  return schema.parse(parsed)
}
