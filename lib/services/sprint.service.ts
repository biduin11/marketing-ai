import type { Project, Sprint, SprintTask } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { sprintSchema } from "@/lib/ai/schemas/sprint"
import { sprintSystem, buildSprintInput, type CompanyCard } from "@/lib/ai/prompts/sprint"
import { computeSummary } from "@/lib/services/analytics.service"
import { getLatestArtifact } from "@/lib/services/artifacts"

export type SprintWithTasks = Sprint & { tasks: SprintTask[] }

function toCard(project: Project): CompanyCard {
  return {
    name: project.name,
    niche: project.niche,
    website: project.website,
    regions: project.regions,
    products: project.products,
    competitors: project.competitors,
    budget: project.budget,
    goals: project.goals,
    socials: project.socials,
  }
}

/** Monday 00:00 UTC of the week containing `date`. */
export function startOfWeekMonday(date: Date): Date {
  const day = date.getUTCDay() // 0 = Sunday .. 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diff))
}

/** Sunday 00:00 UTC of the week starting at `weekStart`. */
export function endOfWeekSunday(weekStart: Date): Date {
  return new Date(
    Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 6)
  )
}

const RU_DATE = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" })

async function buildUnfinishedTasksContext(projectId: string, weekStart: Date): Promise<string> {
  const prevWeekStart = new Date(
    Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() - 7)
  )
  const prevSprint = await prisma.sprint.findUnique({
    where: { projectId_weekStart: { projectId, weekStart: prevWeekStart } },
    include: { tasks: { where: { completed: false } } },
  })
  if (!prevSprint || prevSprint.tasks.length === 0) return "нет"
  return prevSprint.tasks.map((t) => `«${t.title}» (${t.category})`).join("; ")
}

async function buildStrategyContext(projectId: string): Promise<string> {
  const types = ["STRATEGY_30", "STRATEGY_90", "STRATEGY_180", "STRATEGY_365"] as const
  for (const type of types) {
    const artifact = await getLatestArtifact(projectId, type)
    if (artifact) {
      const payload = artifact.payload as { summary?: string }
      if (payload?.summary) return payload.summary
    }
  }
  return "стратегия ещё не сгенерирована"
}

async function buildMetricsContext(projectId: string): Promise<string> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const metrics = await prisma.metric.findMany({
    where: { projectId, date: { gte: since } },
  })
  if (metrics.length === 0) return "метрики не заведены"

  const summary = computeSummary(metrics)
  return `выручка ${summary.totalRevenue.toLocaleString("ru-RU")} ₽, расход ${summary.totalSpend.toLocaleString("ru-RU")} ₽, лиды ${summary.totalLeads}, ROI ${summary.roi.toFixed(1)}%`
}

async function buildContentContext(projectId: string): Promise<string> {
  const artifact = await getLatestArtifact(projectId, "CONTENT_PLAN")
  if (!artifact) return "контент-план не сгенерирован"
  const payload = artifact.payload as { summary?: string }
  return payload?.summary ?? "контент-план не сгенерирован"
}

/**
 * Generates (or regenerates) the sprint for the week containing `now`.
 * Always overwrites the existing sprint for that week — sprints are a live
 * weekly plan, not versioned artifacts like AiArtifact.
 */
export async function generateSprint(project: Project, now: Date = new Date()): Promise<SprintWithTasks> {
  const weekStart = startOfWeekMonday(now)
  const weekEnd = endOfWeekSunday(weekStart)

  const [strategyContext, unfinishedTasks, metricsContext, contentContext] = await Promise.all([
    buildStrategyContext(project.id),
    buildUnfinishedTasksContext(project.id, weekStart),
    buildMetricsContext(project.id),
    buildContentContext(project.id),
  ])

  const weekDates = `${RU_DATE.format(weekStart)} — ${RU_DATE.format(weekEnd)}`

  const { data } = await routeAI({
    task: "SPRINT",
    system: sprintSystem,
    prompt: buildSprintInput({
      card: toCard(project),
      weekDates,
      strategyContext,
      unfinishedTasks,
      metricsContext,
      contentContext,
    }),
    schema: sprintSchema,
  })

  const sprint = await prisma.$transaction(async (tx) => {
    const saved = await tx.sprint.upsert({
      where: { projectId_weekStart: { projectId: project.id, weekStart } },
      create: {
        projectId: project.id,
        weekStart,
        weekEnd,
        aiSummary: data.weekSummary,
      },
      update: { aiSummary: data.weekSummary, weekEnd },
    })

    await tx.sprintTask.deleteMany({ where: { sprintId: saved.id } })
    await tx.sprintTask.createMany({
      data: data.tasks.map((t) => ({
        sprintId: saved.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        category: t.category,
        estimatedHours: t.estimatedHours,
        dueDay: t.dueDay,
      })),
    })

    return tx.sprint.findUniqueOrThrow({
      where: { id: saved.id },
      include: { tasks: { orderBy: { createdAt: "asc" } } },
    })
  })

  return sprint
}
