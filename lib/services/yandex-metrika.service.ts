import type { YandexMetrikaIntegration } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decryptToken } from "@/lib/security/token-crypto"

const METRIKA_API = "https://api-metrika.yandex.net/stat/v1/data"

interface MetrikaParams {
  counterId: string
  accessToken: string
  date1: string
  date2: string
}

interface MetrikaApiResponse {
  data: Array<{
    dimensions: Array<{ name: string }>
    metrics: number[]
  }>
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function callMetrikaApi(params: MetrikaParams): Promise<MetrikaApiResponse> {
  const url = new URL(METRIKA_API)
  url.searchParams.set("id", params.counterId)
  url.searchParams.set("date1", params.date1)
  url.searchParams.set("date2", params.date2)
  url.searchParams.set("dimensions", "ym:s:lastTrafficSource")
  url.searchParams.set(
    "metrics",
    "ym:s:visits,ym:s:users,ym:s:sumGoalReachesAny,ym:s:bounceRate"
  )
  url.searchParams.set("lang", "ru")
  url.searchParams.set("limit", "20")

  const res = await fetch(url.toString(), {
    headers: { Authorization: `OAuth ${params.accessToken}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Ошибка API Метрики (${res.status}): ${body}`)
  }
  return res.json() as Promise<MetrikaApiResponse>
}

const SOURCE_LABELS: Record<string, string> = {
  organic: "SEO / Органика",
  direct: "Прямые заходы",
  referral: "Реферальный трафик",
  ad: "Яндекс Директ",
  social: "Социальные сети",
  email: "Email-рассылка",
  messenger: "Мессенджеры",
  internal: "Внутренний переход",
}

function mapTrafficSource(source: string): string {
  return SOURCE_LABELS[source] ?? source
}

/** Test connection with a real request — used before saving an integration. */
export async function testMetrikaConnection(
  counterId: string,
  accessToken: string
): Promise<void> {
  await callMetrikaApi({
    counterId,
    accessToken,
    date1: isoDate(daysAgo(1)),
    date2: isoDate(new Date()),
  })
}

/**
 * Syncs the last 30 days of traffic-source data into `Metric`.
 * Only clicks/impressions/leads are written — spend/revenue are never
 * touched here since Metrika doesn't know them and the user may have
 * entered those manually.
 */
export async function syncYandexMetrika(
  integration: YandexMetrikaIntegration
): Promise<{ synced: number }> {
  const accessToken = decryptToken(integration.accessToken)
  const today = isoDate(new Date())

  const sourceData = await callMetrikaApi({
    counterId: integration.counterId,
    accessToken,
    date1: isoDate(daysAgo(30)),
    date2: today,
  })

  const date = new Date(today)
  let synced = 0

  for (const row of sourceData.data) {
    const source = row.dimensions[0]?.name ?? "unknown"
    const channel = mapTrafficSource(source)
    const [visits, users, goals] = row.metrics

    await prisma.metric.upsert({
      where: {
        projectId_channel_date: {
          projectId: integration.projectId,
          channel,
          date,
        },
      },
      create: {
        projectId: integration.projectId,
        channel,
        date,
        clicks: Math.round(visits ?? 0),
        impressions: Math.round(users ?? 0),
        leads: Math.round(goals ?? 0),
      },
      update: {
        clicks: Math.round(visits ?? 0),
        impressions: Math.round(users ?? 0),
        leads: Math.round(goals ?? 0),
      },
    })
    synced++
  }

  await prisma.yandexMetrikaIntegration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date(), syncError: null },
  })

  return { synced }
}
