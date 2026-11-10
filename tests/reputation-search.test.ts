import { afterEach, expect, it, vi } from "vitest"
import { collectReputationEvidence } from "../lib/services/reputation-search"

afterEach(() => vi.unstubAllGlobals())

it("reads the review tabs of configured and discovered cards, retaining search snippets", async () => {
  const yandex = "https://yandex.ru/maps/org/fin_krovlya/69564833063/reviews/"
  const twogis = "https://2gis.ru/makhachkala/firm/70000001023922783/tab/reviews"
  const fetch = vi.fn<typeof globalThis.fetch>(async (url, options) => {
    if (String(url).endsWith("/extract")) {
      expect(JSON.parse(String(options?.body)).urls).toEqual([yandex, twogis])
      return Response.json({ results: [{ url: yandex, raw_content: "Отзыв с карточки" }] })
    }
    return Response.json({ results: [{
      title: "ФинКровля — 2ГИС",
      url: "https://2gis.ru/makhachkala/firm/70000001023922783",
      content: "Результат поиска",
      score: 1,
    }] })
  })
  vi.stubGlobal("fetch", fetch)

  const evidence = await collectReputationEvidence("Фин Кровля", "Махачкала", [
    "https://yandex.ru/maps/org/fin_krovlya/69564833063/?ll=123",
    "https://2gis.ru.example.com/makhachkala/firm/123",
  ])
  expect(evidence.extracted).toEqual([{ url: yandex, text: "Отзыв с карточки" }])
  expect(evidence.snippets).toContainEqual({
    text: "Результат поиска",
    url: "https://2gis.ru/makhachkala/firm/70000001023922783",
  })
})

it("falls back to search snippets when a review page cannot be extracted", async () => {
  const url = "https://2gis.ru/makhachkala/firm/70000001023922783/tab/reviews"
  vi.stubGlobal("fetch", vi.fn<typeof globalThis.fetch>(async (endpoint) => {
    if (String(endpoint).endsWith("/extract")) return new Response(null, { status: 504 })
    return Response.json({ results: [{ url, title: "Фин Кровля", content: "Отзыв из поиска", score: 1 }] })
  }))

  const evidence = await collectReputationEvidence("Фин Кровля", "Махачкала", [])
  expect(evidence.extracted).toEqual([])
  expect(evidence.snippets).toContainEqual({ url, text: "Отзыв из поиска" })
})
