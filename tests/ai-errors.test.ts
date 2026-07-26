import { describe, expect, it } from "vitest"
import { classifyError } from "../lib/ai/errors"

describe("classifyError", () => {
  it.each([
    new Error("Rate limit exceeded"),
    new Error("Request timed out."),
    new Error("OPENAI_API_KEY is not set"),
    { status: 503, message: "service unavailable" },
    { response: { status: 429 }, message: "slow down" },
  ])("allows fallback for transient or configuration errors", (error) => {
    expect(classifyError(error).fallbackEligible).toBe(true)
  })

  it.each([
    new Error("invalid schema"),
    new Error("AI-ответ не прошёл валидацию схемы"),
    { status: 401, message: "request rejected" },
    new Error("unexpected application bug"),
  ])("does not mask permanent or unknown errors", (error) => {
    expect(classifyError(error).fallbackEligible).toBe(false)
  })

  it("prioritizes a balance-exhaustion message over HTTP 400", () => {
    const result = classifyError({
      status: 400,
      message: "credit balance is too low",
      toString: () => "credit balance is too low",
    })

    expect(result.fallbackEligible).toBe(true)
  })
})
