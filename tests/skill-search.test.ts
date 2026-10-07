import { afterEach, describe, expect, it, vi } from "vitest"
import { chunkMarkdown } from "../lib/skill-chunks"
import { rankSkillChunks } from "../lib/skill-search"

const { embedTexts, queryRaw } = vi.hoisted(() => ({ embedTexts: vi.fn(), queryRaw: vi.fn() }))
vi.mock("@/lib/ai/embeddings", () => ({ embedTexts }))
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRawUnsafe: queryRaw } }))
import { buildSystemPrompt, retrieveChunks } from "../lib/marketing-skills"

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

describe("file skill retrieval", () => {
  it("ranks matching headings above incidental body matches", () => {
    const chunks = [
      { skillSlug: "social", section: "Overview", content: "Use analytics regularly." },
      { skillSlug: "social", section: "Analytics", content: "Measure results." },
    ]
    expect(rankSkillChunks("analytics", chunks, 1)[0].section).toBe("Analytics")
  })

  it("keeps introductory context when no words match", () => {
    const chunks = [
      { skillSlug: "social", section: "Introduction", content: "Start here" },
      { skillSlug: "social", section: "Details", content: "More advice" },
    ]
    expect(rankSkillChunks("несовпадающий", chunks, 1)[0].section).toBe("Introduction")
    expect(rankSkillChunks("", chunks, 0)).toEqual([])
  })

  it("bounds even a long paragraph within the prompt chunk budget", () => {
    const chunks = chunkMarkdown("## Long section\n" + "a".repeat(9000))
    expect(chunks.every((chunk) => chunk.content.length <= 2500)).toBe(true)
    expect(chunks.map((chunk) => chunk.content).join("")).toHaveLength(9000)
  })

  it("builds a real content prompt without an embedding key or seeded database", async () => {
    vi.stubEnv("SKILL_RETRIEVAL_MODE", "")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("EMBEDDING_API_KEY", "")
    const prompt = await buildSystemPrompt({ featureId: "content-plan", userQuery: "LinkedIn engagement" })
    expect(prompt).toContain("## Скил: content-strategy")
    expect(prompt).toContain("## Скил: social (релевантные фрагменты)")
    expect(embedTexts).not.toHaveBeenCalled()
    expect(queryRaw).not.toHaveBeenCalled()
  })

  it("limits retrieval to the requested skill", async () => {
    vi.stubEnv("SKILL_RETRIEVAL_MODE", "lexical")
    const chunks = await retrieveChunks("поисковая оптимизация", { skillSlug: "ai-seo", topK: 3 })
    expect(chunks).toHaveLength(3)
    expect(chunks.every((chunk) => chunk.skillSlug === "ai-seo")).toBe(true)
  })
})
