import { Users } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { AudienceView } from "@/components/audience/audience-view"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getProject } from "@/lib/actions/projects"
import { getLatestArtifact } from "@/lib/services/artifacts"
import {
  audienceSegmentsSchema,
  buyerPersonaSchema,
  jtbdSchema,
} from "@/lib/ai/schemas/audience"
import { cjmSchema } from "@/lib/ai/schemas/cjm"

export default async function AudiencePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const projectId = await getActiveProjectId()
  const { tab } = await searchParams

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Users}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы работать с аудиторией."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Users}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const [segmentsArtifact, personaArtifact, jtbdArtifact, cjmArtifact] =
    await Promise.all([
      getLatestArtifact(project.id, "AUDIENCE_SEGMENTS"),
      getLatestArtifact(project.id, "BUYER_PERSONA"),
      getLatestArtifact(project.id, "JTBD"),
      getLatestArtifact(project.id, "CJM"),
    ])

  const segmentsParsed = segmentsArtifact
    ? audienceSegmentsSchema.safeParse(segmentsArtifact.payload)
    : null
  const personaParsed = personaArtifact
    ? buyerPersonaSchema.safeParse(personaArtifact.payload)
    : null
  const jtbdParsed = jtbdArtifact ? jtbdSchema.safeParse(jtbdArtifact.payload) : null
  const cjmParsed = cjmArtifact ? cjmSchema.safeParse(cjmArtifact.payload) : null

  return (
    <AudienceView
      projectId={project.id}
      defaultTab={tab ?? "overview"}
      segments={segmentsParsed?.success ? segmentsParsed.data : null}
      segmentsVersion={segmentsArtifact?.version ?? null}
      segmentsCreatedAt={segmentsArtifact?.createdAt.toISOString() ?? null}
      persona={personaParsed?.success ? personaParsed.data : null}
      personaVersion={personaArtifact?.version ?? null}
      jtbd={jtbdParsed?.success ? jtbdParsed.data : null}
      jtbdVersion={jtbdArtifact?.version ?? null}
      cjm={cjmParsed?.success ? cjmParsed.data : null}
      cjmVersion={cjmArtifact?.version ?? null}
      cjmCreatedAt={cjmArtifact?.createdAt.toISOString() ?? null}
    />
  )
}
