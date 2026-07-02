// Shared defensive parsing helpers for external API responses.
// External payload shapes are not guaranteed, so we narrow carefully and
// never trust the structure.

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function readString(value: unknown): string | null {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return null
}

export function readInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value)
  if (typeof value === "string") {
    const n = Number(value)
    if (Number.isFinite(n)) return Math.round(n)
  }
  return null
}

export function readDate(value: unknown): Date | null {
  if (typeof value === "number") {
    // Heuristic: treat 10-digit values as unix seconds
    const ms = value < 1e12 ? value * 1000 : value
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === "string") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/** Normalizes a date to midnight UTC — used as the unique key for daily stats. */
export function startOfDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}
