import type { Integration } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { asArray, asRecord, readInt, startOfDay } from "./helpers"

// Avito stats via OAuth2 client-credentials.
// Contract per spec:
//   POST https://api.avito.ru/token  → access_token
//   GET  https://api.avito.ru/stats/v1/accounts/{account_id}/items
// Here accountId = Avito Client ID, accessToken = Client Secret.
export async function syncAvitoStats(integration: Integration): Promise<number> {
  if (!integration.accountId) throw new Error("Avito: Client ID не задан")
  const clientSecret = integration.accessToken ? decrypt(integration.accessToken) : null
  if (!clientSecret) throw new Error("Avito: не удалось расшифровать Client Secret")

  // 1. Obtain OAuth2 token
  const tokenRes = await fetch("https://api.avito.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: integration.accountId,
      client_secret: clientSecret,
    }),
  })
  if (!tokenRes.ok) throw new Error(`Avito token ${tokenRes.status}`)
  const tokenData = asRecord(await tokenRes.json())
  const accessToken =
    typeof tokenData?.access_token === "string" ? tokenData.access_token : null
  if (!accessToken) throw new Error("Avito: не получен access_token")

  // 2. Fetch item stats
  const statsRes = await fetch(
    `https://api.avito.ru/stats/v1/accounts/${encodeURIComponent(integration.accountId)}/items`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!statsRes.ok) throw new Error(`Avito stats ${statsRes.status}`)

  const data: unknown = await statsRes.json()
  const root = asRecord(data)
  const items = asArray(root?.items ?? root?.result ?? data)

  // Aggregate all items into one daily snapshot
  let views = 0
  let clicks = 0
  let engagement = 0
  for (const raw of items) {
    const it = asRecord(raw)
    if (!it) continue
    views += readInt(it.views ?? it.uniqViews) ?? 0
    clicks += readInt(it.contacts ?? it.calls) ?? 0
    engagement += readInt(it.favorites ?? it.messages) ?? 0
  }

  const day = startOfDay()
  await prisma.socialStat.upsert({
    where: { integrationId_date: { integrationId: integration.id, date: day } },
    create: {
      integrationId: integration.id,
      date: day,
      views,
      clicks,
      engagement,
    },
    update: { views, clicks, engagement },
  })
  return items.length
}
