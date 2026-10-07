export interface SkillChunk {
  skillSlug: string;
  section: string;
  content: string;
}

function terms(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []);
}

/** Heading matches have extra weight; ties preserve the source order. */
export function rankSkillChunks(query: string, chunks: SkillChunk[], topK: number) {
  const queryTerms = terms(query);
  return chunks.map((chunk) => {
    const heading = terms(chunk.section);
    const body = terms(chunk.content);
    let score = 0;
    for (const term of queryTerms) {
      if (heading.has(term)) score += 3;
      if (body.has(term)) score += 1;
    }
    return { ...chunk, similarity: queryTerms.size ? score / (4 * queryTerms.size) : 0 };
  }).sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.max(0, Math.floor(topK)));
}
