import { SchemaType, type Schema as GeminiSchema } from "@google/generative-ai"

/**
 * Converts a zod-derived JSON Schema (draft-7, as produced by z.toJSONSchema)
 * into Gemini's responseSchema format — a much stricter OpenAPI 3.0 subset
 * (SchemaType enum, no `type` arrays, no `additionalProperties`/`default`/
 * `minimum`/`maximum`). `.nullable()`/`.optional()` fields come through as
 * `{ anyOf: [<type>, { type: "null" }] }` — converted here to `{ ...type,
 * nullable: true }`, which Gemini's schema natively supports.
 *
 * Verified against the actual output of z.toJSONSchema (not assumed) —
 * see the zod version pinned in package.json.
 */
export function zodJsonSchemaToGeminiSchema(node: unknown): GeminiSchema {
  const n = node as Record<string, unknown>

  if (Array.isArray(n.anyOf)) {
    const branches = n.anyOf as Record<string, unknown>[]
    const nonNull = branches.find((b) => b.type !== "null")
    const hasNull = branches.some((b) => b.type === "null")
    const converted = nonNull
      ? zodJsonSchemaToGeminiSchema(nonNull)
      : ({ type: SchemaType.STRING } as GeminiSchema)
    return { ...converted, nullable: hasNull || !!(converted as { nullable?: boolean }).nullable } as GeminiSchema
  }

  switch (n.type) {
    case "object": {
      const props = (n.properties as Record<string, unknown>) ?? {}
      const properties: Record<string, GeminiSchema> = {}
      for (const [key, value] of Object.entries(props)) {
        properties[key] = zodJsonSchemaToGeminiSchema(value)
      }
      const required = (n.required as string[] | undefined)?.filter((k) => k in properties)
      return {
        type: SchemaType.OBJECT,
        properties,
        ...(required && required.length > 0 ? { required } : {}),
      } as GeminiSchema
    }
    case "array":
      return {
        type: SchemaType.ARRAY,
        items: zodJsonSchemaToGeminiSchema(n.items ?? { type: "string" }),
      } as GeminiSchema
    case "string":
      return Array.isArray(n.enum) && n.enum.length > 0
        ? ({ type: SchemaType.STRING, format: "enum", enum: n.enum as string[] } as GeminiSchema)
        : ({ type: SchemaType.STRING } as GeminiSchema)
    case "integer":
      return { type: SchemaType.INTEGER } as GeminiSchema
    case "number":
      return { type: SchemaType.NUMBER } as GeminiSchema
    case "boolean":
      return { type: SchemaType.BOOLEAN } as GeminiSchema
    default:
      // Unknown/unsupported node shape — fall back to a permissive nullable string
      // rather than throwing, so one odd field doesn't break the whole schema.
      return { type: SchemaType.STRING, nullable: true } as GeminiSchema
  }
}
