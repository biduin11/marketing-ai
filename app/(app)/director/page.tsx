import { redirect } from "next/navigation"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { prisma } from "@/lib/prisma"
import { listMetrics } from "@/lib/actions/metrics"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { directorAnalysisSchema } from "@/lib/ai/schemas/directorAnalysis"
import { DirectorView } from "@/components/director/director-view"

export default async function DirectorPage() {
  const projectId = await getActiveProjectId()
  if (!projectId) redirect("/")

  const [project, metrics, artifact] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    listMetrics(projectId),
    getLatestArtifact(projectId, "DIRECTOR_DAILY"),
  ])

  if (!project) redirect("/")

  const parseResult = artifact
    ? directorAnalysisSchema.safeParse(artifact.payload)
    : null
  const analysis = parseResult?.success ? parseResult.data : null

  return (
    <DirectorView
      projectId={projectId}
      analysis={analysis}
      version={artifact?.version ?? null}
    />
  )
}
