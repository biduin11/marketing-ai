import { prisma } from "@/lib/prisma"

/** Server-only metric lookup for trusted jobs and already-authorized callers. */
export async function listProjectMetrics(projectId: string) {
  return prisma.metric.findMany({
    where: { projectId },
    orderBy: { date: "asc" },
  })
}
