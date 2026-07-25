const TAVILY_API = "https://api.tavily.com/search"

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
