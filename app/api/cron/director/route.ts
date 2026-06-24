import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateDirectorAnalysis } from "@/lib/services/director.service"
import { listMetrics } from "@/lib/actions/metrics"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const activeProjects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
  })

  let processed = 0
  const errors: string[] = []

  for (const project of activeProjects) {
    try {
      const metrics = await listMetrics(project.id)
      await generateDirectorAnalysis(project, metrics, { force: false })
      processed++
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push(`${project.id}: ${message}`)
    }
  }

  return NextResponse.json({ processed, errors, total: activeProjects.length })
}
