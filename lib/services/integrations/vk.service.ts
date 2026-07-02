import type { Integration } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { asArray, asRecord, readInt, startOfDay } from "./helpers"

// VK community stats API.
// Contract per spec: GET /method/stats.get?group_id=&access_token=&v=5.131
export async function syncVkStats(integration: Integration): Promise<number> {
  if (!integration.accountId) throw new Error("VK: ID сообщества не задан")
  const token = integration.accessToken ? decrypt(integration.accessToken) : null
  if (!token) throw new Error("VK: не удалось расшифровать токен")

  const groupId = integration.accountId.replace(/^-/, "")
  const url =
    `https://api.vk.com/method/stats.get` +
    `?group_id=${encodeURIComponent(groupId)}` +
    `&access_token=${encodeURIComponent(token)}` +
    `&v=5.131`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`VK API ${res.status}`)

  const data: unknown = await res.json()
  const root = asRecord(data)
  const apiError = asRecord(root?.error)
  if (apiError) {
    throw new Error(`VK API error: ${apiError.error_msg ?? "unknown"}`)
  }

  const periods = asArray(root?.response)
  let saved = 0
  for (const raw of periods) {
    const p = asRecord(raw)
    if (!p) continue

    // VK period covers a day; use its start day as the key
    const day = startOfDay()
    const reachRec = asRecord(p.reach)
    const activityRec = asRecord(p.activity)

    const reach = readInt(reachRec?.reach ?? p.reach) ?? 0
    const followers = readInt(reachRec?.reach_subscribers ?? p.subscribers) ?? 0
    const engagement =
      (readInt(activityRec?.likes) ?? 0) +
      (readInt(activityRec?.comments) ?? 0) +
      (readInt(activityRec?.copies) ?? 0)
    const views = readInt(p.views) ?? 0

    await prisma.socialStat.upsert({
      where: { integrationId_date: { integrationId: integration.id, date: day } },
      create: {
        integrationId: integration.id,
        date: day,
        followers,
        reach,
        engagement,
        views,
      },
      update: { followers, reach, engagement, views },
    })
    saved++
  }
  return saved
}
