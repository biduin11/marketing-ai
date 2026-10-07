import OpenAI from "openai"

const DIMENSIONS = 1536

/** One configuration for both skill indexing and retrieval. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("EMBEDDING_API_KEY or OPENAI_API_KEY is not set")

  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small"
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.EMBEDDING_BASE_URL || process.env.OPENAI_BASE_URL || undefined,
  })

  let response
  try {
    response = await client.embeddings.create({ model, input: texts })
  } catch (error) {
    if (error instanceof OpenAI.APIError && error.status === 404) {
      throw new Error(
        `Модель эмбеддингов ${model} недоступна у выбранного провайдера. ` +
        "Проверьте GET /v1/models и задайте EMBEDDING_MODEL, EMBEDDING_BASE_URL и EMBEDDING_API_KEY. " +
        "При смене модели заново загрузите все skills.",
        { cause: error },
      )
    }
    throw error
  }

  const data = [...response.data].sort((a, b) => a.index - b.index)
  if (data.length !== texts.length || data.some((item, index) =>
    item.index !== index || item.embedding.length !== DIMENSIONS ||
    item.embedding.some((value) => !Number.isFinite(value)),
  )) {
    throw new Error("Провайдер должен вернуть по одному вектору из 1536 чисел для каждого текста (skill_chunks: vector(1536)).")
  }
  return data.map((item) => item.embedding)
}
