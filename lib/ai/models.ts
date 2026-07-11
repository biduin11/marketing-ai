/**
 * Task → provider/model routing, consumed by lib/ai/router.ts.
 *
 * OpenAI and Anthropic are the two primary providers — Gemini is never
 * assigned here as a primary `provider`, only used as the Router's
 * automatic fallback (see router.ts) when a primary call fails with a
 * transient error. COMPETITORS/REPUTATION/MARKET use Anthropic's
 * web_search tool and are explicitly excluded from fallback — Gemini has
 * no equivalent, so the Router surfaces a clear error instead of switching.
 */
export const AI_TASKS = {
  // ═══ ANTHROPIC — web_search (no fallback) + стратегический анализ ═══
  COMPANY_ANALYSIS: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  SWOT: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  STRATEGY: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  COMPETITORS: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: true,
  },
  REPUTATION: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: true,
  },
  MARKET: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: true,
  },

  // ═══ OPENAI GPT-4o — структурированный анализ ═══
  CJM: {
    provider: "openai" as const,
    model: "gpt-4o",
    useWebSearch: false,
  },
  AUDIENCE: {
    provider: "openai" as const,
    model: "gpt-4o",
    useWebSearch: false,
  },
  PRODUCT: {
    provider: "openai" as const,
    model: "gpt-4o",
    useWebSearch: false,
  },
  OBJECTIONS: {
    provider: "openai" as const,
    model: "gpt-4o",
    useWebSearch: false,
  },
  PLATFORM_UTP: {
    provider: "openai" as const,
    model: "gpt-4o",
    useWebSearch: false,
  },
  BRIEFS: {
    provider: "openai" as const,
    model: "gpt-4o",
    useWebSearch: false,
  },

  // ═══ OPENAI GPT-4o-mini — копирайтинг и частые/лёгкие генерации ═══
  // CONTENT_PLAN/POSITIONING/DIRECTOR/REPORT were Gemini-primary before this
  // rework — moved to OpenAI since Gemini is fallback-only now.
  OFFERS: {
    provider: "openai" as const,
    model: "gpt-4o-mini",
    useWebSearch: false,
  },
  CONTENT_PLAN: {
    provider: "openai" as const,
    model: "gpt-4o-mini",
    useWebSearch: false,
  },
  POSITIONING: {
    provider: "openai" as const,
    model: "gpt-4o-mini",
    useWebSearch: false,
  },
  DIRECTOR: {
    provider: "openai" as const,
    model: "gpt-4o-mini",
    useWebSearch: false,
  },
  REPORT: {
    provider: "openai" as const,
    model: "gpt-4o-mini",
    useWebSearch: false,
  },
} as const

export type AITask = keyof typeof AI_TASKS
export type AIProvider = "anthropic" | "openai" | "gemini"
