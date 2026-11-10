// eslint-disable-next-line no-restricted-imports -- Exercise the SDK's actual retry behavior with a fake transport.
import Anthropic from "@anthropic-ai/sdk"
import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { generateStructuredWithAnthropic } from "../lib/ai/generate-with-anthropic"
import { tavilyMultiSearch } from "../lib/services/tavily.service"

vi.mock("@/lib/ai/client", () => ({ anthropic: undefined }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("external request limits", () => {
  it("leaves transient provider failures to the router without retrying inside the SDK", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({ error: { message: "Unavailable" } }, { status: 503 })
    )
    const client = new Anthropic({ apiKey: "test", fetch })

    await expect(generateStructuredWithAnthropic({
      system: "Test",
      user: "Test",
      schema: z.object({ result: z.string() }),
      model: "test",
      client,
    })).rejects.toMatchObject({ status: 503 })

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("drops an expired search while retaining the other search results", async () => {
    vi.spyOn(AbortSignal, "timeout")
      .mockReturnValueOnce(AbortSignal.abort())
      .mockReturnValueOnce(new AbortController().signal)
    const review = { title: "Reviews", url: "https://example.com", content: "Review", score: 1 }
    vi.stubGlobal("fetch", vi.fn<typeof globalThis.fetch>(async (_url, options) => {
      options?.signal?.throwIfAborted()
      return Response.json({ results: [review] })
    }))

    await expect(tavilyMultiSearch(["slow", "fast"])).resolves.toEqual({ slow: [], fast: [review] })
  })
})
