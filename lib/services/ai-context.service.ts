import type { AiArtifact, ArtifactType, Metric, Prisma, Project } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { computeInputHash } from "@/lib/services/hash"

const CONTEXT_VERSION = 1
const MAX_ARTIFACT_CHARS = 3_500

export const AI_CONTEXT_DEPENDENCIES: Partial<Record<ArtifactType, ArtifactType[]>> = {
  COMPANY_ANALYSIS: [],
  MARKET_ANALYSIS: ["COMPANY_ANALYSIS"],
  PRODUCT_ANALYSIS: ["COMPANY_ANALYSIS", "MARKET_ANALYSIS"],
  COMPETITOR_ANALYSIS: ["COMPANY_ANALYSIS", "MARKET_ANALYSIS", "PRODUCT_ANALYSIS"],
  AUDIENCE_SEGMENTS: [
    "COMPANY_ANALYSIS",
    "MARKET_ANALYSIS",
    "PRODUCT_ANALYSIS",
    "COMPETITOR_ANALYSIS",
  ],
  BUYER_PERSONA: ["AUDIENCE_SEGMENTS", "PRODUCT_ANALYSIS", "COMPETITOR_ANALYSIS"],
  JTBD: ["AUDIENCE_SEGMENTS", "BUYER_PERSONA", "PRODUCT_ANALYSIS"],
  OFFER: [
    "COMPANY_ANALYSIS",
    "MARKET_ANALYSIS",
    "PRODUCT_ANALYSIS",
    "COMPETITOR_ANALYSIS",
    "AUDIENCE_SEGMENTS",
    "BUYER_PERSONA",
    "JTBD",
  ],
  CJM: ["AUDIENCE_SEGMENTS", "BUYER_PERSONA", "JTBD", "OFFER"],
  STRATEGY_30: [
    "COMPANY_ANALYSIS",
    "MARKET_ANALYSIS",
    "PRODUCT_ANALYSIS",
    "COMPETITOR_ANALYSIS",
    "AUDIENCE_SEGMENTS",
    "BUYER_PERSONA",
    "JTBD",
    "OFFER",
    "CJM",
  ],
  STRATEGY_90: [
    "COMPANY_ANALYSIS",
    "MARKET_ANALYSIS",
    "PRODUCT_ANALYSIS",
    "COMPETITOR_ANALYSIS",
    "AUDIENCE_SEGMENTS",
    "BUYER_PERSONA",
    "JTBD",
    "OFFER",
    "CJM",
  ],
  STRATEGY_180: [
    "COMPANY_ANALYSIS",
    "MARKET_ANALYSIS",
    "PRODUCT_ANALYSIS",
    "COMPETITOR_ANALYSIS",
    "AUDIENCE_SEGMENTS",
    "BUYER_PERSONA",
    "JTBD",
    "OFFER",
    "CJM",
  ],
  STRATEGY_365: [
    "COMPANY_ANALYSIS",
    "MARKET_ANALYSIS",
    "PRODUCT_ANALYSIS",
    "COMPETITOR_ANALYSIS",
    "AUDIENCE_SEGMENTS",
    "BUYER_PERSONA",
    "JTBD",
    "OFFER",
    "CJM",
  ],
  CONTENT_PLAN: [
    "COMPANY_ANALYSIS",
    "AUDIENCE_SEGMENTS",
    "BUYER_PERSONA",
    "JTBD",
    "OFFER",
    "CJM",
    "STRATEGY_30",
  ],
  PLATFORM_UTP: ["AUDIENCE_SEGMENTS", "BUYER_PERSONA", "OFFER", "CONTENT_PLAN"],
  REPORT_WEEKLY: ["STRATEGY_30", "CONTENT_PLAN"],
  REPORT_MONTHLY: ["STRATEGY_30", "CONTENT_PLAN"],
  REPORT_QUARTERLY: ["STRATEGY_90", "CONTENT_PLAN"],
  DIRECTOR_DAILY: [
    "COMPANY_ANALYSIS",
    "MARKET_ANALYSIS",
    "PRODUCT_ANALYSIS",
    "COMPETITOR_ANALYSIS",
    "AUDIENCE_SEGMENTS",
    "BUYER_PERSONA",
    "JTBD",
    "OFFER",
    "CJM",
    "STRATEGY_30",
    "STRATEGY_90",
    "CONTENT_PLAN",
    "REPORT_WEEKLY",
    "REPORT_MONTHLY",
    "REPORT_QUARTERLY",
  ],
}

const TARGETS_WITH_METRICS = new Set<ArtifactType>([
  "STRATEGY_30",
  "STRATEGY_90",
  "STRATEGY_180",
  "STRATEGY_365",
  "CONTENT_PLAN",
  "REPORT_WEEKLY",
  "REPORT_MONTHLY",
  "REPORT_QUARTERLY",
  "DIRECTOR_DAILY",
])

export const ARTIFACT_LABELS: Partial<Record<ArtifactType, string>> = {
  COMPANY_ANALYSIS: "Анализ компании",
  MARKET_ANALYSIS: "Анализ рынка",
  PRODUCT_ANALYSIS: "Анализ продукта",
  COMPETITOR_ANALYSIS: "Конкуренты",
  AUDIENCE_SEGMENTS: "Сегменты аудитории",
  BUYER_PERSONA: "Buyer Persona",
  JTBD: "JTBD",
  OFFER: "Оффер",
  CJM: "Путь клиента",
  STRATEGY_30: "Стратегия 30 дней",
  STRATEGY_90: "Стратегия 90 дней",
  STRATEGY_180: "Стратегия 180 дней",
  STRATEGY_365: "Стратегия 365 дней",
  CONTENT_PLAN: "Контент-план",
  PLATFORM_UTP: "УТП площадок",
  REPORT_WEEKLY: "Недельный отчёт",
  REPORT_MONTHLY: "Месячный отчёт",
  REPORT_QUARTERLY: "Квартальный отчёт",
  DIRECTOR_DAILY: "AI Директор",
}

export interface AiContextSource {
  id: string
  type: ArtifactType
  version: number
  model: string
  inputHash: string
  createdAt: string
}

export interface AiContextMetadata {
  contextVersion: number
  target: ArtifactType
  projectFingerprint: string
  contextFingerprint: string
  metricsFingerprint: string | null
  sources: AiContextSource[]
}

export interface AiGenerationContext {
  target: ArtifactType
  promptBlock: string
  projectFingerprint: string
  contextFingerprint: string
  metricsFingerprint: string | null
  sources: AiContextSource[]
  artifacts: AiArtifact[]
  metrics: Metric[]
}

export function buildProjectFacts(project: Project) {
  return {
    name: project.name,
    niche: project.niche,
    website: project.website,
    regions: project.regions,
    products: project.products,
    competitors: project.competitors,
    budget: project.budget,
    goals: project.goals,
    socials: project.socials,
    industry: project.industry,
    dealCycle: project.dealCycle,
    brandTone: project.brandTone,
    brandWords: project.brandWords,
    clientType: project.clientType,
    audienceSegments: project.audienceSegments,
    clientValues: project.clientValues,
    objections: project.objections,
    clientLanguage: project.clientLanguage,
    currentChannels: project.currentChannels,
    marketingGoal: project.marketingGoal,
    socialLinks: project.socialLinks,
    proofFacts: project.proofFacts,
    margin: project.margin,
    conversionRate: project.conversionRate,
    currentCpl: project.currentCpl,
    leadsPerMonth: project.leadsPerMonth,
    salesPerMonth: project.salesPerMonth,
    avgCheck: project.avgCheck,
    competitorsDetailed: project.competitorsDetailed,
    productsDetailed: project.productsDetailed,
  }
}

function latestByType(artifacts: AiArtifact[]): AiArtifact[] {
  const seen = new Set<ArtifactType>()
  return artifacts.filter((artifact) => {
    if (seen.has(artifact.type)) return false
    seen.add(artifact.type)
    return true
  })
}

function serializeMetric(metric: Metric) {
  return {
    date: metric.date.toISOString().slice(0, 10),
    channel: metric.channel,
    spend: metric.spend,
    revenue: metric.revenue,
    leads: metric.leads,
    clicks: metric.clicks,
    impressions: metric.impressions,
  }
}

function compactJson(value: unknown, maxChars = MAX_ARTIFACT_CHARS): string {
  const cleanValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>).filter(([key]) => key !== "_meta")
        )
      : value
  const json = JSON.stringify(cleanValue) ?? "null"
  if (json.length <= maxChars) return json
  return `${json.slice(0, maxChars)}…`
}

function formatPromptBlock(
  project: Project,
  artifacts: AiArtifact[],
  metrics: Metric[]
): string {
  const lines = [
    "=== ЕДИНЫЙ КОНТЕКСТ ПРОЕКТА ===",
    "Правила работы с контекстом:",
    "1. Анкета проекта и реальные метрики — подтверждённые факты. Не заменяй их догадками.",
    "2. Предыдущие AI-анализы — рабочие выводы. Сохраняй согласованность с ними, если они не противоречат фактам.",
    "3. Не выдавай оценку или прогноз за факт. При нехватке данных явно помечай допущение.",
    "4. Не придумывай новые значения для уже заполненных полей и метрик.",
    "",
    "--- ФАКТЫ ИЗ АНКЕТЫ ---",
    compactJson(buildProjectFacts(project), 8_000),
  ]

  if (artifacts.length > 0) {
    lines.push("", "--- АКТУАЛЬНЫЕ РЕЗУЛЬТАТЫ ПРЕДЫДУЩИХ РАЗДЕЛОВ ---")
    for (const artifact of artifacts) {
      lines.push(
        `[${ARTIFACT_LABELS[artifact.type] ?? artifact.type}, версия ${artifact.version}]`,
        compactJson(artifact.payload)
      )
    }
  } else {
    lines.push("", "--- ПРЕДЫДУЩИЕ РАЗДЕЛЫ ---", "Подходящих предыдущих анализов пока нет.")
  }

  if (metrics.length > 0) {
    lines.push(
      "",
      "--- РЕАЛЬНЫЕ МЕТРИКИ ЗА ПОСЛЕДНИЕ 90 ДНЕЙ ---",
      compactJson(metrics.map(serializeMetric), 8_000)
    )
  }

  return lines.join("\n")
}

export async function loadAiGenerationContext(
  project: Project,
  target: ArtifactType,
  options: { includeMetrics?: boolean } = {}
): Promise<AiGenerationContext> {
  const dependencies = AI_CONTEXT_DEPENDENCIES[target] ?? []
  const includeMetrics = options.includeMetrics ?? TARGETS_WITH_METRICS.has(target)
  const metricsFrom = new Date()
  metricsFrom.setDate(metricsFrom.getDate() - 90)

  const [artifactRows, metrics] = await Promise.all([
    dependencies.length > 0
      ? prisma.aiArtifact.findMany({
          where: { projectId: project.id, type: { in: dependencies } },
          orderBy: [{ version: "desc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([] as AiArtifact[]),
    includeMetrics
      ? prisma.metric.findMany({
          where: { projectId: project.id, date: { gte: metricsFrom } },
          orderBy: [{ date: "asc" }, { channel: "asc" }],
        })
      : Promise.resolve([] as Metric[]),
  ])

  const artifacts = latestByType(artifactRows).sort(
    (a, b) => dependencies.indexOf(a.type) - dependencies.indexOf(b.type)
  )
  const sources: AiContextSource[] = artifacts.map((artifact) => ({
    id: artifact.id,
    type: artifact.type,
    version: artifact.version,
    model: artifact.model,
    inputHash: artifact.inputHash,
    createdAt: artifact.createdAt.toISOString(),
  }))
  const projectFingerprint = computeInputHash(buildProjectFacts(project))
  const metricsFingerprint = metrics.length
    ? computeInputHash(metrics.map(serializeMetric))
    : null
  const contextFingerprint = computeInputHash({
    contextVersion: CONTEXT_VERSION,
    target,
    projectFingerprint,
    metricsFingerprint,
    sources,
  })

  return {
    target,
    promptBlock: formatPromptBlock(project, artifacts, metrics),
    projectFingerprint,
    contextFingerprint,
    metricsFingerprint,
    sources,
    artifacts,
    metrics,
  }
}

export function appendAiContext(prompt: string, context: AiGenerationContext): string {
  return `${prompt}\n\n${context.promptBlock}`
}

export function attachAiContextMetadata<T extends Record<string, unknown>>(
  payload: T,
  context: AiGenerationContext
): Prisma.InputJsonObject {
  return {
    ...payload,
    _meta: {
      contextVersion: CONTEXT_VERSION,
      target: context.target,
      projectFingerprint: context.projectFingerprint,
      contextFingerprint: context.contextFingerprint,
      metricsFingerprint: context.metricsFingerprint,
      sources: context.sources,
    },
  } as unknown as Prisma.InputJsonObject
}

export function readAiContextMetadata(payload: unknown): AiContextMetadata | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null
  const meta = (payload as Record<string, unknown>)._meta
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null
  const candidate = meta as Partial<AiContextMetadata>
  if (
    typeof candidate.contextVersion !== "number" ||
    typeof candidate.target !== "string" ||
    typeof candidate.projectFingerprint !== "string" ||
    typeof candidate.contextFingerprint !== "string" ||
    !Array.isArray(candidate.sources)
  ) {
    return null
  }
  return candidate as AiContextMetadata
}

export type AiArtifactFreshness = "missing" | "legacy" | "stale" | "current"

export interface AiContextDiagnosticItem {
  type: ArtifactType
  label: string
  state: AiArtifactFreshness
  version: number | null
  createdAt: string | null
  model: string | null
  sourceLabels: string[]
  missingSourceLabels: string[]
}

export interface AiContextDiagnostics {
  projectName: string
  profileCompleteness: number
  missingFields: string[]
  artifactVersions: number
  availableArtifacts: number
  metricsCount: number
  databaseEmpty: boolean
  items: AiContextDiagnosticItem[]
}

const DIAGNOSTIC_PIPELINE: ArtifactType[] = [
  "COMPANY_ANALYSIS",
  "MARKET_ANALYSIS",
  "PRODUCT_ANALYSIS",
  "COMPETITOR_ANALYSIS",
  "AUDIENCE_SEGMENTS",
  "BUYER_PERSONA",
  "JTBD",
  "OFFER",
  "CJM",
  "STRATEGY_30",
  "CONTENT_PLAN",
  "DIRECTOR_DAILY",
]

const PROFILE_FIELDS: Array<{ key: keyof ReturnType<typeof buildProjectFacts>; label: string }> = [
  { key: "niche", label: "Ниша" },
  { key: "website", label: "Сайт" },
  { key: "regions", label: "Регионы" },
  { key: "products", label: "Продукты или услуги" },
  { key: "competitors", label: "Конкуренты" },
  { key: "budget", label: "Маркетинговый бюджет" },
  { key: "goals", label: "Цели" },
  { key: "industry", label: "Отрасль" },
  { key: "dealCycle", label: "Цикл сделки" },
  { key: "brandTone", label: "Тон бренда" },
  { key: "clientType", label: "Тип клиентов" },
  { key: "audienceSegments", label: "Известные сегменты аудитории" },
  { key: "clientValues", label: "Ценности клиентов" },
  { key: "objections", label: "Возражения" },
  { key: "currentChannels", label: "Текущие каналы" },
  { key: "marketingGoal", label: "Маркетинговая цель" },
  { key: "proofFacts", label: "Факты и доказательства" },
  { key: "avgCheck", label: "Средний чек" },
  { key: "margin", label: "Маржинальность" },
  { key: "conversionRate", label: "Конверсия" },
  { key: "leadsPerMonth", label: "Лиды в месяц" },
  { key: "salesPerMonth", label: "Продажи в месяц" },
]

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

export async function getAiContextDiagnostics(project: Project): Promise<AiContextDiagnostics> {
  const metricsFrom = new Date()
  metricsFrom.setDate(metricsFrom.getDate() - 90)
  const [artifactRows, metrics] = await Promise.all([
    prisma.aiArtifact.findMany({
      where: { projectId: project.id },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    }),
    prisma.metric.findMany({
      where: { projectId: project.id, date: { gte: metricsFrom } },
      orderBy: [{ date: "asc" }, { channel: "asc" }],
    }),
  ])

  const latestArtifacts = latestByType(artifactRows)
  const latestMap = new Map(latestArtifacts.map((artifact) => [artifact.type, artifact]))
  const facts = buildProjectFacts(project)
  const projectFingerprint = computeInputHash(facts)
  const metricsFingerprint = metrics.length
    ? computeInputHash(metrics.map(serializeMetric))
    : null
  const missingFields = PROFILE_FIELDS.filter(({ key }) => !hasValue(facts[key])).map(
    ({ label }) => label
  )

  const items = DIAGNOSTIC_PIPELINE.map((type): AiContextDiagnosticItem => {
    const artifact = latestMap.get(type)
    const dependencies = AI_CONTEXT_DEPENDENCIES[type] ?? []
    const availableDependencies = dependencies.filter((dependency) => latestMap.has(dependency))
    const missingDependencies = dependencies.filter((dependency) => !latestMap.has(dependency))
    let state: AiArtifactFreshness = "missing"

    if (artifact) {
      const meta = readAiContextMetadata(artifact.payload)
      if (!meta) {
        state = "legacy"
      } else {
        const recordedSourceIds = new Set(meta.sources.map((source) => source.id))
        const sourceChanged = availableDependencies.some((dependency) => {
          const latest = latestMap.get(dependency)
          return latest ? !recordedSourceIds.has(latest.id) : false
        })
        const metricsChanged = TARGETS_WITH_METRICS.has(type)
          ? meta.metricsFingerprint !== metricsFingerprint
          : false
        state =
          meta.contextVersion !== CONTEXT_VERSION ||
          meta.projectFingerprint !== projectFingerprint ||
          sourceChanged ||
          metricsChanged
            ? "stale"
            : "current"
      }
    }

    return {
      type,
      label: ARTIFACT_LABELS[type] ?? type,
      state,
      version: artifact?.version ?? null,
      createdAt: artifact?.createdAt.toISOString() ?? null,
      model: artifact?.model ?? null,
      sourceLabels: availableDependencies.map(
        (dependency) => ARTIFACT_LABELS[dependency] ?? dependency
      ),
      missingSourceLabels: missingDependencies.map(
        (dependency) => ARTIFACT_LABELS[dependency] ?? dependency
      ),
    }
  })

  return {
    projectName: project.name,
    profileCompleteness: Math.round(
      ((PROFILE_FIELDS.length - missingFields.length) / PROFILE_FIELDS.length) * 100
    ),
    missingFields,
    artifactVersions: artifactRows.length,
    availableArtifacts: latestArtifacts.length,
    metricsCount: metrics.length,
    databaseEmpty: artifactRows.length === 0 && metrics.length === 0,
    items,
  }
}
