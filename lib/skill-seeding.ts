/**
 * lib/skill-seeding.ts
 *
 * Общая логика: режет .md-файл на чанки, эмбеддит, пишет в skill_chunks.
 * Вызывается либо из scripts/seed-skill-chunks.ts (локально, если env есть),
 * либо из app/api/admin/seed-skills/route.ts (на Vercel, где env уже подставлен).
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/ai/client";

const SKILLS_DIR = path.join(process.cwd(), "lib/marketing-skills");
const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_CHUNK_CHARS = 2500;

export const HEAVY_SKILLS = [
  "marketing-plan",
  "marketing-loops",
  "social",
  "ad-creative",
  "sales-enablement",
  "ai-seo",
];

interface Chunk {
  section: string;
  content: string;
}

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
      const deeper = chunkMarkdown(body, headingLevel + 1);
      chunks.push(...deeper.map((c) => ({ section: `${s.title} / ${c.section}`, content: c.content })));
      continue;
    }
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
  const res = await getOpenAIClient().embeddings.create({ model: EMBEDDING_MODEL, input: texts });
  return res.data.map((d) => d.embedding);
}

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/** Заливает один скил. Возвращает количество загруженных чанков. */
export async function seedSkill(slug: string): Promise<number> {
  const filePath = path.join(SKILLS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Файл не найден: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const chunks = chunkMarkdown(raw, 2).filter((c) => c.content.length > 30);

  await prisma.$executeRaw`DELETE FROM skill_chunks WHERE skill_slug = ${slug}`;

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
  }

  return chunks.length;
}
