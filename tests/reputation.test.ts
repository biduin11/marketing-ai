import { describe, expect, it } from "vitest"
import { groundGrowthPoints, reputationInputSchema } from "../lib/ai/schemas/reputation"

describe("review growth analysis", () => {
  it("keeps only growth points with a quote present in the supplied text", () => {
    const point = { quote: "Ждали 55 минут", issue: "Задержка приёма", action: "Предупреждать о задержке" }
    expect(groundGrowthPoints(
      [point, { ...point, quote: "Цена выросла" }],
      [{ text: "Ждали\n55 минут.", url: "https://example.com/reviews" }]
    )).toEqual([{ ...point, url: "https://example.com/reviews" }])
  })

  it("rejects a blank or oversized manual upload", () => {
    expect(reputationInputSchema.safeParse({ mode: "manual", text: "  " }).success).toBe(false)
    expect(reputationInputSchema.safeParse({ mode: "manual", text: "а".repeat(30001) }).success).toBe(false)
  })
})
