import { z } from "zod"
import { generateStructuredWithAnthropic } from "@/lib/ai/generate-with-anthropic"
import { generateStructuredWithOpenAI } from "@/lib/ai/generate-with-openai"
import { getClaudeHubAnthropicClient, getClaudeHubOpenAIClient } from "@/lib/ai/claudehub-client"
import type { AIProvider, PlanName } from "@/lib/ai/models"

/**
 * ClaudeHub model ids (see /docs/models on app.claudehub.fun) use dots, not
 * the dashed ids router.cheap exposes (claude-sonnet-4.6 vs
 * claude-sonnet-4-6) — these are NOT the same strings as AI_TASKS in
 * models.ts. Fallback is tier-agnostic on the Anthropic side (routeAI's
 * primary call already failed, so a fixed mid-tier model is fine, matching
 * the old flat-Gemini-fallback behavior). The OpenAI side splits FREE vs
 * PRO/MAX because ClaudeHub's catalog has no mini-tier gpt-5.4-mini
 * equivalent — deepseek-v4-flash is the cheap stand-in for FREE.
 */
const CLAUDEHUB_ANTHROPIC_MODEL = "claude-sonnet-4.6"
const CLAUDEHUB_OPENAI_MODEL_FREE = "deepseek-v4-flash"
const CLAUDEHUB_OPENAI_MODEL_PAID = "gpt-5.4"

interface GenerateStructuredWithClaudeHubArgs<T extends z.ZodType> {
  /** Which ClaudeHub mode to call — mirrors the original task's provider so the same prompt/schema shape works unchanged. */
  originalProvider: Extract<AIProvider, "anthropic" | "openai">
  plan: PlanName
  system: string
  user: string
  schema: T
  maxTokens?: number
}

export async function generateStructuredWithClaudeHub<T extends z.ZodType>({
  originalProvider,
  plan,
  system,
  user,
  schema,
  maxTokens,
}: GenerateStructuredWithClaudeHubArgs<T>): Promise<{ data: z.infer<T>; model: string }> {
  if (originalProvider === "anthropic") {
    return generateStructuredWithAnthropic({
      system,
      user,
      schema,
      model: CLAUDEHUB_ANTHROPIC_MODEL,
      maxTokens,
      client: getClaudeHubAnthropicClient(),
    })
  }

  const model = plan === "FREE" ? CLAUDEHUB_OPENAI_MODEL_FREE : CLAUDEHUB_OPENAI_MODEL_PAID
  return generateStructuredWithOpenAI({
    system,
    user,
    schema,
    model,
    maxTokens,
    client: getClaudeHubOpenAIClient(),
  })
}
