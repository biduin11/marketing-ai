import type { Integration } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { asArray, asRecord, readString, readInt, readDate } from "./helpers"

// Yandex.Business reviews API.
// Docs contract per spec: GET /v1/company/{accountId}/reviews
// Auth: `Authorization: OAuth <token>`
export async function syncYandexMapsReviews(integration: Integration): Promise<number> {
  if (!integration.accountId) throw new Error("Yandex: accountId не задан")
  const token = integration.accessToken ? decrypt(integration.accessToken) : null
  if (!token) throw new Error("Yandex: не удалось расшифровать токен")

  const url = `https://api.business.yandex.ru/v1/company/${encodeURIComponent(integration.accountId)}/reviews`
  const res = await fetch(url, {
    headers: { Authorization: `OAuth ${token}` },
  })
  if (!res.ok) throw new Error(`Yandex API ${res.status}`)

  const data: unknown = await res.json()
  const root = asRecord(data)
  const reviews = asArray(root?.reviews ?? data)

  let saved = 0
  for (const raw of reviews) {
    const r = asRecord(raw)
    if (!r) continue
    const externalId = readString(r.id ?? r.review_id)
    if (!externalId) continue

    const publishedAt =
      readDate(r.updatedAt ?? r.createdAt ?? r.time ?? r.published_at) ?? new Date()
    const rating = readInt(r.rating ?? r.score)
    const author = readString(r.author ?? r.userName ?? r.name)
    const text = readString(r.text ?? r.comment)
    const reply = readString(r.businessReply ?? r.reply ?? r.answer)

    await prisma.review.upsert({
      where: { integrationId_externalId: { integrationId: integration.id, externalId } },
      create: {
        integrationId: integration.id,
        externalId,
        author,
        rating: rating != null ? Math.max(1, Math.min(5, rating)) : null,
        text,
        reply,
        publishedAt,
      },
      update: {
        reply,
        rating: rating != null ? Math.max(1, Math.min(5, rating)) : null,
      },
    })
    saved++
  }
  return saved
}
