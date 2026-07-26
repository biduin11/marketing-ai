import { describe, expect, it } from "vitest"
import {
  computeDelta,
  getPreviousRange,
} from "../lib/services/analytics.service"

describe("analytics calculations", () => {
  it.each([
    [0, 0, 0],
    [10, 0, 100],
    [120, 100, 20],
    [80, 100, -20],
    [-50, -100, 50],
  ])("computes delta for %s versus %s", (current, previous, expected) => {
    expect(computeDelta(current, previous)).toBe(expected)
  })

  it("builds the adjacent previous date range", () => {
    const from = new Date("2026-07-10T00:00:00.000Z")
    const to = new Date("2026-07-20T00:00:00.000Z")

    expect(getPreviousRange(from, to)).toEqual({
      from: new Date("2026-06-30T00:00:00.000Z"),
      to: from,
    })
  })
})
