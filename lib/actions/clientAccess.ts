"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { companyAnalysisSchema } from "@/lib/ai/schemas/companyAnalysis"
import { strategySchema } from "@/lib/ai/schemas/strategy"

export type ClientAccessItem = {
  id: string
  token: string
  clientName: string | null
  clientEmail: string | null
  isActive: boolean
  expiresAt: string | null
  lastVisitAt: string | null
  createdAt: string
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function toItem(a: {
  id: string
  token: string
  clientName: string | null
  clientEmail: string | null
  isActive: boolean
  expiresAt: Date | null
  lastVisitAt: Date | null
  createdAt: Date
}): ClientAccessItem {
  return {
    id: a.id,
    token: a.token,
    clientName: a.clientName,
    clientEmail: a.clientEmail,
    isActive: a.isActive,
    expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    lastVisitAt: a.lastVisitAt ? a.lastVisitAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }
}

async function ownedProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
}

export async function getClientAccesses(projectId: string): Promise<ClientAccessItem[]> {
  const project = await ownedProject(projectId)
  if (!project) return []

  const accesses = await prisma.clientAccess.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
  return accesses.map(toItem)
}

const createSchema = z.object({
  projectId: z.string().min(1),
  clientName: z.string().max(120).optional(),
  clientEmail: z.string().email().max(200).optional().or(z.literal("")),
  expiresInDays: z.union([z.literal(7), z.literal(30), z.literal(90)]).nullable().optional(),
})

export async function createClientAccess(
  input: z.infer<typeof createSchema>
): Promise<ActionResult<ClientAccessItem>> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const project = await ownedProject(parsed.data.projectId)
  if (!project) return { success: false, error: "Проект не найден" }

  const { clientName, clientEmail, expiresInDays } = parsed.data
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const access = await prisma.clientAccess.create({
    data: {
      projectId: project.id,
      clientName: clientName?.trim() || null,
      clientEmail: clientEmail?.trim() || null,
      expiresAt,
    },
  })

  revalidatePath("/settings")
  return { success: true, data: toItem(access) }
}

export async function revokeClientAccess(id: string): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Не авторизован" }

  const access = await prisma.clientAccess.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!access) return { success: false, error: "Доступ не найден" }

  await prisma.clientAccess.update({
    where: { id },
    data: { isActive: false },
  })

  revalidatePath("/settings")
  return { success: true, data: null }
}

export type ClientDashboardData = {
  project: {
    name: string
    niche: string | null
  }
  updatedAt: string
  companyAnalysis: {
    score: number
    level: string
    summary: string
  } | null
  strategy: {
    horizon: number
    kpi: { name: string; target: string }[]
  } | null
  metrics: {
    roi: number | null
    cac: number | null
    leads: number | null
    revenue: number | null
  } | null
  recommendations: { title: string; body: string }[]
}

/** Public lookup — no auth. Validates token liveness and records the visit. */
export async function getProjectByToken(token: string): Promise<ClientDashboardData | null> {
  const access = await prisma.clientAccess.findUnique({
    where: { token },
    include: { project: true },
  })
  if (!access || !access.isActive) return null
  if (access.expiresAt && access.expiresAt < new Date()) return null

  await prisma.clientAccess.update({
    where: { id: access.id },
    data: { lastVisitAt: new Date() },
  })

  const { project } = access

  const [companyArtifact, strategyArtifact, monthMetrics] = await Promise.all([
    prisma.aiArtifact.findFirst({
      where: { projectId: project.id, type: "COMPANY_ANALYSIS" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.aiArtifact.findFirst({
      where: {
        projectId: project.id,
        type: { in: ["STRATEGY_30", "STRATEGY_90", "STRATEGY_180", "STRATEGY_365"] },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.metric.findMany({
      where: {
        projectId: project.id,
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ])

  let companyAnalysis: ClientDashboardData["companyAnalysis"] = null
  let recommendations: ClientDashboardData["recommendations"] = []
  if (companyArtifact) {
    const parsed = companyAnalysisSchema.safeParse(companyArtifact.payload)
    if (parsed.success) {
      companyAnalysis = {
        score: parsed.data.score,
        level: parsed.data.level,
        summary: parsed.data.summary,
      }
      recommendations = parsed.data.recommendations
        .slice(0, 3)
        .map((r) => ({ title: r.title, body: r.body }))
    }
  }

  let strategy: ClientDashboardData["strategy"] = null
  if (strategyArtifact) {
    const parsed = strategySchema.safeParse(strategyArtifact.payload)
    if (parsed.success) {
      strategy = { horizon: parsed.data.horizon, kpi: parsed.data.kpi }
    }
  }

  let metrics: ClientDashboardData["metrics"] = null
  if (monthMetrics.length > 0) {
    const spend = monthMetrics.reduce((sum, m) => sum + m.spend, 0)
    const revenue = monthMetrics.reduce((sum, m) => sum + m.revenue, 0)
    const leads = monthMetrics.reduce((sum, m) => sum + m.leads, 0)
    metrics = {
      roi: spend > 0 ? Math.round(((revenue - spend) / spend) * 100) : null,
      cac: leads > 0 ? Math.round(spend / leads) : null,
      leads,
      revenue: Math.round(revenue),
    }
  }

  const updatedAt = [companyArtifact?.createdAt, strategyArtifact?.createdAt, project.updatedAt]
    .filter((d): d is Date => d != null)
    .sort((a, b) => b.getTime() - a.getTime())[0]

  return {
    project: { name: project.name, niche: project.niche },
    updatedAt: updatedAt.toISOString(),
    companyAnalysis,
    strategy,
    metrics,
    recommendations,
  }
}
