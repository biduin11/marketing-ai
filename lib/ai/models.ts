/**
 * Task → provider/model routing, consumed by lib/ai/router.ts.
 *
 * Model selection is per (task, plan): each task defines a `byPlan` matrix
 * with an entry for FREE/PRO/MAX. Both "anthropic" and "openai" providers
 * point at router.cheap — a single router.cheap key (in both
 * ANTHROPIC_API_KEY and OPENAI_API_KEY, with ANTHROPIC_BASE_URL/
 * OPENAI_BASE_URL pointed at router.cheap's respective compatible endpoints
 * — see lib/ai/client.ts) covers every task here. "anthropic" tasks get
 * native tool-forced structured output via generate-with-anthropic.ts.
 * "openai" tasks use response_format: json_object with the JSON Schema
 * embedded in the prompt (see generate-with-openai.ts) since that surface
 * has no native schema enforcement.
 *
 * COMPETITORS/REPUTATION/MARKET have `requiresSearch: true` — a marker
 * consumed by the service layer (reputation/competitor/market.service.ts),
 * which runs the actual web search via Tavily (lib/services/tavily.service.ts)
 * and embeds the results as text in the prompt before calling routeAI. It is
 * NOT passed to the Anthropic API — router.cheap doesn't proxy Anthropic's
 * native web_search_20250305 server-side tool, so search now happens entirely
 * outside the model call. Because the search results arrive as plain prompt
 * text, any provider can analyze them — Gemini is a valid automatic fallback
 * for these tasks too (see router.ts).
 *
 * COMPETITORS/REPUTATION/MARKET have `byPlan.FREE: null` — gated on
 * PLAN_LIMITS[plan].webSearch in lib/gates.ts before the service layer ever
 * calls resolveTaskConfig, so the throw below is a defensive backstop, not
 * the primary gate.
 */
import type { PlanName } from "@/lib/config/plans"

export type { PlanName }

export type AIProvider = "anthropic" | "openai" | "gemini"

interface TaskModelConfig {
  provider: AIProvider
  model: string
}

interface TaskDefinition {
  requiresSearch: boolean
  byPlan: Record<PlanName, TaskModelConfig | null>
}

export const AI_TASKS = {
  // ═══ ANTHROPIC (via router.cheap) — стратегический анализ ═══
  COMPANY_ANALYSIS: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "anthropic", model: "claude-haiku-4-5" },
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  SWOT: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "anthropic", model: "claude-haiku-4-5" },
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  STRATEGY: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "anthropic", model: "claude-haiku-4-5" },
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  POSITIONING: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "anthropic", model: "claude-haiku-4-5" },
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },

  // ═══ ANTHROPIC (via router.cheap) — требует предварительного поиска (Tavily), недоступно на FREE ═══
  COMPETITORS: {
    requiresSearch: true,
    byPlan: {
      FREE: null,
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  REPUTATION: {
    requiresSearch: true,
    byPlan: {
      FREE: null,
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  MARKET: {
    requiresSearch: true,
    byPlan: {
      FREE: null,
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },

  // ═══ OPENAI — структурированный анализ ═══
  CJM: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.6-sol" },
    },
  },
  AUDIENCE: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.6-sol" },
    },
  },
  PRODUCT: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.6-sol" },
    },
  },
  BRIEFS: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.5" },
    },
  },
  EXPRESS_AUDIT: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.5" },
    },
  },

  // ═══ OPENAI — копирайтинг и частые/лёгкие генерации ═══
  PLATFORM_UTP: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  SPRINT: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  OFFERS: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  CONTENT_PLAN: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  DIRECTOR: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  REPORT: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  PERIOD_COMPARISON: {
    requiresSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
} as const satisfies Record<string, TaskDefinition>

export type AITask = keyof typeof AI_TASKS

/** Resolves the provider/model for a task at a given plan tier. Throws if the
 * task has no config for that plan (search tasks on FREE) — callers must
 * gate on PLAN_LIMITS[plan].webSearch (lib/gates.ts) before reaching this. */
export function resolveTaskConfig(
  task: AITask,
  plan: PlanName
): TaskModelConfig & { requiresSearch: boolean } {
  const definition = AI_TASKS[task]
  const config = definition.byPlan[plan]
  if (!config) {
    throw new Error(`Task ${task} is not available on plan ${plan}`)
  }
  return { ...config, requiresSearch: definition.requiresSearch }
}
