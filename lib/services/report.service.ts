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
  const inputHash = computeInputHash({
    type: artifactType,
    projectId: project.id,
    period,
    metricsCount: metrics.length,
    totalSpend: summary.totalSpend,
    totalRevenue: summary.totalRevenue,
  })

  if (!options.force) {
    const latest = await getLatestArtifact(project.id, artifactType)
    if (latest && latest.inputHash === inputHash) return latest
  }

  const periodType = periodTypeMap[artifactType]
  const { data, model } = await routeAI({
    task: "REPORT",
    system: executiveReportSystem,
    prompt: buildExecutiveReportInput({
      period,
      periodType,
      summary,
      channels,
      projectName: project.name,
      niche: project.niche,
    }),
    schema: executiveReportSchema,
    maxTokens: 4000,
  })

  const version = await getNextVersion(project.id, artifactType)
  return prisma.aiArtifact.create({
    data: {
      projectId: project.id,
      type: artifactType,
      version,
      payload: data,
      model,
      inputHash,
    },
  })
}
