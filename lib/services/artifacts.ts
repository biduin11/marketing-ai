import type { ArtifactType } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/** Returns the latest version of an artifact of the given type for a project. */
export async function getLatestArtifact(
  projectId: string,
  type: ArtifactType
) {
  return prisma.aiArtifact.findFirst({
    where: { projectId, type },
    orderBy: { version: "desc" },
  })
}

/** Next version number for a given project + artifact type (1-based). */
export async function getNextVersion(
  projectId: string,
  type: ArtifactType
): Promise<number> {
  const latest = await prisma.aiArtifact.findFirst({
    where: { projectId, type },
    orderBy: { version: "desc" },
    select: { version: true },
  })
  return (latest?.version ?? 0) + 1
}
