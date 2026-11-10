const TAVILY_API = "https://api.tavily.com/search"
const SEARCH_TIMEOUT_MS = 20_000

interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

interface TavilyResponse {
  results?: TavilySearchResult[]
}

export async function tavilySearch(query: string): Promise<TavilySearchResult[]> {
  const response = await fetch(TAVILY_API, {
    method: "POST",
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Tavily API error: ${error}`)
  }

  const data = (await response.json()) as TavilyResponse
  return data.results ?? []
}

/** Runs several Tavily searches in parallel; a failed query resolves to an empty
 * result set instead of failing the whole batch (see Promise.allSettled below). */
export async function tavilyMultiSearch(
  queries: string[]
): Promise<Record<string, TavilySearchResult[]>> {
  const results = await Promise.allSettled(queries.map((q) => tavilySearch(q)))

  const output: Record<string, TavilySearchResult[]> = {}
  queries.forEach((q, i) => {
    const result = results[i]
    output[q] = result?.status === "fulfilled" ? result.value : []
  })

  return output
}

export async function tavilyExtractReviewPages(urls: string[]): Promise<{ url: string; raw_content: string }[]> {
  if (urls.length === 0) return []

  const response = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      urls,
      query: "Отзывы покупателей о компании, оценки, жалобы, недостатки и текст отзывов",
      chunks_per_source: 5,
      extract_depth: "advanced",
      format: "text",
    }),
  })
  if (!response.ok) throw new Error(`Tavily Extract returned HTTP ${response.status}`)

  const data = (await response.json()) as { results?: { url: string; raw_content: string }[] }
  return data.results ?? []
}

export function formatSearchResultsForPrompt(
  searchResults: Record<string, TavilySearchResult[]>
): string {
  const sections = Object.entries(searchResults).map(([query, results]) => {
    if (results.length === 0) {
      return `ЗАПРОС: "${query}"\nРезультатов не найдено.`
    }
    const items = results
      .map((r, i) => `${i + 1}. ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 500)}`)
      .join("\n\n")
    return `ЗАПРОС: "${query}"\n\n${items}`
  })

  return sections.join("\n\n---\n\n")
}
