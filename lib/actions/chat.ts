"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { anthropic } from "@/lib/ai/client"
import { generateTextWithGemini } from "@/lib/ai/generate-with-gemini"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { loadAiGenerationContext } from "@/lib/services/ai-context.service"
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
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return ""

  const [context, directorArtifact] = await Promise.all([
    loadAiGenerationContext(project, "DIRECTOR_DAILY"),
    getLatestArtifact(projectId, "DIRECTOR_DAILY"),
  ])

  const lines = [context.promptBlock]
  if (directorArtifact) {
    lines.push(
      "",
      "--- ПОСЛЕДНИЙ АНАЛИЗ AI ДИРЕКТОРА ---",
      JSON.stringify(directorArtifact.payload).slice(0, 3_500)
    )
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
        maxTokens: 1024,
      })
      return { success: true, reply }
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
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
