/**
 * Task → provider/model routing, consumed by lib/ai/router.ts.
 *
 * Both "anthropic" and "openai" providers below point at router.cheap — a
 * single router.cheap key (in both ANTHROPIC_API_KEY and OPENAI_API_KEY,
 * with ANTHROPIC_BASE_URL/OPENAI_BASE_URL pointed at router.cheap's
 * respective compatible endpoints — see lib/ai/client.ts) covers every task
 * here. "anthropic" tasks get native tool-forced structured output and (for
 * COMPETITORS/REPUTATION/MARKET) the real web_search_20250305 tool; "openai"
 * tasks use response_format: json_object with the JSON Schema embedded in
 * the prompt (see generate-with-openai.ts) since that surface has no native
 * schema enforcement. Gemini is never assigned here as a primary `provider`,
 * only used as the Router's automatic fallback (see router.ts) when a
 * primary call fails with a transient error — COMPETITORS/REPUTATION/MARKET
 * are excluded from that fallback since Gemini has no web_search equivalent.
 */
export const AI_TASKS = {
  // ═══ ANTHROPIC (via router.cheap) — web_search + стратегический анализ ═══
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
    provider: "anthropic" as const,
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
