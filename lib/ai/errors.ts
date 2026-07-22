/**
 * Classifies provider errors as fallback-eligible (transient outages, or a
 * missing API key — absent config, not a code bug) or not (schema/model/
 * prompt bugs). Used by the Router to decide whether to retry on Gemini or
 * surface the error as-is to the developer.
 */
export interface ErrorClassification {
  fallbackEligible: boolean
  reason: string
}

const FALLBACK_STATUS = new Set([429, 500, 503, 504])

const FALLBACK_PATTERNS = [
  /rate.?limit/i,
  /too many requests/i,
  /quota/i,
  /daily limit/i,
  /monthly limit/i,
  /credits?.?exhausted/i,
  /billing required/i,
  /service unavailable/i,
  /gateway timeout/i,
  /\btimeout\b/i,
  /connection timeout/i,
  /timed out/i, // Anthropic SDK's default timeout error message ("Request timed out.")
  /ECONNRESET/,
  /ETIMEDOUT/,
  /temporary network/i,
  /internal server error/i,
  /overloaded/i,
  /retry-after/i,
  // Missing/absent config, not a code bug: the key simply isn't set in this
  // environment (e.g. a preview deploy without secrets configured yet), so
  // the Router falls back instead of failing the whole task. See router.ts
  // for the console.warn emitted specifically for this case.
  /missing environment variable/i,
  /missing api key/i,
  /is not set/i, // our own "X_API_KEY is not set" errors
  /is undefined/i, // e.g. "process.env.OPENAI_API_KEY is undefined"
  // Anthropic returns HTTP 400 for balance exhaustion, not a real client-error
  // (bad request) — same "absent config, not a code bug" reasoning as the
  // missing-key patterns above.
  /credit balance is too low/i,
  /insufficient_funds/i,
  /upgrade or purchase credits/i,
  /plans & billing/i,
]

const NON_FALLBACK_STATUS = new Set([400, 401, 403, 404])

const NON_FALLBACK_PATTERNS = [
  /invalid prompt/i,
  /invalid json/i,
  /invalid schema/i,
  /invalid (function|tool) call/i,
  /invalid parameters/i,
  /unsupported model/i,
  /model not found/i,
  /invalid api key/i,
  /unauthorized/i,
  /forbidden/i,
  /syntax error/i,
  /parsing error/i,
  /validation error/i,
  /prompt too large/i,
  // Our own zod-validation failure after a successful provider response — a
  // prompt/schema mismatch bug, not a transient outage. See AI_TASKS.
  /не прошёл валидацию схемы/i,
]

function getStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined
  const e = error as Record<string, unknown>
  if (typeof e.status === "number") return e.status
  const response = e.response as Record<string, unknown> | undefined
  if (response && typeof response.status === "number") return response.status
  return undefined
}

function getMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function classifyError(error: unknown): ErrorClassification {
  const status = getStatus(error)
  const message = getMessage(error)

  // Message content takes priority over HTTP status: Anthropic returns HTTP
  // 400 for "credit balance is too low", which is balance exhaustion, not a
  // client-error (bad request) — a status-only check would misclassify it
  // as NON_FALLBACK.
  if (NON_FALLBACK_PATTERNS.some((p) => p.test(message))) {
    return { fallbackEligible: false, reason: message }
  }
  if (FALLBACK_PATTERNS.some((p) => p.test(message))) {
    return { fallbackEligible: true, reason: message }
  }
  if (status !== undefined && NON_FALLBACK_STATUS.has(status)) {
    return { fallbackEligible: false, reason: `HTTP ${status}: ${message}` }
  }
  if (status !== undefined && FALLBACK_STATUS.has(status)) {
    return { fallbackEligible: true, reason: `HTTP ${status}: ${message}` }
  }

  // Unclassified error shape — default to NOT falling back, so an unexpected
  // bug doesn't get silently masked as "provider is down".
  return { fallbackEligible: false, reason: message }
}
