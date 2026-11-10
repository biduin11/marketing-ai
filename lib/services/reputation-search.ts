import { tavilyExtractReviewPages, tavilyMultiSearch } from "./tavily.service"

function reviewPageUrl(value: string): string | null {
  if (!URL.canParse(value)) return null
  const url = new URL(value)
  if (url.protocol !== "https:" || url.port || url.username || url.password) return null

  const yandex = ["yandex.ru", "yandex.com"].includes(url.hostname)
    && url.pathname.match(/^\/maps\/(?:\d+\/[^/]+\/)?org\/([^/]+)\/(\d+)(?:\/|$)/)
  if (yandex) return `https://${url.hostname}/maps/org/${yandex[1]}/${yandex[2]}/reviews/`

  const twogis = url.hostname === "2gis.ru" && url.pathname.match(/^\/([a-z\d-]+)\/firm\/(\d+)(?:\/|$)/i)
  return twogis ? `https://2gis.ru/${twogis[1]}/firm/${twogis[2]}/tab/reviews` : null
}

export async function collectReputationEvidence(name: string, city: string, configuredLinks: string[]) {
  const queries = [
    `${name} ${city} отзывы`,
    `${name} ${city} отзывы Яндекс Карты`,
    `${name} ${city} отзывы 2ГИС`,
    `${name.replace(/\s+/g, "")} отзывы клиентов`,
    ...configuredLinks,
  ]
  const searchResults = await tavilyMultiSearch([...new Set(queries)])
  const results = Object.values(searchResults).flat()
  const compact = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")
  const companyName = compact(name)
  const matchingLinks = results
    .filter(({ title, content }) => companyName && compact(`${title} ${content}`).includes(companyName))
    .map(({ url }) => url)
  const reviewUrls = [...new Set([...configuredLinks, ...matchingLinks].map(reviewPageUrl))]
    .filter((url) => url !== null)
    .slice(0, 4)

  const pages = await tavilyExtractReviewPages(reviewUrls).catch(() => [])
  const extracted = pages.flatMap(({ url, raw_content }) => {
    const canonicalUrl = reviewPageUrl(url)
    const text = raw_content.trim().slice(0, 6_000)
    return canonicalUrl && reviewUrls.includes(canonicalUrl) && text ? [{ url: canonicalUrl, text }] : []
  })
  const snippets = results.map(({ content, url }) => ({ text: content.slice(0, 500), url }))
  return { searchResults, snippets, extracted }
}
