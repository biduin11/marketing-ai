const MAX_CHUNK_CHARS = 2500;

export function isVectorRetrievalEnabled(): boolean {
  const mode = process.env.SKILL_RETRIEVAL_MODE || "lexical";
  if (mode !== "lexical" && mode !== "vector") {
    throw new Error("SKILL_RETRIEVAL_MODE must be lexical or vector");
  }
  return mode === "vector";
}

export const HEAVY_SKILLS = [
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

export function chunkMarkdown(text: string, headingLevel = 2): Chunk[] {
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
    const paragraphs = body.split(/\n\s*\n/).flatMap((paragraph) => {
      const pieces: string[] = [];
      for (let i = 0; i < paragraph.length; i += MAX_CHUNK_CHARS) {
        pieces.push(paragraph.slice(i, i + MAX_CHUNK_CHARS));
      }
      return pieces;
    });
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
