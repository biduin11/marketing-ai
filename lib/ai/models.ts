/**
 * Task → provider/model routing. Constants only, no dispatch logic — not
 * currently wired into generate.ts (which switches provider globally via
 * AI_PROVIDER, not per-task) or any service.
 *
 * One deviation from the spec, flagged before applying: `gemini-1.5-flash`
 * (DIRECTOR, REPORT) → `gemini-2.5-flash`. 1.5-flash is retired — 404s on
 * v1beta generateContent — this is the exact bug already fixed once in the
 * Gemini-fallback work; kept it fixed here rather than reintroducing it.
 */
export const AI_TASKS = {
  // ═══ ANTHROPIC — web_search + стратегический анализ ═══
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

  // ═══ OPENAI GPT-4o-mini — копирайтинг ═══
  OFFERS: {
    provider: "openai" as const,
    model: "gpt-4o-mini",
    useWebSearch: false,
  },

  // ═══ GEMINI 2.5 Flash — контент и творческие задачи ═══
  CONTENT_PLAN: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
  },
  POSITIONING: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
  },

  // ═══ GEMINI 2.5 Flash — рутинные частые генерации ═══
  // (было gemini-1.5-flash в спеке — retired, см. комментарий выше файла)
  DIRECTOR: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
  },
  REPORT: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
  },
} as const

export type AITask = keyof typeof AI_TASKS
export type AIProvider = "anthropic" | "openai" | "gemini"
