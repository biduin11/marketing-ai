import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { env } from "@/env.mjs"

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined
}

/**
 * ANTHROPIC_BASE_URL lets this point at an Anthropic-API-compatible router
 * instead of api.anthropic.com — e.g. router.cheap, which proxies Anthropic's
 * native request/tool format (including the web_search_20250305 tool) under
 * its own base URL, with an ANTHROPIC_API_KEY issued by router.cheap rather
 * than Anthropic directly.
 */
export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY ?? "",
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
  })

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
 * Fallback model for generateStructuredWithOpenAI() when a caller doesn't
 * specify one — in practice every task in lib/ai/models.ts passes its own
 * `model` explicitly via routeAI, so this default is rarely hit.
 */
export const OPENAI_MODEL = "gpt-5.4"

/**
 * OpenAI-compatible client. Lazily instantiated (same reasoning as
 * getDeepSeekClient) so importing this module doesn't throw when
 * OPENAI_API_KEY is unset and no task routes to OpenAI yet.
 *
 * OPENAI_BASE_URL lets this point at an OpenAI-compatible router instead of
 * api.openai.com — currently router.cheap, with a router.cheap API key in
 * OPENAI_API_KEY. Model ids must match whatever that router exposes (see
 * lib/ai/models.ts).
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
