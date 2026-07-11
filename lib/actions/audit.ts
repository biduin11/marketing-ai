"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canGenerateAi } from "@/lib/gates"
import { generateExpressAudit } from "@/lib/services/express-audit.service"
import { AUDIT_QUESTION_IDS } from "@/lib/audit-questions"
import type { GrowthPoint, QuickWin } from "@/lib/ai/schemas/express-audit"
import type { Prisma } from "@prisma/client"

export type AuditItem = {
  id: string
  answers: Record<string, number>
  score: number
  level: string
  summary: string
  growthPoints: GrowthPoint[]
  quickWins: QuickWin[]
  categoryScores: Record<string, number>
  createdAt: string
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function toItem(audit: {
  id: string
  answers: unknown
  score: number
  level: string
  summary: string
  growthPoints: unknown
  quickWins: unknown
  categoryScores: unknown
  createdAt: Date
}): AuditItem {
  return {
    id: audit.id,
    answers: audit.answers as Record<string, number>,
    score: audit.score,
    level: audit.level,
    summary: audit.summary,
    growthPoints: audit.growthPoints as GrowthPoint[],
    quickWins: audit.quickWins as QuickWin[],
    categoryScores: audit.categoryScores as Record<string, number>,
    createdAt: audit.createdAt.toISOString(),
  }
}

export async function getAudits(projectId: string): Promise<AuditItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return []

  const audits = await prisma.expressAudit.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
  return audits.map(toItem)
}

const answersSchema = z.record(z.string(), z.number().int().min(0).max(3)).refine(
  (answers) => AUDIT_QUESTION_IDS.every((id) => id in answers),
  { message: "Не хватает ответов на вопросы аудита" }
)

export async function runExpressAudit(
  projectId: string,
  answers: Record<string, number>
): Promise<ActionResult<AuditItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsedAnswers = answersSchema.safeParse(answers)
  if (!parsedAnswers.success) return { success: false, error: "Ошибка валидации ответов" }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return { success: false, error: "Проект не найден" }

  const gate = await canGenerateAi(session.user.id)
  if (!gate.allowed) {
    return { success: false, error: gate.reason ?? "Лимит генераций исчерпан" }
  }

  try {
    const { payload } = await generateExpressAudit(project, parsedAnswers.data)

    const audit = await prisma.expressAudit.create({
      data: {
        projectId,
        answers: parsedAnswers.data as Prisma.InputJsonValue,
        score: Math.round(payload.score),
        level: payload.level,
        summary: payload.summary,
        growthPoints: payload.growthPoints as Prisma.InputJsonValue,
        quickWins: payload.quickWins as Prisma.InputJsonValue,
        categoryScores: payload.categoryScores as Prisma.InputJsonValue,
      },
    })
    revalidatePath("/audit")
    return { success: true, data: toItem(audit) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось провести аудит"
    return { success: false, error: message }
  }
}
