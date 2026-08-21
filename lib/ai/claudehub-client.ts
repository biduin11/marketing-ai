import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"

/**
 * ClaudeHub (api.claudehub.fun) — router.cheap's automatic-fallback
 * replacement (see routeAI in lib/ai/router.ts). One sk-hub-... key works in
 * both Anthropic mode (x-api-key, /v1/messages) and OpenAI-compatible mode
 * (Authorization: Bearer, /v1/chat/completions) — same shape as router.cheap,
 * just a different host/key. Model ids use dots (claude-sonnet-4.6,
 * gpt-5.4), NOT the dashed ids router.cheap exposes — see
 * lib/ai/generate-with-claudehub.ts.
 */
const CLAUDEHUB_BASE_URL = "https://api.claudehub.fun"

let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null

function getClaudeHubApiKey(): string {
  const apiKey = process.env.CLAUDEHUB_API_KEY
  if (!apiKey) {
    throw new Error("CLAUDEHUB_API_KEY is not set")
  }
  return apiKey
}

/** Lazy — importing this module must not throw when CLAUDEHUB_API_KEY is unset (the fallback path is rarely hit). */
export function getClaudeHubAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: getClaudeHubApiKey(),
      baseURL: CLAUDEHUB_BASE_URL,
    })
  }
  return anthropicClient
}

export function getClaudeHubOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: getClaudeHubApiKey(),
      baseURL: `${CLAUDEHUB_BASE_URL}/v1`,
    })
  }
  return openaiClient
}
