/**
 * Classifies provider errors as fallback-eligible (transient — rate limits,
 * timeouts, outages) or not (config/code bugs — bad key, bad schema, bad
 * model name). Used by the Router to decide whether to retry on Gemini or
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
  /ECONNRESET/,
  /ETIMEDOUT/,
  /temporary network/i,
  /internal server error/i,
  /overloaded/i,
  /retry-after/i,
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
  /missing environment variable/i,
  /missing api key/i,
  /is not set/i, // our own "X_API_KEY is not set" errors
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

  if (status !== undefined && NON_FALLBACK_STATUS.has(status)) {
    return { fallbackEligible: false, reason: `HTTP ${status}: ${message}` }
  }
  if (NON_FALLBACK_PATTERNS.some((p) => p.test(message))) {
    return { fallbackEligible: false, reason: message }
  }
  if (status !== undefined && FALLBACK_STATUS.has(status)) {
    return { fallbackEligible: true, reason: `HTTP ${status}: ${message}` }
  }
  if (FALLBACK_PATTERNS.some((p) => p.test(message))) {
    return { fallbackEligible: true, reason: message }
  }

  // Unclassified error shape — default to NOT falling back, so an unexpected
  // bug doesn't get silently masked as "provider is down".
  return { fallbackEligible: false, reason: message }
}
