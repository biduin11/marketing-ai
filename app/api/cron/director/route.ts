import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateDirectorAnalysis } from "@/lib/services/director.service"
import { listMetrics } from "@/lib/actions/metrics"
import { directorAnalysisSchema } from "@/lib/ai/schemas/directorAnalysis"
import { createSignal } from "@/lib/actions/inbox"
import {
  computeSummary,
  computeChannelBreakdown,
  filterByRange,
} from "@/lib/services/analytics.service"

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
      const artifact = await generateDirectorAnalysis(project, metrics, { force: false })
      await createInboxSignalsFromDirector(project.id, artifact.payload, metrics)
      processed++
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push(`${project.id}: ${message}`)
    }
  }

  return NextResponse.json({ processed, errors, total: activeProjects.length })
}

async function createInboxSignalsFromDirector(
  projectId: string,
  payload: unknown,
  metrics: ReturnType<typeof listMetrics> extends Promise<infer T> ? T : never
): Promise<void> {
  const parsed = directorAnalysisSchema.safeParse(payload)
  if (!parsed.success) return

  const { problems, opportunities, risks, priorities } = parsed.data

  // Top problem → HIGH signal
  const topProblem = problems[0]
  if (topProblem) {
    await createSignal({
      projectId,
      type: "STRATEGY",
      priority: "HIGH",
      title: topProblem.title,
      body: topProblem.impact,
      action: "Открыть командный центр",
      actionHref: "/director",
    })
  }

  // High severity risks → HIGH signals
  for (const risk of risks.filter((r) => r.severity === "high").slice(0, 2)) {
    await createSignal({
      projectId,
      type: "STRATEGY",
      priority: "HIGH",
      title: `⚠️ Риск: ${risk.title}`,
      body: "AI Директор обнаружил высокоуровневый риск. Требует немедленного внимания.",
      action: "Посмотреть стратегию",
      actionHref: "/director",
    })
  }

  // Top opportunity → MEDIUM signal
  const topOpportunity = opportunities[0]
  if (topOpportunity) {
    await createSignal({
      projectId,
      type: "STRATEGY",
      priority: "MEDIUM",
      title: `Возможность: ${topOpportunity.title}`,
      body: topOpportunity.potential,
      action: "Открыть командный центр",
      actionHref: "/director",
    })
  }

  // Priority action #1 → MEDIUM signal
  const topPriority = priorities.find((p) => p.order === 1) ?? priorities[0]
  if (topPriority) {
    await createSignal({
      projectId,
      type: "STRATEGY",
      priority: "MEDIUM",
      title: `Приоритет дня: ${topPriority.action}`,
      body: topPriority.reason,
      action: "Открыть стратегию",
      actionHref: "/strategy",
    })
  }

  // Anomaly detection from metrics
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const currentMetrics = filterByRange(await metrics, monthStart, now)
  const prevMetrics = filterByRange(await metrics, prevMonthStart, prevMonthEnd)

  if (currentMetrics.length > 0 && prevMetrics.length > 0) {
    const current = computeSummary(currentMetrics)
    const prev = computeSummary(prevMetrics)

    if (prev.totalRevenue > 0) {
      const revenueDelta = ((current.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100
      if (revenueDelta < -20) {
        await createSignal({
          projectId,
          type: "ANOMALY",
          priority: "HIGH",
          title: `Выручка упала на ${Math.abs(revenueDelta).toFixed(0)}% vs прошлый месяц`,
          body: `Текущий месяц: ${current.totalRevenue.toLocaleString("ru-RU")} ₽. Прошлый месяц: ${prev.totalRevenue.toLocaleString("ru-RU")} ₽. Проверьте каналы привлечения.`,
          action: "Открыть аналитику",
          actionHref: "/analytics",
        })
      } else if (revenueDelta > 30) {
        await createSignal({
          projectId,
          type: "ANOMALY",
          priority: "MEDIUM",
          title: `Выручка выросла на ${revenueDelta.toFixed(0)}% vs прошлый месяц`,
          body: `Отличный результат! Текущий месяц: ${current.totalRevenue.toLocaleString("ru-RU")} ₽. Проанализируйте что сработало.`,
          action: "Открыть аналитику",
          actionHref: "/analytics",
        })
      }
    }

    if (prev.totalLeads > 0) {
      const leadsDelta = ((current.totalLeads - prev.totalLeads) / prev.totalLeads) * 100
      if (leadsDelta < -20) {
        await createSignal({
          projectId,
          type: "ANOMALY",
          priority: "HIGH",
          title: `Лиды упали на ${Math.abs(leadsDelta).toFixed(0)}% vs прошлый месяц`,
          body: `Текущий месяц: ${current.totalLeads} лидов. Прошлый месяц: ${prev.totalLeads} лидов. Проверьте рекламные кампании.`,
          action: "Открыть аналитику",
          actionHref: "/analytics",
        })
      }
    }

    // Top channel signal
    const channels = computeChannelBreakdown(currentMetrics).sort((a, b) => b.roi - a.roi)
    if (channels.length > 1) {
      const best = channels[0]
      const worst = channels[channels.length - 1]
      if (best.roi > 0 && worst.roi < 0) {
        await createSignal({
          projectId,
          type: "ANOMALY",
          priority: "MEDIUM",
          title: `${worst.channel} даёт отрицательный ROI`,
          body: `ROI канала ${worst.channel}: ${worst.roi.toFixed(1)}%. Рассмотрите перераспределение бюджета в ${best.channel} (ROI ${best.roi.toFixed(1)}%).`,
          action: "Открыть аналитику",
          actionHref: "/analytics",
        })
      }
    }
  }
}
