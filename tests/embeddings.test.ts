import { afterEach, describe, expect, it, vi } from "vitest"
import { embedTexts } from "../lib/ai/embeddings"

const { create, construct, APIError } = vi.hoisted(() => {
  class APIError extends Error { status = 404 }
  return { create: vi.fn(), construct: vi.fn(), APIError }
})
vi.mock("openai", () => {
  class OpenAI {
    static APIError = APIError
    embeddings = { create }
    constructor(options: unknown) { construct(options) }
  }
  return { default: OpenAI }
})

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

describe("skill embeddings", () => {
  it("uses the separate provider and preserves input order", async () => {
    vi.stubEnv("EMBEDDING_API_KEY", "embedding-key")
    vi.stubEnv("EMBEDDING_BASE_URL", "https://embedding.example/v1")
    vi.stubEnv("EMBEDDING_MODEL", "available-model")
    create.mockResolvedValue({ data: [
      { index: 1, embedding: Array(1536).fill(2) },
      { index: 0, embedding: Array(1536).fill(1) },
    ] })
    const vectors = await embedTexts(["first", "second"])
    expect(construct).toHaveBeenCalledWith({ apiKey: "embedding-key", baseURL: "https://embedding.example/v1" })
    expect(create).toHaveBeenCalledWith({ model: "available-model", input: ["first", "second"] })
    expect(vectors.map((v) => v[0])).toEqual([1, 2])
  })

  it("keeps the existing router configuration as a default", async () => {
    vi.stubEnv("EMBEDDING_API_KEY", "")
    vi.stubEnv("EMBEDDING_BASE_URL", "")
    vi.stubEnv("EMBEDDING_MODEL", "")
    vi.stubEnv("OPENAI_API_KEY", "router-key")
    vi.stubEnv("OPENAI_BASE_URL", "https://router.example/v1")
    create.mockResolvedValue({ data: [{ index: 0, embedding: Array(1536).fill(1) }] })
    await embedTexts(["query"])
    expect(construct).toHaveBeenCalledWith({ apiKey: "router-key", baseURL: "https://router.example/v1" })
    expect(create).toHaveBeenCalledWith({ model: "text-embedding-3-small", input: ["query"] })
  })

  it("rejects incompatible dimensions before writing vectors", async () => {
    vi.stubEnv("EMBEDDING_API_KEY", "key")
    create.mockResolvedValue({ data: [{ index: 0, embedding: [1, 2] }] })
    await expect(embedTexts(["query"])).rejects.toThrow("1536")
  })

  it("explains how to configure the provider when the model returns 404", async () => {
    vi.stubEnv("EMBEDDING_API_KEY", "key")
    create.mockRejectedValue(new APIError("unavailable"))
    await expect(embedTexts(["query"])).rejects.toThrow("GET /v1/models")
  })
})
