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

export default async function AudiencePage() {
  const projectId = await getActiveProjectId()

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

  const [segmentsArtifact, personaArtifact, jtbdArtifact] = await Promise.all([
    getLatestArtifact(project.id, "AUDIENCE_SEGMENTS"),
    getLatestArtifact(project.id, "BUYER_PERSONA"),
    getLatestArtifact(project.id, "JTBD"),
  ])

  const segmentsParsed = segmentsArtifact
    ? audienceSegmentsSchema.safeParse(segmentsArtifact.payload)
    : null
  const personaParsed = personaArtifact
    ? buyerPersonaSchema.safeParse(personaArtifact.payload)
    : null
  const jtbdParsed = jtbdArtifact
    ? jtbdSchema.safeParse(jtbdArtifact.payload)
    : null

  return (
    <AudienceView
      projectId={project.id}
      segments={segmentsParsed?.success ? segmentsParsed.data : null}
      segmentsVersion={segmentsArtifact?.version ?? null}
      persona={personaParsed?.success ? personaParsed.data : null}
      personaVersion={personaArtifact?.version ?? null}
      jtbd={jtbdParsed?.success ? jtbdParsed.data : null}
      jtbdVersion={jtbdArtifact?.version ?? null}
    />
  )
}
