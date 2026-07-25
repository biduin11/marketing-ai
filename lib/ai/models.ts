/**
 * Task → provider/model routing, consumed by lib/ai/router.ts.
 *
 * Model selection is per (task, plan): each task defines a `byPlan` matrix
 * with an entry for FREE/PRO/MAX. Both "anthropic" and "openai" providers
 * point at router.cheap — a single router.cheap key (in both
 * ANTHROPIC_API_KEY and OPENAI_API_KEY, with ANTHROPIC_BASE_URL/
 * OPENAI_BASE_URL pointed at router.cheap's respective compatible endpoints
 * — see lib/ai/client.ts) covers every task here. "anthropic" tasks get
 * native tool-forced structured output and (for COMPETITORS/REPUTATION/
 * MARKET) the real web_search_20250305 tool; "openai" tasks use
 * response_format: json_object with the JSON Schema embedded in the prompt
 * (see generate-with-openai.ts) since that surface has no native schema
 * enforcement. Gemini is never assigned here as a primary `provider`, only
 * used as the Router's automatic fallback (see router.ts) when a primary
 * call fails with a transient error — COMPETITORS/REPUTATION/MARKET are
 * excluded from that fallback since Gemini has no web_search equivalent.
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
  useWebSearch: boolean
  byPlan: Record<PlanName, TaskModelConfig | null>
}

export const AI_TASKS = {
  // ═══ ANTHROPIC (via router.cheap) — стратегический анализ ═══
  COMPANY_ANALYSIS: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "anthropic", model: "claude-haiku-4-5" },
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  SWOT: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "anthropic", model: "claude-haiku-4-5" },
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  STRATEGY: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "anthropic", model: "claude-haiku-4-5" },
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  POSITIONING: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "anthropic", model: "claude-haiku-4-5" },
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },

  // ═══ ANTHROPIC (via router.cheap) — web_search, недоступно на FREE ═══
  COMPETITORS: {
    useWebSearch: true,
    byPlan: {
      FREE: null,
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  REPUTATION: {
    useWebSearch: true,
    byPlan: {
      FREE: null,
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },
  MARKET: {
    useWebSearch: true,
    byPlan: {
      FREE: null,
      PRO: { provider: "anthropic", model: "claude-sonnet-4-6" },
      MAX: { provider: "anthropic", model: "claude-opus-4-8" },
    },
  },

  // ═══ OPENAI — структурированный анализ ═══
  CJM: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.6-sol" },
    },
  },
  AUDIENCE: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.6-sol" },
    },
  },
  PRODUCT: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.6-sol" },
    },
  },
  BRIEFS: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.5" },
    },
  },
  EXPRESS_AUDIT: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4" },
      MAX: { provider: "openai", model: "gpt-5.5" },
    },
  },

  // ═══ OPENAI — копирайтинг и частые/лёгкие генерации ═══
  PLATFORM_UTP: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  SPRINT: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  OFFERS: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  CONTENT_PLAN: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  DIRECTOR: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  REPORT: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
  PERIOD_COMPARISON: {
    useWebSearch: false,
    byPlan: {
      FREE: { provider: "openai", model: "gpt-5.4-mini" },
      PRO: { provider: "openai", model: "gpt-5.4-mini" },
      MAX: { provider: "openai", model: "gpt-5.4" },
    },
  },
} as const satisfies Record<string, TaskDefinition>

export type AITask = keyof typeof AI_TASKS

/** Resolves the provider/model for a task at a given plan tier. Throws if the
 * task has no config for that plan (web_search tasks on FREE) — callers must
 * gate on PLAN_LIMITS[plan].webSearch (lib/gates.ts) before reaching this. */
export function resolveTaskConfig(
  task: AITask,
  plan: PlanName
): TaskModelConfig & { useWebSearch: boolean } {
  const definition = AI_TASKS[task]
  const config = definition.byPlan[plan]
  if (!config) {
    throw new Error(`Task ${task} is not available on plan ${plan}`)
  }
  return { ...config, useWebSearch: definition.useWebSearch }
}
