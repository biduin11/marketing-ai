import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { env } from "@/env.mjs"

/** Default AI model — used as a fallback where no task-specific model applies. */
export const AI_MODEL = "claude-sonnet-4-6"

/** Model per task type — lighter generations use Haiku (~5x cheaper than Sonnet). */
export const AI_MODELS = {
  // Тяжёлый анализ — Sonnet
  ANALYSIS: "claude-sonnet-4-6", // SWOT, стратегия, рынок, BCG
  REPUTATION: "claude-sonnet-4-6", // web_search задачи
  COMPETITORS: "claude-sonnet-4-6", // web_search задачи

  // Лёгкие генерации — Haiku
  CONTENT: "claude-haiku-4-5-20251001", // контент-план, идеи постов
  DIRECTOR: "claude-haiku-4-5-20251001", // ежедневный дайджест
  OFFERS: "claude-haiku-4-5-20251001", // генерация офферов

  // Средние задачи — Sonnet
  CJM: "claude-sonnet-4-6",
  AUDIENCE: "claude-sonnet-4-6",
  PRODUCT: "claude-sonnet-4-6",
} as const

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined
}

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: env.ANTHROPIC_API_KEY ?? "" })

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropic = anthropic

/**
 * DeepSeek — OpenAI-compatible API. Lazily instantiated (like the Gemini
 * client in gemini-client.ts) so importing this module doesn't throw when
 * DEEPSEEK_API_KEY is unset and no task routes to DeepSeek yet.
 */
let deepseekClient: OpenAI | null = null

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
