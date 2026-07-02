import type { Integration } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { asRecord, readInt, startOfDay } from "./helpers"

// Telegram channel stats via Bot API.
// Contract per spec: getChatMembersCount for followers; getUpdates could be
// used to count recent posts (bots only see updates they receive, so posts is
// best-effort and defaults to 0 when unavailable).
export async function syncTelegramStats(integration: Integration): Promise<number> {
  if (!integration.accountId) throw new Error("Telegram: username канала не задан")
  const token = integration.accessToken ? decrypt(integration.accessToken) : null
  if (!token) throw new Error("Telegram: не удалось расшифровать токен")

  const channel = integration.accountId.replace(/^@/, "")
  const base = `https://api.telegram.org/bot${token}`

  const res = await fetch(
    `${base}/getChatMembersCount?chat_id=@${encodeURIComponent(channel)}`
  )
  if (!res.ok) throw new Error(`Telegram API ${res.status}`)

  const data: unknown = await res.json()
  const root = asRecord(data)
  if (root?.ok !== true) {
    throw new Error(`Telegram API: ${root?.description ?? "запрос отклонён"}`)
  }

  const followers = readInt(root.result) ?? 0
  const day = startOfDay()

  await prisma.socialStat.upsert({
    where: { integrationId_date: { integrationId: integration.id, date: day } },
    create: {
      integrationId: integration.id,
      date: day,
      followers,
    },
    update: { followers },
  })
  return 1
}
