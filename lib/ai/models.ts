/**
 * Task → provider/model routing. Only COMPANY_ANALYSIS is wired into a
 * service so far (see company.service.ts) — the rest are reserved for the
 * next steps, one service at a time, per confirmation.
 *
 * Two deviations from the original spec, both flagged before implementing:
 * - `gemini-1.5-flash` → `gemini-2.5-flash` (1.5 is retired, 404s on
 *   v1beta generateContent — this is the exact bug fixed in the previous
 *   Gemini-fallback work).
 * - `deepseek-reasoner` → `deepseek-chat` for every DeepSeek task. R1
 *   (reasoner) does not support DeepSeek's JSON-object response format —
 *   only deepseek-chat (V3) does. Since every task here needs reliable
 *   structured JSON, chat is the safe default. Swap back to `deepseek-reasoner`
 *   per-task if reasoning quality matters more than JSON-mode reliability
 *   for that task — just know parseAIJson() has to carry the schema-drift
 *   risk alone then (no responseSchema equivalent for DeepSeek).
 */
export const AI_TASKS = {
  // ═══ ANTHROPIC (Claude Sonnet) ═══
  // Только задачи требующие web_search или максимального качества анализа

  COMPETITORS: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: true,
    reason: "Нужен web_search для реальных данных",
  },
  REPUTATION: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: true,
    reason: "Нужен web_search для поиска отзывов",
  },
  MARKET: {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-6",
    useWebSearch: true,
    reason: "Нужен web_search для рыночных данных",
  },

  // ═══ DEEPSEEK (V3 chat — JSON-mode capable) ═══
  // Тяжёлый аналитический анализ без поиска

  COMPANY_ANALYSIS: {
    provider: "deepseek" as const,
    model: "deepseek-chat",
    useWebSearch: false,
    reason: "Глубокий анализ без поиска",
  },
  SWOT: {
    provider: "deepseek" as const,
    model: "deepseek-chat",
    useWebSearch: false,
    reason: "Стратегический анализ",
  },
  STRATEGY: {
    provider: "deepseek" as const,
    model: "deepseek-chat",
    useWebSearch: false,
    reason: "Стратегическое планирование",
  },
  PRODUCT: {
    provider: "deepseek" as const,
    model: "deepseek-chat",
    useWebSearch: false,
    reason: "BCG, ABC, продуктовый анализ",
  },
  CJM: {
    provider: "deepseek" as const,
    model: "deepseek-chat",
    useWebSearch: false,
    reason: "Построение пути клиента",
  },
  AUDIENCE: {
    provider: "deepseek" as const,
    model: "deepseek-chat",
    useWebSearch: false,
    reason: "Анализ аудитории и персоны",
  },

  // ═══ GEMINI 2.5 FLASH ═══
  // Быстрые и частые генерации

  CONTENT_PLAN: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
    reason: "Частая генерация",
  },
  OFFERS: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
    reason: "Быстрая генерация офферов",
  },
  DIRECTOR: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
    reason: "Ежедневный дайджест, нужна скорость",
  },
  POSITIONING: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
    reason: "Генерация позиционирования",
  },
  REPORT: {
    provider: "gemini" as const,
    model: "gemini-2.5-flash",
    useWebSearch: false,
    reason: "Генерация отчётов",
  },
} as const
