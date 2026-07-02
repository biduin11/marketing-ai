import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncAllIntegrations } from "@/lib/services/sync.service"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Distinct projects that have at least one active integration
  const active = await prisma.integration.findMany({
    where: { isActive: true },
    select: { projectId: true },
    distinct: ["projectId"],
  })

  let processed = 0
  const errors: string[] = []

  for (const { projectId } of active) {
    try {
      const result = await syncAllIntegrations(projectId)
      processed++
      for (const e of result.errors) {
        errors.push(`${projectId}/${e.platform}: ${e.error}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push(`${projectId}: ${message}`)
    }
  }

  return NextResponse.json({ processed, total: active.length, errors })
}
