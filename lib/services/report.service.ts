import type { Project, AiArtifact, Metric } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { executiveReportSchema } from "@/lib/ai/schemas/executiveReport"
import {
  executiveReportSystem,
  buildExecutiveReportInput,
} from "@/lib/ai/prompts/executiveReport"
import { computeInputHash } from "@/lib/services/hash"
import { getLatestArtifact, getNextVersion } from "@/lib/services/artifacts"
import {
  appendAiContext,
  attachAiContextMetadata,
  loadAiGenerationContext,
} from "@/lib/services/ai-context.service"
import {
  computeSummary,
  computeChannelBreakdown,
} from "@/lib/services/analytics.service"

type ReportArtifactType = "REPORT_WEEKLY" | "REPORT_MONTHLY" | "REPORT_QUARTERLY"

const periodTypeMap: Record<ReportArtifactType, "weekly" | "monthly" | "quarterly"> = {
  REPORT_WEEKLY: "weekly",
  REPORT_MONTHLY: "monthly",
  REPORT_QUARTERLY: "quarterly",
}

export async function generateExecutiveReport(
  project: Project,
  artifactType: ReportArtifactType,
  metrics: Metric[],
  period: string,
  options: { force?: boolean } = {}
): Promise<AiArtifact> {
  const summary = computeSummary(metrics)
  const channels = computeChannelBreakdown(metrics)
  const context = await loadAiGenerationContext(project, artifactType)
  const inputHash = computeInputHash({
    type: artifactType,
    period,
    metrics: metrics.map((metric) => ({
      date: metric.date.toISOString().slice(0, 10),
      channel: metric.channel,
      spend: metric.spend,
      revenue: metric.revenue,
      leads: metric.leads,
      clicks: metric.clicks,
      impressions: metric.impressions,
    })),
    context: context.contextFingerprint,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, artifactType)
    if (latest && latest.inputHash === inputHash) return latest
  }

  const periodType = periodTypeMap[artifactType]
  const { data, model } = await routeAI({
    task: "REPORT",
    system: executiveReportSystem,
    prompt: appendAiContext(
      buildExecutiveReportInput({
        period,
        periodType,
        summary,
        channels,
        projectName: project.name,
        niche: project.niche,
      }),
      context
    ),
    schema: executiveReportSchema,
    maxTokens: 4000,
  })

  const version = await getNextVersion(project.id, artifactType)
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: artifactType,
      version,
      payload: attachAiContextMetadata(data, context),
      model,
      inputHash,
    },
  })
}
