import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncYandexMetrika } from "@/lib/services/yandex-metrika.service"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const integrations = await prisma.yandexMetrikaIntegration.findMany({
    where: { isActive: true },
  })

  let processed = 0
  const errors: string[] = []

  for (const integration of integrations) {
    try {
      await syncYandexMetrika(integration)
      processed++
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push(`${integration.projectId}: ${message}`)
      await prisma.yandexMetrikaIntegration.update({
        where: { id: integration.id },
        data: { syncError: message },
      })
    }
  }

  return NextResponse.json({ processed, errors, total: integrations.length })
}
