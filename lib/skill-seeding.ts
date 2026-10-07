/**
 * lib/skill-seeding.ts
 *
 * Проверяет чанки из .md; в режиме vector эмбеддит и пишет в skill_chunks.
 * Вызывается либо из scripts/seed-skill-chunks.ts (локально, если env есть),
 * либо из app/api/admin/seed-skills/route.ts (на Vercel, где env уже подставлен).
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { embedTexts } from "@/lib/ai/embeddings";
import { chunkMarkdown, isVectorRetrievalEnabled } from "./skill-chunks";
export { HEAVY_SKILLS } from "./skill-chunks";

const SKILLS_DIR = path.join(process.cwd(), "lib/marketing-skills");
async function embedBatch(texts: string[]): Promise<number[][]> {
  return embedTexts(texts);
}

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/** Возвращает число доступных чанков; сохраняет их в БД только в режиме vector. */
export async function seedSkill(slug: string): Promise<number> {
  const filePath = path.join(SKILLS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Файл не найден: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const chunks = chunkMarkdown(raw, 2).filter((c) => c.content.length > 30);

  // File retrieval needs no API calls or database seeding.
  if (!isVectorRetrievalEnabled()) return chunks.length;

  const allEmbeddings: number[][] = [];
  const BATCH = 50;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    allEmbeddings.push(...await embedBatch(batch.map((c) => `${c.section}\n\n${c.content}`)));
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM skill_chunks WHERE skill_slug = ${slug}`;
    for (let j = 0; j < chunks.length; j++) {
      const { section, content } = chunks[j];
      const vecLiteral = toVectorLiteral(allEmbeddings[j]);
      const approxTokens = Math.round(content.length / 4);
      await tx.$executeRawUnsafe(
        `INSERT INTO skill_chunks (skill_slug, section, content, token_count, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
        slug,
        section,
        content,
        approxTokens,
        vecLiteral
      );
    }
  }, { timeout: 30000 });

  return chunks.length;
}
