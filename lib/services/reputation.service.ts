import type { Project, ReputationSnapshot } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import { reputationSchema, type Reputation } from "@/lib/ai/schemas/reputation"
import { reputationSystem, buildReputationInput } from "@/lib/ai/prompts/reputation"

async function analyzeReputation(
  project: Project
): Promise<{ payload: Reputation; model: string }> {
  const city = project.regions[0] ?? ""
  const socials =
    project.socials && typeof project.socials === "object" && !Array.isArray(project.socials)
      ? (project.socials as Record<string, unknown>)
      : {}
  const yandexMaps = typeof socials.yandexMaps === "string" ? socials.yandexMaps : undefined
  const twogis = typeof socials.twogis === "string" ? socials.twogis : undefined

  const companyContext = `
ПРЯМЫЕ ССЫЛКИ НА КАРТОЧКИ КОМПАНИИ:
Яндекс.Карты: ${yandexMaps ?? "не указана"}
2ГИС: ${twogis ?? "не указана"}

ВАЖНО: Используй эти прямые ссылки для поиска отзывов.
Не ищи компанию по названию — сразу переходи по ссылкам выше.
`

  const { data, model } = await routeAI({
    task: "REPUTATION",
    system: reputationSystem,
    prompt:
      buildReputationInput({
        name: project.name,
        city,
        website: project.website,
      }) + companyContext,
    schema: reputationSchema,
    maxTokens: 8000,
  })

  return { payload: data, model }
}

export async function generateReputationSnapshot(
  project: Project
): Promise<ReputationSnapshot> {
  const { payload, model } = await analyzeReputation(project)
  return prisma.reputationSnapshot.create({
    data: { projectId: project.id, payload, model },
  })
}

export async function getLatestReputationSnapshot(
  projectId: string
): Promise<ReputationSnapshot | null> {
  return prisma.reputationSnapshot.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
}
