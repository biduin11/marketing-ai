/**
 * lib/marketing-skills.ts
 *
 * Единая точка входа: собирает system prompt для AI-вызова из
 *   а) лёгких скилов — грузятся из файла целиком,
 *   б) тяжёлых скилов — top-K релевантных чанков через pgvector,
 *   в) Spiritsa-психотип-профиля клиента.
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/ai/client";

const openai = getOpenAIClient(); // тот же клиент/ключ (OPENAI_API_KEY + OPENAI_BASE_URL), что и у GPT-задач в lib/ai

const SKILLS_DIR = path.join(process.cwd(), "lib/marketing-skills");
const EMBEDDING_MODEL = "text-embedding-3-small";

// --- Лёгкие скилы: грузятся целиком, без RAG -------------------------------

const LIGHT_SKILLS = new Set([
  "content-strategy",
  "marketing-ideas",
  "product-marketing",
  "brand-positioning-toolkit",
  "brand-marketing-check",
  "customer-research",
  "competitor-profiling",
  "competitors",
  "customer-journey-map",
  "seo-audit",
  "schema",
  "programmatic-seo",
  "launch",
  "marketing-council",
]);

const HEAVY_SKILLS = new Set([
  "marketing-plan",
  "marketing-loops",
  "social",
  "ad-creative",
  "sales-enablement",
  "ai-seo",
]);

// Какие скилы нужны какой фиче/агенту в приложении.
// Подгони под реальные фичи AI Marketing OS.
export const FEATURE_SKILLS: Record<string, string[]> = {
  "content-plan": ["content-strategy", "product-marketing"],
  "ad-copy": ["ad-creative", "product-marketing"],
  "seo-brief": ["seo-audit", "ai-seo", "schema"],
  "sales-collateral": ["sales-enablement", "competitors"],
  "gtm-plan": ["marketing-plan", "product-marketing"],
  "social-content": ["social", "content-strategy"],
  "launch-plan": ["launch", "marketing-plan"],
  "competitor-teardown": ["competitor-profiling", "competitors"],
};

const lightSkillCache = new Map<string, string>();

function loadLightSkill(slug: string): string {
  if (lightSkillCache.has(slug)) return lightSkillCache.get(slug)!;
  const filePath = path.join(SKILLS_DIR, `${slug}.md`);
  const content = fs.readFileSync(filePath, "utf-8");
  lightSkillCache.set(slug, content);
  return content;
}

// --- Тяжёлые скилы: RAG-ретривал через pgvector -----------------------------

async function embedQuery(query: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: query });
  return res.data[0].embedding;
}

interface RetrievedChunk {
  skillSlug: string;
  section: string;
  content: string;
  similarity: number;
}

/**
 * Достаёт topK самых релевантных чанков по конкретному skillSlug (или по всем
 * heavy-скилам сразу, если slug не передан) для данного запроса.
 */
export async function retrieveChunks(
  query: string,
  opts: { skillSlug?: string; topK?: number } = {}
): Promise<RetrievedChunk[]> {
  const { skillSlug, topK = 5 } = opts;
  const queryEmbedding = await embedQuery(query);
  const vecLiteral = `[${queryEmbedding.join(",")}]`;

  const rows = skillSlug
    ? await prisma.$queryRawUnsafe<RetrievedChunk[]>(
        `SELECT skill_slug as "skillSlug", section, content,
                1 - (embedding <=> $1::vector) as similarity
         FROM skill_chunks
         WHERE skill_slug = $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        vecLiteral,
        skillSlug,
        topK
      )
    : await prisma.$queryRawUnsafe<RetrievedChunk[]>(
        `SELECT skill_slug as "skillSlug", section, content,
                1 - (embedding <=> $1::vector) as similarity
         FROM skill_chunks
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        vecLiteral,
        topK
      );

  return rows;
}

// --- Сборка system prompt -----------------------------------------------

export interface SpiritsaProfile {
  type: "Traditionalist" | "Independent" | "Aesthete" | "Hedonist";
  [key: string]: unknown;
}

export interface BuildPromptOptions {
  featureId: string; // ключ из FEATURE_SKILLS
  userQuery: string; // нужен для RAG-ретривала по тяжёлым скилам
  spiritsaProfile?: SpiritsaProfile;
  topKPerHeavySkill?: number;
}

export async function buildSystemPrompt(opts: BuildPromptOptions): Promise<string> {
  const { featureId, userQuery, spiritsaProfile, topKPerHeavySkill = 4 } = opts;
  const skillSlugs = FEATURE_SKILLS[featureId] ?? [];

  const parts: string[] = [];

  // лёгкие — целиком
  for (const slug of skillSlugs) {
    if (LIGHT_SKILLS.has(slug)) {
      parts.push(`## Скил: ${slug}\n\n${loadLightSkill(slug)}`);
    }
  }

  // тяжёлые — только релевантные чанки под текущий запрос
  for (const slug of skillSlugs) {
    if (HEAVY_SKILLS.has(slug)) {
      const chunks = await retrieveChunks(userQuery, { skillSlug: slug, topK: topKPerHeavySkill });
      if (chunks.length) {
        const body = chunks
          .map((c) => `### ${c.section}\n${c.content}`)
          .join("\n\n");
        parts.push(`## Скил: ${slug} (релевантные фрагменты)\n\n${body}`);
      }
    }
  }

  if (spiritsaProfile) {
    parts.push(`## Профиль клиента (Spiritsa)\n\n${JSON.stringify(spiritsaProfile, null, 2)}`);
  }

  return parts.join("\n\n---\n\n");
}

/**
 * Пример использования в API-роуте:
 *
 * const systemPrompt = await buildSystemPrompt({
 *   featureId: "ad-copy",
 *   userQuery: "Заголовки для рекламы монтажа мембранной кровли, ЦА — застройщики",
 *   spiritsaProfile: { type: "Traditionalist" },
 * });
 *
 * // дальше — как обычно, через твой multi-provider роутер (Anthropic/OpenAI/Gemini)
 */
