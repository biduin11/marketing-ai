"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { anthropic } from "@/lib/ai/client"
import { generateTextWithGemini } from "@/lib/ai/generate-with-gemini"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { listMetrics } from "@/lib/actions/metrics"
import { computeSummary, computeChannelBreakdown, filterByRange } from "@/lib/services/analytics.service"
import { z } from "zod"

const chatInputSchema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(20),
})

export type ChatMessage = { role: "user" | "assistant"; content: string }

type ChatResult =
  | { success: true; reply: string }
  | { success: false; error: string }

async function buildProjectContext(projectId: string): Promise<string> {
  const [
    project,
    companyArtifact,
    audienceArtifact,
    competitorArtifact,
    offerArtifact,
    strategyArtifact,
    contentArtifact,
    directorArtifact,
    metrics,
  ] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    getLatestArtifact(projectId, "COMPANY_ANALYSIS"),
    getLatestArtifact(projectId, "AUDIENCE_SEGMENTS"),
    getLatestArtifact(projectId, "COMPETITOR_ANALYSIS"),
    getLatestArtifact(projectId, "OFFER"),
    getLatestArtifact(projectId, "STRATEGY_30"),
    getLatestArtifact(projectId, "CONTENT_PLAN"),
    getLatestArtifact(projectId, "DIRECTOR_DAILY"),
    listMetrics(projectId),
  ])

  if (!project) return ""

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyMetrics = filterByRange(metrics, monthStart, now)
  const summary = monthlyMetrics.length > 0 ? computeSummary(monthlyMetrics) : null
  const channels = monthlyMetrics.length > 0
    ? computeChannelBreakdown(monthlyMetrics).sort((a, b) => b.roi - a.roi)
    : []

  const lines: string[] = [
    `=== ПРОЕКТ: ${project.name} ===`,
    `Ниша: ${project.niche ?? "не указана"}`,
    `Сайт: ${project.website ?? "не указан"}`,
    `Бюджет: ${project.budget ? `${project.budget.toLocaleString("ru-RU")} ₽/мес` : "не указан"}`,
    `Цели: ${project.goals ?? "не указаны"}`,
    "",
  ]

  if (companyArtifact) {
    lines.push("--- АНАЛИЗ КОМПАНИИ ---")
    lines.push(JSON.stringify(companyArtifact.payload, null, 0).slice(0, 2000))
    lines.push("")
  }

  if (audienceArtifact) {
    lines.push("--- АУДИТОРИЯ ---")
    lines.push(JSON.stringify(audienceArtifact.payload, null, 0).slice(0, 1500))
    lines.push("")
  }

  if (competitorArtifact) {
    lines.push("--- КОНКУРЕНТЫ ---")
    lines.push(JSON.stringify(competitorArtifact.payload, null, 0).slice(0, 1500))
    lines.push("")
  }

  if (offerArtifact) {
    lines.push("--- ОФФЕР ---")
    lines.push(JSON.stringify(offerArtifact.payload, null, 0).slice(0, 1000))
    lines.push("")
  }

  if (strategyArtifact) {
    lines.push("--- СТРАТЕГИЯ (30 дней) ---")
    lines.push(JSON.stringify(strategyArtifact.payload, null, 0).slice(0, 1500))
    lines.push("")
  }

  if (contentArtifact) {
    lines.push("--- КОНТЕНТ-ПЛАН ---")
    const payload = contentArtifact.payload as { summary?: string }
    lines.push(payload.summary ?? JSON.stringify(contentArtifact.payload, null, 0).slice(0, 800))
    lines.push("")
  }

  if (directorArtifact) {
    lines.push("--- AI ДИРЕКТОР (последний анализ) ---")
    lines.push(JSON.stringify(directorArtifact.payload, null, 0).slice(0, 1500))
    lines.push("")
  }

  if (summary) {
    lines.push("--- МЕТРИКИ (текущий месяц) ---")
    lines.push(`Расходы: ${summary.totalSpend.toLocaleString("ru-RU")} ₽`)
    lines.push(`Выручка: ${summary.totalRevenue.toLocaleString("ru-RU")} ₽`)
    lines.push(`ROI: ${summary.roi.toFixed(1)}%`)
    lines.push(`Лиды: ${summary.totalLeads}`)
    lines.push(`CAC: ${summary.cac.toLocaleString("ru-RU")} ₽`)
    if (channels.length > 0) {
      lines.push(`Топ-канал: ${channels[0].channel} (ROI ${channels[0].roi.toFixed(1)}%)`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

export async function sendProjectChatMessage(raw: unknown): Promise<ChatResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Не авторизован" }

  const parsed = chatInputSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: "Неверный запрос" }

  const { projectId, message, history } = parsed.data

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return { success: false, error: "Нет доступа" }

  const context = await buildProjectContext(projectId)

  const systemPrompt = `Ты — AI-ассистент маркетолога в приложении AI Marketing OS.

У тебя есть полный контекст проекта пользователя:

${context}

Отвечай только на русском языке. Давай конкретные, actionable ответы на основе данных проекта.
Если данных недостаточно — честно скажи об этом. Будь краток: 2-4 абзаца максимум, если не просят подробнее.`

  try {
    if (process.env.AI_PROVIDER === "gemini") {
      const transcript = history.map((m) => `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`).join("\n")
      const reply = await generateTextWithGemini({
        system: systemPrompt,
        user: transcript ? `${transcript}\nПользователь: ${message}` : message,
        maxTokens: 2048,
      })
      return { success: true, reply }
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
    })

    const reply =
      response.content[0]?.type === "text" ? response.content[0].text : "Не удалось получить ответ"

    return { success: true, reply }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка AI"
    return { success: false, error: message }
  }
}
