import type { Integration } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { asArray, asRecord, readString, readInt, readDate } from "./helpers"

// 2GIS reviews API.
// Contract per spec: GET /2.0/branches/{accountId}/reviews
// Auth: `X-2GIS-API-Key: <token>`
export async function syncTwoGisReviews(integration: Integration): Promise<number> {
  if (!integration.accountId) throw new Error("2GIS: accountId не задан")
  const token = integration.accessToken ? decrypt(integration.accessToken) : null
  if (!token) throw new Error("2GIS: не удалось расшифровать ключ")

  const url = `https://api.reviews.2gis.com/2.0/branches/${encodeURIComponent(integration.accountId)}/reviews`
  const res = await fetch(url, {
    headers: { "X-2GIS-API-Key": token },
  })
  if (!res.ok) throw new Error(`2GIS API ${res.status}`)

  const data: unknown = await res.json()
  const root = asRecord(data)
  const reviews = asArray(root?.reviews ?? root?.items ?? data)

  let saved = 0
  for (const raw of reviews) {
    const r = asRecord(raw)
    if (!r) continue
    const externalId = readString(r.id ?? r.review_id)
    if (!externalId) continue

    const user = asRecord(r.user)
    const publishedAt =
      readDate(r.date_created ?? r.created_at ?? r.date) ?? new Date()
    const rating = readInt(r.rating ?? r.stars)
    const author = readString(r.user_name ?? user?.name ?? r.author)
    const text = readString(r.text ?? r.comment)
    const official = asRecord(r.official_answer)
    const reply = readString(official?.text ?? r.reply)

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
