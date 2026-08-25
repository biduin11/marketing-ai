/**
 * scripts/seed-skill-chunks.ts
 *
 * Разбивает "тяжёлые" файлы скилов на чанки по markdown-заголовкам,
 * получает эмбеддинги (OpenAI text-embedding-3-small, 1536d) и пишет в skill_chunks.
 *
 * Запуск: npx tsx scripts/seed-skill-chunks.ts
 * (или добавь в package.json: "seed:skills": "tsx scripts/seed-skill-chunks.ts")
 *
 * Идемпотентно: перед вставкой чистит чанки по каждому skillSlug, так что скрипт
 * можно перезапускать при обновлении файлов скилов.
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/ai/client";

const openai = getOpenAIClient(); // тот же клиент/ключ (OPENAI_API_KEY + OPENAI_BASE_URL), что и у GPT-задач в lib/ai

const SKILLS_DIR = path.join(process.cwd(), "lib/marketing-skills");
const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_CHUNK_CHARS = 2500; // грубый лимит; при желании смени на честный токенайзер (tiktoken)

// Только "тяжёлые" скилы идут в RAG. Лёгкие грузятся целиком напрямую (см. lib/marketing-skills.ts)
const HEAVY_SKILLS = [
  "marketing-plan",
  "marketing-loops",
  "social",
  "sales-enablement",
  "ai-seo",
];

interface Chunk {
  section: string;
  content: string;
}

/**
 * Рекурсивно режет markdown по заголовкам (## затем ###), пока каждый кусок
 * не станет меньше MAX_CHUNK_CHARS. Если после ### всё ещё слишком большой —
 * режет по абзацам как fallback.
 */
function chunkMarkdown(text: string, headingLevel = 2): Chunk[] {
  const marker = "#".repeat(headingLevel) + " ";
  const lines = text.split("\n");

  const sections: { title: string; body: string[] }[] = [];
  let current = { title: "(intro)", body: [] as string[] };

  for (const line of lines) {
    if (line.startsWith(marker) && !line.startsWith(marker + "#")) {
      if (current.body.length) sections.push(current);
      current = { title: line.replace(/^#+\s*/, "").trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.length) sections.push(current);

  const chunks: Chunk[] = [];
  for (const s of sections) {
    const body = s.body.join("\n").trim();
    if (!body) continue;

    if (body.length <= MAX_CHUNK_CHARS) {
      chunks.push({ section: s.title, content: body });
      continue;
    }

    if (headingLevel < 3) {
      // пробуем разбить глубже по ###
      const deeper = chunkMarkdown(body, headingLevel + 1);
      chunks.push(...deeper.map((c) => ({ section: `${s.title} / ${c.section}`, content: c.content })));
      continue;
    }

    // последний fallback — режем по абзацам с накоплением до лимита
    const paragraphs = body.split(/\n\s*\n/);
    let buf = "";
    let part = 1;
    for (const p of paragraphs) {
      if ((buf + "\n\n" + p).length > MAX_CHUNK_CHARS && buf) {
        chunks.push({ section: `${s.title} (${part})`, content: buf.trim() });
        buf = p;
        part++;
      } else {
        buf = buf ? buf + "\n\n" + p : p;
      }
    }
    if (buf.trim()) chunks.push({ section: `${s.title} (${part})`, content: buf.trim() });
  }

  return chunks;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

async function seedSkill(slug: string) {
  const filePath = path.join(SKILLS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ${slug}.md не найден в ${SKILLS_DIR}, пропускаю`);
    return;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const chunks = chunkMarkdown(raw, 2).filter((c) => c.content.length > 30);

  console.log(`— ${slug}: ${chunks.length} чанков`);

  // чистим старые чанки этого скила перед перезаливкой
  await prisma.$executeRaw`DELETE FROM skill_chunks WHERE skill_slug = ${slug}`;

  // эмбеддим батчами по 50, чтобы не упереться в лимиты запроса
  const BATCH = 50;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const embeddings = await embedBatch(batch.map((c) => `${c.section}\n\n${c.content}`));

    for (let j = 0; j < batch.length; j++) {
      const { section, content } = batch[j];
      const vecLiteral = toVectorLiteral(embeddings[j]);
      const approxTokens = Math.round(content.length / 4);

      await prisma.$executeRawUnsafe(
        `INSERT INTO skill_chunks (skill_slug, section, content, token_count, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
        slug,
        section,
        content,
        approxTokens,
        vecLiteral
      );
    }
    console.log(`  ...${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
  }
}

async function main() {
  for (const slug of HEAVY_SKILLS) {
    await seedSkill(slug);
  }
  console.log("✅ Готово");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
