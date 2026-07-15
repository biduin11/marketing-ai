import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSprint } from "@/lib/services/sprint.service"
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

  const activeProjects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
  })

  let processed = 0
  const errors: string[] = []

  for (const project of activeProjects) {
    try {
      await generateSprint(project)
      processed++
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push(`${project.id}: ${message}`)
    }
  }

  return NextResponse.json({ processed, errors, total: activeProjects.length })
}
