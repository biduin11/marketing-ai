/**
 * Task → provider/model routing, consumed by lib/ai/router.ts.
 *
 * Everything routes through the "openai" provider — i.e. the OpenAI-
 * compatible client in lib/ai/client.ts, pointed at router.cheap via
 * OPENAI_API_KEY + OPENAI_BASE_URL (a single router.cheap key covers every
 * task below, including the "claude-sonnet-4-6" ones — router.cheap proxies
 * both model families through one OpenAI-shaped API). Gemini is never
 * assigned here as a primary `provider`, only used as the Router's
 * automatic fallback (see router.ts) when a primary call fails with a
 * transient error.
 *
 * useWebSearch is false everywhere now: MARKET/COMPETITORS/REPUTATION used
 * to run through Anthropic's native web_search tool directly, which has no
 * equivalent on router.cheap's OpenAI-compatible surface — those 3 tasks
 * lost real web search as part of this consolidation (accepted trade-off).
 */
export const AI_TASKS = {
  // ═══ CLAUDE (via router.cheap) — стратегический анализ ═══
  COMPANY_ANALYSIS: {
    provider: "openai" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  SWOT: {
    provider: "openai" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  STRATEGY: {
    provider: "openai" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  COMPETITORS: {
    provider: "openai" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  REPUTATION: {
    provider: "openai" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  MARKET: {
    provider: "openai" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },

  // ═══ OPENAI GPT-4o — структурированный анализ ═══
  CJM: {
    provider: "openai" as const,
    model: "gpt-5.4",
    useWebSearch: false,
  },
  AUDIENCE: {
    provider: "openai" as const,
    model: "gpt-5.4",
    useWebSearch: false,
  },
  PRODUCT: {
    provider: "openai" as const,
    model: "gpt-5.4",
    useWebSearch: false,
  },
  OBJECTIONS: {
    provider: "openai" as const,
    model: "gpt-5.4",
    useWebSearch: false,
  },
  PLATFORM_UTP: {
    provider: "openai" as const,
    model: "gpt-5.4-mini",
    useWebSearch: false,
  },
  BRIEFS: {
    provider: "openai" as const,
    model: "gpt-5.4",
    useWebSearch: false,
  },
  SPRINT: {
    provider: "openai" as const,
    model: "gpt-5.4-mini",
    useWebSearch: false,
  },
  EXPRESS_AUDIT: {
    provider: "openai" as const,
    model: "gpt-5.4",
    useWebSearch: false,
  },

  // ═══ OPENAI GPT-4o-mini — копирайтинг и частые/лёгкие генерации ═══
  // CONTENT_PLAN/POSITIONING/DIRECTOR/REPORT were Gemini-primary before this
  // rework — moved to OpenAI since Gemini is fallback-only now.
  OFFERS: {
    provider: "openai" as const,
    model: "gpt-5.4-mini",
    useWebSearch: false,
  },
  CONTENT_PLAN: {
    provider: "openai" as const,
    model: "gpt-5.4-mini",
    useWebSearch: false,
  },
  POSITIONING: {
    provider: "openai" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: false,
  },
  DIRECTOR: {
    provider: "openai" as const,
    model: "gpt-5.4-mini",
    useWebSearch: false,
  },
  REPORT: {
    provider: "openai" as const,
    model: "gpt-5.4-mini",
    useWebSearch: false,
  },
  PERIOD_COMPARISON: {
    provider: "openai" as const,
    model: "gpt-5.4-mini",
    useWebSearch: false,
  },
} as const

export type AITask = keyof typeof AI_TASKS
export type AIProvider = "anthropic" | "openai" | "gemini"
