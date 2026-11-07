import type { Project, ReputationSnapshot } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { routeAI } from "@/lib/ai/router"
import type { PlanName } from "@/lib/config/plans"
import { groundGrowthPoints, reputationSchema, type Reputation, type ReputationInput } from "@/lib/ai/schemas/reputation"
import { reputationSystem, buildReputationInput } from "@/lib/ai/prompts/reputation"
import { tavilyMultiSearch, formatSearchResultsForPrompt } from "@/lib/services/tavily.service"

function buildReputationQueries(name: string, city: string, yandexMaps?: string, twogis?: string): string[] {
  const queries = [
    `${name} ${city} отзывы`.trim(),
    `${name} ${city} рейтинг Яндекс Карты`.trim(),
    `${name} ${city} 2ГИС отзывы`.trim(),
    `${name} отзывы клиентов`.trim(),
  ]
  if (yandexMaps) queries.push(yandexMaps)
  if (twogis) queries.push(twogis)
  return queries
}

async function analyzeReputation(
  project: Project,
  plan: PlanName,
  input: ReputationInput
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
`

  const queries = buildReputationQueries(project.name, city, yandexMaps, twogis)
  const searchResults = input.mode === "web" ? await tavilyMultiSearch(queries) : {}
  const evidence = input.mode === "manual"
    ? [{ text: input.text, url: null }]
    : Object.values(searchResults).flat().map(({ content, url }) => ({ text: content.slice(0, 500), url }))

  if (input.mode === "web" && evidence.length === 0) {
    throw new Error("Веб-поиск не вернул материалов. Попробуйте позже или добавьте отзывы вручную.")
  }

  const reviewContext = input.mode === "manual"
    ? `РЕЖИМ: ручной ввод. Ниша проекта: ${project.niche}\nОТЗЫВЫ ПОЛЬЗОВАТЕЛЯ:\n${input.text}`
    : `РЕЖИМ: веб-поиск.\nРЕЗУЛЬТАТЫ ПОИСКА В ИНТЕРНЕТЕ:\n${formatSearchResultsForPrompt(searchResults)}`

  const { data, model } = await routeAI({
    task: "REPUTATION",
    plan,
    system: reputationSystem,
    prompt:
      buildReputationInput({
        name: project.name,
        city,
        website: project.website,
      }) +
      companyContext +
      "\n" + reviewContext,
    schema: reputationSchema,
    maxTokens: 8000,
  })

  return {
    payload: {
      ...data,
      growthPoints: groundGrowthPoints(data.growthPoints, evidence),
      reviewMode: input.mode,
    },
    model,
  }
}

export async function generateReputationSnapshot(
  project: Project,
  plan: PlanName,
  input: ReputationInput
): Promise<ReputationSnapshot> {
  const { payload, model } = await analyzeReputation(project, plan, input)
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
