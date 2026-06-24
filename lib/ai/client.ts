import Anthropic from "@anthropic-ai/sdk"
import { env } from "@/env.mjs"

/** AI model used for all generations. Change here to swap models project-wide. */
export const AI_MODEL = "claude-sonnet-4-6"

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined
}

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: env.ANTHROPIC_API_KEY ?? "" })

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropic = anthropic
