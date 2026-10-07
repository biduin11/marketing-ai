import { afterEach, describe, expect, it, vi } from "vitest"

const { embedTexts, transaction, execute } = vi.hoisted(() => ({
  embedTexts: vi.fn(), transaction: vi.fn(), execute: vi.fn(),
}))
vi.mock("@/lib/ai/embeddings", () => ({ embedTexts }))
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: transaction, $executeRaw: execute } }))
vi.mock("fs", () => ({ default: {
  existsSync: () => true,
  readFileSync: () => "## Section\n" + "Useful marketing advice. ".repeat(10),
} }))

import { seedSkill } from "../lib/skill-seeding"

describe("skill seeding", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

  it("uses bundled files without embedding calls or database writes by default", async () => {
    vi.stubEnv("SKILL_RETRIEVAL_MODE", "")
    expect(await seedSkill("social")).toBe(1)
    expect(embedTexts).not.toHaveBeenCalled()
    expect(transaction).not.toHaveBeenCalled()
  })

  it("does not delete existing chunks when the embedding API fails", async () => {
    vi.stubEnv("SKILL_RETRIEVAL_MODE", "vector")
    embedTexts.mockRejectedValue(new Error("model unavailable"))
    await expect(seedSkill("social")).rejects.toThrow("model unavailable")
    expect(transaction).not.toHaveBeenCalled()
    expect(execute).not.toHaveBeenCalled()
  })
})
