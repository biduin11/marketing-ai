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
  "ad-creative",
]);

const HEAVY_SKILLS = new Set([
  "marketing-plan",
  "marketing-loops",
  "social",
  "sales-enablement",
  "ai-seo",
]);

// Какие скилы нужны какой фиче/агенту в приложении.
// Подгони под реальные фичи AI Marketing OS.
export const FEATURE_SKILLS: Record<string, string[]> = {
  // уже подключено — для справки, ничего не трогать
  "content-plan": ["content-strategy", "social"],   // + social, см. шаг про Content Factory ниже
  "cjm": ["customer-journey-map"],
  "offers": ["brand-positioning-toolkit"],           // подтверждено — ad-creative для offers не используется

  // новое — подключить в этом заходе
  "audience": ["customer-research"],
  "competitors": ["competitor-profiling"],
  "express-audit": ["seo-audit", "ai-seo", "marketing-ideas"],
  "briefs": ["sales-enablement"],
  "sprint-planner": ["marketing-loops", "marketing-ideas"],
  "company-intelligence": ["brand-positioning-toolkit"],

  // на паузе / без дома — не трогать в этом заходе
  // "strategy": ["marketing-plan"],  — сам решил отложить
  // brand-marketing-check — нет генерирующей фичи, это валидатор, см. отдельный пункт ниже
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

  const result = parts.join("\n\n---\n\n");

  console.info(
    `[Skills] feature=${featureId} skills=[${skillSlugs.join(", ")}] chars=${result.length}`
  );

  return result;
}

/**
 * Пример использования в API-роуте:
 *
 * const systemPrompt = await buildSystemPrompt({
 *   featureId: "offers",
 *   userQuery: "Заголовки для рекламы монтажа мембранной кровли, ЦА — застройщики",
 *   spiritsaProfile: { type: "Traditionalist" },
 * });
 *
 * // дальше — как обычно, через твой multi-provider роутер (Anthropic/OpenAI/Gemini)
 */
