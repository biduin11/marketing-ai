import type { Project, AiArtifact, Metric } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { directorAnalysisSchema } from "@/lib/ai/schemas/directorAnalysis"
import {
  directorAnalysisSystem,
  buildDirectorInput,
  type DirectorContext,
} from "@/lib/ai/prompts/directorAnalysis"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"
import {
  computeSummary,
  computeChannelBreakdown,
  filterByRange,
  getPreviousRange,
} from "@/lib/services/analytics.service"

function safeStr(payload: unknown, extractor: (p: Record<string, unknown>) => string): string | undefined {
  try {
    if (!payload || typeof payload !== "object") return undefined
    return extractor(payload as Record<string, unknown>) || undefined
  } catch {
    return undefined
  }
}

function buildDirectorContext(
  project: Project,
  artifacts: AiArtifact[],
  metrics: Metric[]
): DirectorContext {
  function latest(type: string): AiArtifact | undefined {
    return artifacts
      .filter((a) => a.type === type)
      .sort((a, b) => b.version - a.version)[0]
  }

  const companyArtifact = latest("COMPANY_ANALYSIS")
  const audienceArtifact = latest("AUDIENCE_SEGMENTS")
  const competitorArtifact = latest("COMPETITOR_ANALYSIS")
  const offerArtifact = latest("OFFER")
  const cjmArtifact = latest("CJM")
  const contentArtifact = latest("CONTENT_PLAN")
  const reportArtifact =
    latest("REPORT_MONTHLY") ?? latest("REPORT_WEEKLY") ?? latest("REPORT_QUARTERLY")

  const company = safeStr(companyArtifact?.payload, (p) => {
    const parts: string[] = []
    if (p.summary) parts.push(String(p.summary))
    if (Array.isArray(p.strengths)) parts.push(`Сильные стороны: ${(p.strengths as string[]).slice(0, 3).join(", ")}`)
    if (Array.isArray(p.weaknesses)) parts.push(`Слабые стороны: ${(p.weaknesses as string[]).slice(0, 2).join(", ")}`)
    if (Array.isArray(p.growthPoints)) parts.push(`Точки роста: ${(p.growthPoints as string[]).slice(0, 2).join(", ")}`)
    return parts.join("\n")
  })

  const audience = safeStr(audienceArtifact?.payload, (p) => {
    if (!Array.isArray(p.segments)) return ""
    return (p.segments as Array<Record<string, unknown>>)
      .slice(0, 3)
      .map((s) => `• ${String(s.name ?? "")}: ${String(s.description ?? "")}`)
      .join("\n")
  })

  const competitors = safeStr(competitorArtifact?.payload, (p) => {
    if (!Array.isArray(p.competitors)) return ""
    return (p.competitors as Array<Record<string, unknown>>)
      .slice(0, 3)
      .map((c) => `• ${String(c.name ?? "")}: ${String(c.positioning ?? c.description ?? "")}`)
      .join("\n")
  })

  const offer = safeStr(offerArtifact?.payload, (p) => {
    const parts: string[] = []
    if (p.name) parts.push(`Оффер: ${String(p.name)}`)
    if (p.valueProposition) parts.push(`УТП: ${String(p.valueProposition)}`)
    if (p.price) parts.push(`Цена: ${String(p.price)}`)
    return parts.join(" | ")
  })

  const cjm = safeStr(cjmArtifact?.payload, (p) => {
    const parts: string[] = []
    if (p.summary) parts.push(String(p.summary))
    if (Array.isArray(p.stages)) {
      const highChurn = (p.stages as Array<Record<string, unknown>>).filter((s) => s.churnRisk === "high")
      if (highChurn.length) parts.push(`Высокий отток на этапах: ${highChurn.map((s) => String(s.name)).join(", ")}`)
    }
    if (Array.isArray(p.recommendations)) {
      parts.push(`Рекомендации: ${(p.recommendations as string[]).slice(0, 2).join("; ")}`)
    }
    return parts.join("\n")
  })

  const contentPlan = safeStr(contentArtifact?.payload, (p) => {
    const parts: string[] = []
    if (p.summary) parts.push(String(p.summary))
    if (Array.isArray(p.calendar)) parts.push(`Контент-план: ${(p.calendar as unknown[]).length} публикаций`)
    return parts.join(" | ")
  })

  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const recent = filterByRange(metrics, from, to)

  let metricsCtx: DirectorContext["metrics"] | undefined
  if (recent.length > 0) {
    const summary = computeSummary(recent)
    const channels = computeChannelBreakdown(recent)
    const sorted = [...channels].sort((a, b) => b.roi - a.roi)
    metricsCtx = {
      totalSpend: summary.totalSpend,
      totalRevenue: summary.totalRevenue,
      roi: summary.roi,
      romi: summary.romi,
      cac: summary.cac,
      ltv: summary.ltv,
      topChannel: sorted[0]?.channel ?? "",
      worstChannel: sorted[sorted.length - 1]?.channel ?? "",
    }
  }

  const lastReport = safeStr(reportArtifact?.payload, (p) => {
    const parts: string[] = []
    if (p.headline) parts.push(String(p.headline))
    if (p.summary) parts.push(String(p.summary).slice(0, 300))
    return parts.join("\n")
  })

  return {
    projectName: project.name,
    niche: project.niche ?? "",
    goals: project.goals ?? "не указаны",
    budget: project.budget ?? 0,
    company,
    audience,
    competitors,
    offer,
    cjm,
    contentPlan,
    metrics: metricsCtx,
    lastReport,
  }
}

export async function generateDirectorAnalysis(
  project: Project,
  metrics: Metric[],
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const today = new Date().toISOString().slice(0, 10)
  const inputHash = computeInputHash({
    type: "DIRECTOR_DAILY",
    projectId: project.id,
    date: today,
    metricsCount: metrics.length,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, "DIRECTOR_DAILY")
    if (latest && latest.inputHash === inputHash) return latest
  }

  const artifacts = await prisma.aiArtifact.findMany({
    where: { projectId: project.id },
    orderBy: { version: "desc" },
  })

  const ctx = buildDirectorContext(project, artifacts, metrics)

  const { data, model } = await routeAI({
    task: "DIRECTOR",
    system: directorAnalysisSystem,
    prompt: buildDirectorInput(ctx),
    schema: directorAnalysisSchema,
    maxTokens: 8000,
  })

  const version = await getNextVersion(project.id, "DIRECTOR_DAILY")
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: "DIRECTOR_DAILY",
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
