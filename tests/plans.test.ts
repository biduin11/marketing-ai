import { afterEach, describe, expect, it, vi } from "vitest"
import { getEffectivePlan, PLAN_LIMITS } from "../lib/config/plans"

describe("plan configuration", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps plans without an expiration date active", () => {
    expect(getEffectivePlan("MAX", null)).toBe("MAX")
  })

  it("downgrades an expired paid plan to FREE", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-26T12:00:00.000Z"))

    expect(
      getEffectivePlan("PRO", new Date("2026-07-25T12:00:00.000Z"))
    ).toBe("FREE")
  })

  it("keeps a paid plan active until its expiration date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-26T12:00:00.000Z"))

    expect(
      getEffectivePlan("PRO", new Date("2026-07-27T12:00:00.000Z"))
    ).toBe("PRO")
  })

  it("preserves unlimited MAX limits", () => {
    expect(PLAN_LIMITS.MAX.maxProjects).toBe(Infinity)
    expect(PLAN_LIMITS.MAX.maxGenerationsPerMonth).toBe(Infinity)
  })
})
