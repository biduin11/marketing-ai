import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { env } from "@/env.mjs"

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined
}

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: env.ANTHROPIC_API_KEY ?? "" })

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropic = anthropic

/** Model used for all DeepSeek-backed generations (deepseek-chat/V3 — not reasoner, see generate-with-deepseek.ts). */
export const DEEPSEEK_MODEL = "deepseek-chat"

/**
 * DeepSeek — OpenAI-compatible API. Lazily instantiated (like the Gemini
 * client in gemini-client.ts) so importing this module doesn't throw when
 * DEEPSEEK_API_KEY is unset and no task routes to DeepSeek yet.
 */
let deepseekClient: OpenAI | null = null

// DeepSeek — заготовка для будущего подключения
// Для активации: назначить задачи в lib/ai/models.ts
// Документация: https://api-docs.deepseek.com
// Модели: deepseek-chat (V3), deepseek-reasoner (R1)
// JSON mode поддерживается только в deepseek-chat
export function getDeepSeekClient(): OpenAI {
  if (!deepseekClient) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not set")
    }
    deepseekClient = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" })
  }
  return deepseekClient
}

// Gemini client lives in lib/ai/gemini-client.ts (getGeminiClient() + GEMINI_MODEL) —
// not duplicated here to avoid two separate lazy-init implementations drifting apart.

/**
 * Model used for all OpenAI-backed generations, see generate-with-openai.ts.
 * Provider-prefixed ("openai/...") to match OpenRouter's model id format —
 * see getOpenAIClient() below. If OPENAI_BASE_URL is unset (talking to
 * OpenAI directly instead of OpenRouter), drop the "openai/" prefix here
 * and in lib/ai/models.ts.
 */
export const OPENAI_MODEL = "openai/gpt-4o"

/**
 * OpenAI-compatible client. Lazily instantiated (same reasoning as
 * getDeepSeekClient) so importing this module doesn't throw when
 * OPENAI_API_KEY is unset and no task routes to OpenAI yet.
 *
 * OPENAI_BASE_URL lets this point at an OpenAI-compatible router instead of
 * api.openai.com — e.g. OpenRouter (https://openrouter.ai/api/v1) with an
 * OpenRouter API key in OPENAI_API_KEY. Model ids must then use OpenRouter's
 * provider-prefixed format (openai/gpt-4o, openai/gpt-4o-mini — see
 * OPENAI_MODEL above and lib/ai/models.ts).
 */
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set")
    }
    openaiClient = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    })
  }
  return openaiClient
}
