import { createHash } from "node:crypto"

/**
 * Stable SHA-256 hash of an arbitrary object. Keys are sorted recursively so
 * the same logical input always produces the same hash (used for AI cache).
 */
export function computeInputHash(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex")
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`
}
