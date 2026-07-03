import { auth } from "@/auth"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { listMetrics } from "@/lib/actions/metrics"
import { prisma } from "@/lib/prisma"
import { getLatestArtifact } from "@/lib/services/artifacts"
import {
  computeSummary,
  computeChannelBreakdown,
  filterByRange,
  computeDelta,
} from "@/lib/services/analytics.service"
import { directorAnalysisSchema } from "@/lib/ai/schemas/directorAnalysis"
import { strategySchema } from "@/lib/ai/schemas/strategy"
import { contentPlanSchema } from "@/lib/ai/schemas/contentPlan"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { ArtifactType } from "@prisma/client"
import type { OnboardingStep } from "@/components/dashboard/onboarding-progress"

export default async function HomePage() {
  const session = await auth()
  const userId = session?.user?.id ?? ""

  const [projectId, projects] = await Promise.all([
    getActiveProjectId(),
    userId
      ? prisma.project.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, niche: true, status: true, updatedAt: true },
        })
      : [],
  ])

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <OnboardingWizard />
      </div>
    )
  }

  const serializedProjects = projects.map((p) => ({
    ...p,
    status: p.status as string,
    updatedAt: p.updatedAt.toISOString(),
  }))

  if (!projectId) {
    return (
      <DashboardView
        projectId={null}
        projectName={null}
        projects={serializedProjects}
        analysis={null}
        summary={null}
        prevSummary={null}
        channels={[]}
        tasks={[]}
        reports={[]}
        strategyKpis={[]}
        todayContent={[]}
        hasContentPlan={false}
        contentPlanUpdatedAt={null}
      />
    )
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const [project, metrics, directorArtifact, tasks, reports, strategyArtifact, contentArtifact, companyArtifact, audienceArtifact, offerArtifact] =
    await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      listMetrics(projectId),
      getLatestArtifact(projectId, "DIRECTOR_DAILY"),
      prisma.strategyTask.findMany({
        where: { projectId, done: false },
        take: 5,
        orderBy: { updatedAt: "asc" },
      }),
      prisma.aiArtifact.findMany({
        where: {
          projectId,
          type: {
            in: [
              ArtifactType.REPORT_WEEKLY,
              ArtifactType.REPORT_MONTHLY,
              ArtifactType.REPORT_QUARTERLY,
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, type: true, createdAt: true },
      }),
      getLatestArtifact(projectId, "STRATEGY_30"),
      getLatestArtifact(projectId, "CONTENT_PLAN"),
      getLatestArtifact(projectId, "COMPANY_ANALYSIS"),
      getLatestArtifact(projectId, "AUDIENCE_SEGMENTS"),
      getLatestArtifact(projectId, "OFFER"),
    ])

  if (!project) {
    return (
      <DashboardView
        projectId={projectId}
        projectName={null}
        projects={serializedProjects}
        analysis={null}
        summary={null}
        prevSummary={null}
        channels={[]}
        tasks={[]}
        reports={[]}
        strategyKpis={[]}
        todayContent={[]}
        hasContentPlan={false}
        contentPlanUpdatedAt={null}
      />
    )
  }

  const monthlyMetrics = filterByRange(metrics, monthStart, now)
  const prevMetrics = filterByRange(metrics, prevMonthStart, prevMonthEnd)
  const summary = monthlyMetrics.length > 0 ? computeSummary(monthlyMetrics) : null
  const prevSummary = prevMetrics.length > 0 ? computeSummary(prevMetrics) : null
  const channels =
    monthlyMetrics.length > 0
      ? computeChannelBreakdown(monthlyMetrics).sort((a, b) => b.roi - a.roi)
      : []

  const parseResult = directorArtifact
    ? directorAnalysisSchema.safeParse(directorArtifact.payload)
    : null
  const analysis = parseResult?.success ? parseResult.data : null

  // Strategy KPIs from STRATEGY_30
  const strategyParsed = strategyArtifact
    ? strategySchema.safeParse(strategyArtifact.payload)
    : null
  const strategyKpis = strategyParsed?.success ? strategyParsed.data.kpi : []

  // Today's content items: match by day of month
  const todayDay = now.getDate()
  const contentParsed = contentArtifact
    ? contentPlanSchema.safeParse(contentArtifact.payload)
    : null
  const todayContent =
    contentParsed?.success
      ? contentParsed.data.calendar.filter((item) => item.day === todayDay)
      : []

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "company",
      label: "Анализ компании",
      description: "Опишите продукт, позиционирование и точки роста",
      href: "/company",
      done: !!companyArtifact,
    },
    {
      id: "audience",
      label: "Аудитория",
      description: "Сегментируйте клиентов и создайте персоны",
      href: "/audience",
      done: !!audienceArtifact,
    },
    {
      id: "offer",
      label: "Оффер",
      description: "Сформулируйте ценностное предложение",
      href: "/offers",
      done: !!offerArtifact,
    },
    {
      id: "strategy",
      label: "Стратегия",
      description: "Получите 30-дневный план действий",
      href: "/strategy",
      done: !!strategyArtifact,
    },
    {
      id: "content",
      label: "Контент-план",
      description: "Создайте календарь публикаций",
      href: "/content",
      done: !!contentArtifact,
    },
    {
      id: "metrics",
      label: "Первые метрики",
      description: "Добавьте данные по каналам за текущий месяц",
      href: "/analytics",
      done: metrics.length > 0,
    },
  ]

  return (
    <DashboardView
      projectId={projectId}
      projectName={project.name}
      projects={serializedProjects}
      analysis={analysis}
      summary={summary}
      prevSummary={prevSummary}
      channels={channels}
      tasks={tasks.map((t) => ({
        id: t.id,
        artifactId: t.artifactId,
        taskKey: t.taskKey,
        done: t.done,
      }))}
      reports={reports.map((r) => ({
        id: r.id,
        type: r.type as string,
        createdAt: r.createdAt.toISOString(),
      }))}
      strategyKpis={strategyKpis}
      todayContent={todayContent}
      hasContentPlan={!!contentArtifact}
      contentPlanUpdatedAt={contentArtifact?.createdAt.toISOString() ?? null}
      onboardingSteps={onboardingSteps}
    />
  )
}
