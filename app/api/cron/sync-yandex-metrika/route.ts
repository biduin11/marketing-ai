import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncYandexMetrika } from "@/lib/services/yandex-metrika.service"
import { authorizeCronRequest } from "@/lib/security/cron-auth"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(request: Request): Promise<NextResponse> {
  const authorization = authorizeCronRequest(
    request.headers.get("Authorization"),
    process.env.CRON_SECRET
  )
  if (!authorization.authorized) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status }
    )
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
